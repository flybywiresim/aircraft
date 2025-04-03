// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  BitFlags,
  ClockEvents,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  Subscribable,
  VNode,
} from '@microsoft/msfs-sdk';
import {
  EfisNdMode,
  EfisVectorsGroup,
  NdSymbol,
  NdSymbolTypeFlags,
  NdTraffic,
  MathUtils,
  PathVector,
} from '@flybywiresim/fbw-sdk';

import { Coordinates, distanceTo } from 'msfs-geo';
import { FmsSymbolsData } from '../../FmsSymbolsPublisher';
import { MapParameters } from '../utils/MapParameters';
import { NDSimvars } from '../../NDSimvarPublisher';
import { WaypointLayer } from './WaypointLayer';
import { ConstraintsLayer } from './ConstraintsLayer';
import { RunwayLayer } from './RunwayLayer';
import { TrafficLayer } from './TrafficLayer';
import { FixInfoLayer } from './FixInfoLayer';
import { NDControlEvents } from '../../NDControlEvents';
import { PseudoWaypointLayer } from './PseudoWaypointLayer';
import { GenericFcuEvents } from '../../types/GenericFcuEvents';
import { MapOptions } from '../../types/MapOptions';

// TODO move this somewhere better, need to move TCAS stuff into fbw-sdk
enum TaRaIntrusion {
  TRAFFIC = 0,
  PROXIMITY = 1,
  TA = 2,
  RA = 3,
}

const ARC_CLIP = new Path2D(
  'M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312',
);

const ROSE_CLIP = new Path2D(
  'M45,155 L282,155 a250,250 0 0 1 204,0 L723,155 L723,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L45,625 L45,155',
);

const PLAN_CLIP = new Path2D('M45,112 L140 112 280 56 488 56 628 112 723 112 723 720 114 720 114 633 45 633z');

const DEFAULT_CLIP = new Path2D(
  'M0,312 a492,492 0 0 1 768,0 L768,562 L648,562 L591,625 L591,768 L174,768 L174,683 L122,625 L0,625 L0,312',
);

const DASHES = [15, 12];
const NO_DASHES = [];

export interface CanvasMapProps {
  bus: EventBus;
  x: Subscribable<number>;
  y: Subscribable<number>;
  options?: Partial<MapOptions>;
}

export class CanvasMap extends DisplayComponent<CanvasMapProps> {
  private readonly canvasRef = FSComponent.createRef<HTMLCanvasElement>();

  private readonly touchContainerRef = FSComponent.createRef<HTMLDivElement>();

  private readonly mapCenterLat = Subject.create<number>(-1);

  private readonly mapCenterLong = Subject.create<number>(-1);

  private readonly mapCenterYBias = Subject.create<number>(-1);

  private readonly mapRotation = Subject.create<number>(-1);

  private readonly mapPixelRadius = Subject.create<number>(-1);

  private readonly mapRangeRadius = Subject.create<number>(-1);

  private readonly mapMode = Subject.create<EfisNdMode | -1>(-1);

  private readonly mapVisible = Subject.create<boolean>(false);

  private readonly mapRecomputing = Subject.create<boolean>(false);

  private readonly vectors: { [k in EfisVectorsGroup]: PathVector[] } = {
    [EfisVectorsGroup.ACTIVE]: [],
    [EfisVectorsGroup.DASHED]: [],
    [EfisVectorsGroup.OFFSET]: [],
    [EfisVectorsGroup.TEMPORARY]: [],
    [EfisVectorsGroup.SECONDARY]: [],
    [EfisVectorsGroup.SECONDARY_DASHED]: [],
    [EfisVectorsGroup.MISSED]: [],
    [EfisVectorsGroup.ALTERNATE]: [],
    [EfisVectorsGroup.ACTIVE_EOSID]: [],
  };

  private readonly symbols: NdSymbol[] = [];

  private readonly traffic: NdTraffic[] = [];

  private readonly mapParams = new MapParameters();

  public pointerX = 0;

  public pointerY = 0;

  private readonly constraintsLayer = new ConstraintsLayer();

  private readonly waypointLayer = new WaypointLayer(this, this.props.options);

  private readonly fixInfoLayer = new FixInfoLayer();

  private readonly runwayLayer = new RunwayLayer();

  private readonly pwpLayer = new PseudoWaypointLayer(this.props.bus);

  private readonly trafficLayer = new TrafficLayer(this);

  private lastFrameTimestamp: number = 0;

  onAfterRender(node: VNode) {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<NDControlEvents & GenericFcuEvents>();

    sub.on('set_show_map').handle((show) => this.mapVisible.set(show));
    sub.on('set_map_recomputing').handle((show) => this.mapRecomputing.set(show));
    sub.on('set_map_center_lat').handle((v) => this.mapCenterLat.set(v));
    sub.on('set_map_center_lon').handle((v) => this.mapCenterLong.set(v));
    sub.on('set_map_center_y_bias').handle((v) => this.mapCenterYBias.set(v));
    sub.on('set_map_up_course').handle((v) => this.mapRotation.set(v));
    sub.on('set_map_pixel_radius').handle((v) => this.mapPixelRadius.set(v));
    sub.on('set_map_range_radius').handle((v) => this.mapRangeRadius.set(v));
    // sub.on('set_map_efis_mode').handle((v) => this.mapMode.set(v));

    sub
      .on('ndMode')
      .whenChanged()
      .handle((v) => this.mapMode.set(v));

    this.setupCallbacks();
    this.setupEvents();
  }

  private setupCallbacks() {
    const sub = this.props.bus.getSubscriber<NDSimvars & FmsSymbolsData & ClockEvents>();

    this.mapCenterLat.sub(() => {
      this.handleRecomputeMapParameters();
    });

    this.mapCenterLong.sub(() => {
      this.handleRecomputeMapParameters();
    });

    this.mapCenterYBias.sub(() => {
      this.handleRecomputeMapParameters();
    });

    this.mapRotation.sub(() => {
      this.handleRecomputeMapParameters();
    });

    this.mapPixelRadius.sub(() => {
      this.handleRecomputeMapParameters();
    });

    this.mapRangeRadius.sub(() => {
      this.handleRecomputeMapParameters();
    });

    MappedSubject.create(
      ([mapVisible, recomputing]) => {
        const visible = mapVisible && !recomputing;

        this.canvasRef.instance.style.visibility = visible ? 'visible' : 'hidden';
      },
      this.mapVisible,
      this.mapRecomputing,
    );

    sub.on('symbols').handle((data: NdSymbol[]) => {
      this.handleNewSymbols(data);
    });

    sub.on('vectorsActive').handle((data: PathVector[]) => {
      this.vectors[EfisVectorsGroup.ACTIVE].length = 0;
      if (data) {
        this.vectors[EfisVectorsGroup.ACTIVE].push(...data);
      }
    });

    sub.on('vectorsDashed').handle((data: PathVector[]) => {
      this.vectors[EfisVectorsGroup.DASHED].length = 0;
      if (data) {
        this.vectors[EfisVectorsGroup.DASHED].push(...data);
      }
    });

    sub.on('vectorsTemporary').handle((data: PathVector[]) => {
      this.vectors[EfisVectorsGroup.TEMPORARY].length = 0;
      if (data) {
        this.vectors[EfisVectorsGroup.TEMPORARY].push(...data);
      }
    });

    sub.on('vectorsMissed').handle((data: PathVector[]) => {
      this.vectors[EfisVectorsGroup.MISSED].length = 0;
      if (data) {
        this.vectors[EfisVectorsGroup.MISSED].push(...data);
      }
    });

    sub.on('vectorsAlternate').handle((data: PathVector[]) => {
      this.vectors[EfisVectorsGroup.ALTERNATE].length = 0;
      if (data) {
        this.vectors[EfisVectorsGroup.ALTERNATE].push(...data);
      }
    });

    sub.on('vectorsSecondary').handle((data: PathVector[]) => {
      this.vectors[EfisVectorsGroup.SECONDARY].length = 0;
      if (data) {
        this.vectors[EfisVectorsGroup.SECONDARY].push(...data);
      }
    });

    sub.on('traffic').handle((data: NdTraffic[]) => {
      this.handleNewTraffic(data);
    });

    sub
      .on('simTime')
      .whenChangedBy(8)
      .handle((value) => {
        this.handleFrame(value - this.lastFrameTimestamp);

        this.lastFrameTimestamp = value;
      });
  }

  private setupEvents() {
    const touchContainer = this.touchContainerRef.instance;

    touchContainer.addEventListener('mousemove', (e) => {
      this.pointerX = e.offsetX;
      this.pointerY = e.offsetY;
    });
  }

  private handleRecomputeMapParameters() {
    this.mapParams.compute(
      { lat: this.mapCenterLat.get(), long: this.mapCenterLong.get() },
      this.mapCenterYBias.get(),
      this.mapRangeRadius.get(),
      this.mapPixelRadius.get(),
      this.mapRotation.get(),
    );
  }

  private handleNewSymbols(symbols: NdSymbol[]) {
    this.symbols.length = 0;
    this.symbols.push(...symbols);

    const waypoints = this.symbols.filter(
      (it) =>
        it.constraints ||
        (BitFlags.isAny(
          it.type,
          NdSymbolTypeFlags.Waypoint |
            NdSymbolTypeFlags.FlightPlan |
            NdSymbolTypeFlags.FixInfo |
            NdSymbolTypeFlags.VorDme |
            NdSymbolTypeFlags.Vor |
            NdSymbolTypeFlags.Dme |
            NdSymbolTypeFlags.Ndb |
            NdSymbolTypeFlags.Airport,
        ) &&
          !(it.type & NdSymbolTypeFlags.Runway)),
    );

    this.waypointLayer.data = waypoints;

    const fixInfoSymbols = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.FixInfo);

    this.fixInfoLayer.data = fixInfoSymbols;

    const constraints = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.Constraint);

    this.constraintsLayer.data = constraints;

    const runways = this.symbols.filter((it) => it.type & NdSymbolTypeFlags.Runway);

    this.runwayLayer.data = runways;

    const pseudoWaypoints = this.symbols.filter(
      (it) =>
        it.type &
        (NdSymbolTypeFlags.PwpStartOfClimb |
          NdSymbolTypeFlags.PwpClimbLevelOff |
          NdSymbolTypeFlags.PwpTopOfDescent |
          NdSymbolTypeFlags.PwpDescentLevelOff |
          NdSymbolTypeFlags.PwpInterceptProfile |
          NdSymbolTypeFlags.PwpCdaFlap1 |
          NdSymbolTypeFlags.PwpCdaFlap2 |
          NdSymbolTypeFlags.PwpDecel |
          NdSymbolTypeFlags.PwpTimeMarker |
          NdSymbolTypeFlags.PwpSpeedChange |
          NdSymbolTypeFlags.CourseReversalLeft |
          NdSymbolTypeFlags.CourseReversalRight),
    );

    this.pwpLayer.data = pseudoWaypoints;
  }

  private handleNewTraffic(newTraffic: NdTraffic[]) {
    this.traffic.length = 0; // Reset traffic display
    if (this.mapMode.get() !== EfisNdMode.PLAN) {
      newTraffic.forEach((intruder: NdTraffic) => {
        const latLong: Coordinates = { lat: intruder.lat, long: intruder.lon };
        let [x, y] = this.mapParams.coordinatesToXYy(latLong);

        let tcasMask;
        switch (this.mapMode.get()) {
          case EfisNdMode.ARC:
            tcasMask = [
              [-384, -83],
              [-384, 227],
              [-264, 227],
              [-210, 286],
              [-210, 370],
              [210, 370],
              [210, 227],
              [267, 166],
              [384, 166],
              [384, -83],
              [340, -128],
              [300, -163],
              [240, -204.5],
              [180, -233],
              [100, -255],
              [0, -265],
              [-100, -255],
              [-180, -233],
              [-240, -204.5],
              [-300, -163],
              [-340, -128],
              [-384, -83],
            ];
            break;
          case EfisNdMode.ROSE_NAV:
          case EfisNdMode.ROSE_ILS:
          case EfisNdMode.ROSE_VOR:
            tcasMask = [
              [-340, -227],
              [-103, -227],
              [-50, -244],
              [0, -250],
              [50, -244],
              [103, -227],
              [340, -227],
              [340, 180],
              [267, 180],
              [210, 241],
              [210, 383],
              [-210, 383],
              [-210, 300],
              [-264, 241],
              [-340, 241],
              [-340, -227],
            ];
            break;
          default:
            break;
        }

        // Full time option installed: For all ranges except in ZOOM ranges NDRange > 9NM
        if (tcasMask !== undefined && !MathUtils.pointInPolygon(x, y, tcasMask)) {
          if (intruder.intrusionLevel < TaRaIntrusion.TA) {
            // Remove if beyond viewable range
            return;
          }
          const ret: [number, number] | null = MathUtils.intersectWithPolygon(x, y, 0, 0, tcasMask);
          if (ret) [x, y] = ret;
        }
        intruder.posX = x;
        intruder.posY = y;
        this.traffic.push(intruder);
      });
    }
    this.trafficLayer.data = this.traffic; // Populate with new traffic
  }

  private handleFrame(_deltaTime: number) {
    const canvas = this.canvasRef.instance;
    const context = canvas.getContext('2d');

    const size = 768;

    context.clearRect(0, 0, size, size);

    switch (this.mapMode.get()) {
      case EfisNdMode.ARC:
        context.clip(ARC_CLIP);
        break;
      case EfisNdMode.ROSE_NAV:
      case EfisNdMode.ROSE_ILS:
      case EfisNdMode.ROSE_VOR:
        context.clip(ROSE_CLIP);
        break;
      case EfisNdMode.PLAN:
        context.clip(PLAN_CLIP);
        break;
      default:
        context.clip(DEFAULT_CLIP);
        break;
    }
    context.resetTransform();

    this.constraintsLayer.paintShadowLayer(context, size, size, this.mapParams);
    this.constraintsLayer.paintColorLayer(context, size, size, this.mapParams);

    for (const key in this.vectors) {
      if (this.vectors[key].length > 0) {
        context.beginPath();
        for (const vector of this.vectors[key]) {
          this.drawVector(context, vector, parseInt(key));
        }
        context.stroke();
      }
    }
    // reset line dash
    context.setLineDash(NO_DASHES);

    this.waypointLayer.paintShadowLayer(context, size, size, this.mapParams);
    this.waypointLayer.paintColorLayer(context, size, size, this.mapParams);

    this.fixInfoLayer.paintShadowLayer(context, size, size, this.mapParams);
    this.fixInfoLayer.paintColorLayer(context, size, size, this.mapParams);

    this.runwayLayer.paintShadowLayer(context, size, size, this.mapParams);
    this.runwayLayer.paintColorLayer(context, size, size, this.mapParams);

    this.pwpLayer.paintShadowLayer(context, size, size, this.mapParams);
    this.pwpLayer.paintColorLayer(context, size, size, this.mapParams);

    this.trafficLayer.paintShadowLayer(context, size, size);
    this.trafficLayer.paintColorLayer(context, size, size);
  }

  private drawVector(context: CanvasRenderingContext2D, vector: PathVector, group: EfisVectorsGroup) {
    switch (group) {
      case EfisVectorsGroup.ACTIVE:
        context.strokeStyle = '#0f0';
        context.setLineDash(NO_DASHES);
        break;
      case EfisVectorsGroup.DASHED:
        context.strokeStyle = '#0f0';
        context.setLineDash(DASHES);
        break;
      case EfisVectorsGroup.TEMPORARY:
        context.strokeStyle = '#ffff00';
        context.setLineDash(DASHES);
        break;
      case EfisVectorsGroup.MISSED:
        context.strokeStyle = '#00ffff';
        context.setLineDash(NO_DASHES);
        break;
      case EfisVectorsGroup.ALTERNATE:
        context.strokeStyle = '#00ffff';
        context.setLineDash(DASHES);
        break;
      case EfisVectorsGroup.SECONDARY:
        context.strokeStyle = '#ffffff';
        context.setLineDash(NO_DASHES);
        break;
      default:
        context.strokeStyle = '#f00';
        context.setLineDash(NO_DASHES);
        break;
    }

    context.lineWidth = 1.75;

    const size = 768;

    switch (vector.type) {
      case 0: {
        const [sx, sy] = this.mapParams.coordinatesToXYy(vector.startPoint);
        const rsx = sx + size / 2;
        const rsy = sy + size / 2;

        const [ex, ey] = this.mapParams.coordinatesToXYy(vector.endPoint);
        const rex = ex + size / 2;
        const rey = ey + size / 2;

        context.moveTo(rsx, rsy);
        context.lineTo(rex, rey);
        break;
      }
      case 1: {
        const [sx, sy] = this.mapParams.coordinatesToXYy(vector.startPoint);
        const rsx = sx + size / 2;
        const rsy = sy + size / 2;

        const [ex, ey] = this.mapParams.coordinatesToXYy(vector.endPoint);
        const rex = ex + size / 2;
        const rey = ey + size / 2;

        const pathRadius = distanceTo(vector.centrePoint, vector.endPoint) * this.mapParams.nmToPx;

        // TODO find a way to batch that as well?
        // TODO beginPath needed here?
        context.stroke(
          new Path2D(
            `M ${rsx} ${rsy} A ${pathRadius} ${pathRadius} 0 ${Math.abs(vector.sweepAngle) >= 180 ? 1 : 0} ${vector.sweepAngle > 0 ? 1 : 0} ${rex} ${rey}`,
          ),
        );

        break;
      }
      default:
        break;
    }
  }

  render(): VNode | null {
    return (
      <>
        <canvas
          ref={this.canvasRef}
          width={768}
          height={768}
          class="nd-canvas-map"
          style={MappedSubject.create(
            ([r, x, y]) => {
              return `width: ${r}px; height: ${r}px; position: absolute; top: 0; left: 0; transform: translate(${-(r / 2) + x}px, ${-(r / 2) + y}px)`;
            },
            Subject.create(768),
            this.props.x,
            this.props.y,
          )}
        />
        <div
          ref={this.touchContainerRef}
          style={MappedSubject.create(
            ([r, x, y]) => {
              return `width: ${r}px; height: ${r}px; position: absolute; top: 0; left: 0; transform: translate(${-(r / 2) + x}px, ${-(r / 2) + y}px)`;
            },
            Subject.create(768),
            this.props.x,
            this.props.y,
          )}
        />
      </>
    );
  }
}
