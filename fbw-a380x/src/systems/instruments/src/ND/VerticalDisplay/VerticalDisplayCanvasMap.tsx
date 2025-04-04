import {
  Arinc429LocalVarConsumerSubject,
  Arinc429WordData,
  ArincEventBus,
  MathUtils,
  NdSymbolTypeFlags,
  VerticalPathCheckpoint,
} from '@flybywiresim/fbw-sdk';
import {
  BitFlags,
  ComponentProps,
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { DmcLogicEvents } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { SimplaneValues } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { FmsSymbolsData } from 'instruments/src/ND/FmsSymbolsPublisher';
import { NDControlEvents } from 'instruments/src/ND/NDControlEvents';
import { NDSimvars } from 'instruments/src/ND/NDSimvarPublisher';
import {
  VD_FPA_TO_DISPLAY_ANGLE,
  VERTICAL_DISPLAY_CANVAS_HEIGHT,
  VERTICAL_DISPLAY_CANVAS_WIDTH,
  VerticalDisplay,
} from 'instruments/src/ND/VerticalDisplay/VerticalDisplay';
import { VerticalDisplayWaypointLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayWaypointLayer';
import { VdPseudoWaypointLayer } from './VdPseudoWaypointLayer';
import { VerticalDisplayRunwayLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayRunwayLayer';
import { VerticalMode } from '@shared/autopilot';
import { bearingTo, Coordinates, distanceTo } from 'msfs-geo';
import { GenericFmsEvents } from '../../../../../../../fbw-common/src/systems/instruments/src/ND/types/GenericFmsEvents';
import { GenericFcuEvents } from '@flybywiresim/navigation-display';
import { FGVars } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { A380XFcuBusEvents } from 'instruments/src/MsfsAvionicsCommon/providers/A380XFcuBusPublisher';

export interface VerticalDisplayCanvasMapProps extends ComponentProps {
  bus: ArincEventBus;
  visible: Subscribable<'block' | 'none'>;
  fmsVerticalPath: Subscribable<VerticalPathCheckpoint[]>;
  vdRange: Subscribable<number>;
  verticalRange: Subscribable<[number, number]>;
  isSelectedVerticalMode: Subscribable<boolean>;
  shouldShowTrackLine: Subscribable<boolean>;
  selectedAltitude: Subscribable<number>;
  fpa: Subscribable<Arinc429WordData>;
}

export class VerticalDisplayCanvasMap extends DisplayComponent<VerticalDisplayCanvasMapProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getArincSubscriber<
    GenericFcuEvents &
      NDSimvars &
      DmcLogicEvents &
      SimplaneValues &
      FmsSymbolsData &
      NDControlEvents &
      GenericFmsEvents &
      FGVars &
      A380XFcuBusEvents
  >();

  private readonly fmsSymbols = ConsumerSubject.create(this.sub.on('symbols'), []);

  private readonly pposLat = Arinc429LocalVarConsumerSubject.create(this.sub.on('latitude'), 0);
  private readonly pposLon = Arinc429LocalVarConsumerSubject.create(this.sub.on('longitude'), 0);

  private readonly baroCorrectedAltitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('baroCorrectedAltitude'),
    0,
  );

  public readonly canvasInvalid = MappedSubject.create(
    ([lat, long, baro]) => lat.isFailureWarning() || long.isFailureWarning() || baro.isFailureWarning(),
    this.pposLat,
    this.pposLon,
    this.baroCorrectedAltitude,
  );

  private readonly offsetDistance = this.props.fmsVerticalPath.map((_path) => 0);

  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('fg.fma.verticalMode'), 0);
  private readonly selectedVs = ConsumerSubject.create(this.sub.on('a380x_fcu_selected_vertical_speed'), 0);
  private readonly selectedFpa = ConsumerSubject.create(this.sub.on('a380x_fcu_selected_fpa'), 0);
  private readonly groundSpeed = Arinc429LocalVarConsumerSubject.create(this.sub.on('groundSpeed'), 0); // FIXME ADIRS selection for ND not implemented yet

  private readonly mapRecomputing = ConsumerSubject.create(this.sub.on('set_map_recomputing'), false);

  private readonly pathVisibility = MappedSubject.create(
    ([mapVisible, recomputing]) => (mapVisible === 'block' && !recomputing ? 'visible' : 'hidden'),
    this.props.visible,
    this.mapRecomputing,
  );

  private readonly canvasRef = FSComponent.createRef<HTMLCanvasElement>();

  private readonly waypointLayer = new VerticalDisplayWaypointLayer();

  private readonly runwayLayer = new VerticalDisplayRunwayLayer();

  private readonly pwpLayer = new VdPseudoWaypointLayer();

  private handlePathFrame() {
    const canvas = this.canvasRef.instance;
    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    context.clearRect(0, 0, VERTICAL_DISPLAY_CANVAS_WIDTH, VERTICAL_DISPLAY_CANVAS_HEIGHT);
    context.resetTransform();

    if (
      this.pposLat.get().isFailureWarning() ||
      this.pposLon.get().isFailureWarning() ||
      this.baroCorrectedAltitude.get().isFailureWarning()
    ) {
      return;
    }

    const vdRange = this.props.vdRange.get();
    const verticalRange = this.props.verticalRange.get();

    context.beginPath();
    context.strokeStyle = '#0f0';
    context.lineWidth = 2;
    context.setLineDash([]);

    if (this.props.isSelectedVerticalMode.get() && !this.props.fpa.get().isFailureWarning()) {
      // Draw selected path, FPA until selected alt
      context.moveTo(
        VerticalDisplayCanvasMap.distanceToX(0, vdRange, this.offsetDistance.get()),
        VerticalDisplayCanvasMap.altToY(this.baroCorrectedAltitude.get().value, verticalRange),
      );

      let selectedVerticalAngle = this.props.fpa.get().valueOr(0) * VD_FPA_TO_DISPLAY_ANGLE;
      switch (this.activeVerticalMode.get()) {
        case VerticalMode.VS:
          selectedVerticalAngle =
            !this.groundSpeed.get().isFailureWarning() && this.groundSpeed.get().value > 10
              ? Math.sign(this.selectedVs.get()) *
                Math.atan2(this.groundSpeed.get().value, this.selectedVs.get()) *
                VD_FPA_TO_DISPLAY_ANGLE
              : 0;
          break;
        case VerticalMode.FPA:
          selectedVerticalAngle = this.selectedFpa.get() * VD_FPA_TO_DISPLAY_ANGLE;
          break;
        default:
          selectedVerticalAngle = this.props.fpa.get().valueOr(0) * VD_FPA_TO_DISPLAY_ANGLE;
          break;
      }
      const selectedM = Math.tan(selectedVerticalAngle * MathUtils.DEGREES_TO_RADIANS);
      const fpaY = (x: number) =>
        selectedM * x + VerticalDisplayCanvasMap.altToY(this.baroCorrectedAltitude.get().value, verticalRange);

      const isConstrained =
        (selectedVerticalAngle > 0 && this.props.selectedAltitude.get() > this.baroCorrectedAltitude.get().value) ||
        (selectedVerticalAngle < 0 && this.props.selectedAltitude.get() < this.baroCorrectedAltitude.get().value);

      const vsMatchesTarget = Math.sign(selectedVerticalAngle) === Math.sign(this.props.fpa.get().value);

      if (isConstrained && vsMatchesTarget) {
        // Draw current FPA until constraint, then the constraint alt
        const altInterceptDistance =
          (this.props.selectedAltitude.get() - this.baroCorrectedAltitude.get().value) /
          MathUtils.FEET_TO_NAUTICAL_MILES /
          Math.sin(this.props.fpa.get().value * MathUtils.DEGREES_TO_RADIANS);

        context.lineTo(
          VerticalDisplayCanvasMap.distanceToX(altInterceptDistance, this.props.vdRange.get()),
          VerticalDisplayCanvasMap.altToY(this.props.selectedAltitude.get(), verticalRange),
        );
        context.lineTo(
          VERTICAL_DISPLAY_CANVAS_WIDTH,
          VerticalDisplayCanvasMap.altToY(this.props.selectedAltitude.get(), verticalRange),
        );
      } else {
        // Draw current FPA
        context.lineTo(VERTICAL_DISPLAY_CANVAS_WIDTH, fpaY(VERTICAL_DISPLAY_CANVAS_WIDTH));
      }

      context.stroke();
      context.setLineDash([10, 10]);
    } else if (
      this.props.shouldShowTrackLine.get() &&
      (this.activeVerticalMode.get() === VerticalMode.ALT || this.activeVerticalMode.get() === VerticalMode.ALT_CPT)
    ) {
      context.moveTo(
        VerticalDisplayCanvasMap.distanceToX(0, vdRange, this.offsetDistance.get()),
        VerticalDisplayCanvasMap.altToY(this.baroCorrectedAltitude.get().value, verticalRange),
      );
      context.lineTo(
        VERTICAL_DISPLAY_CANVAS_WIDTH,
        VerticalDisplayCanvasMap.altToY(this.baroCorrectedAltitude.get().value, verticalRange),
      );
      context.stroke();
      context.setLineDash([10, 10]);
    }

    if (this.props.fmsVerticalPath.get().length > 0) {
      context.moveTo(
        VerticalDisplayCanvasMap.distanceToX(
          this.props.fmsVerticalPath.get()[0].distanceFromAircraft,
          vdRange,
          this.offsetDistance.get(),
        ),
        VerticalDisplayCanvasMap.altToY(this.baroCorrectedAltitude.get().value, verticalRange),
      );

      for (const pe of this.props.fmsVerticalPath.get()) {
        context.lineTo(
          VerticalDisplayCanvasMap.distanceToX(pe.distanceFromAircraft, vdRange, this.offsetDistance.get()),
          VerticalDisplayCanvasMap.altToY(pe.altitude, verticalRange),
        );
      }
      context.stroke();
    }
    context.setLineDash([]);

    this.waypointLayer.paintShadowLayer(
      context,
      this.props.vdRange.get(),
      this.props.verticalRange.get(),
      this.offsetDistance.get(),
      this.props.isSelectedVerticalMode.get(),
    );
    this.waypointLayer.paintColorLayer(
      context,
      this.props.vdRange.get(),
      this.props.verticalRange.get(),
      this.offsetDistance.get(),
      this.props.isSelectedVerticalMode.get(),
    );

    this.runwayLayer.paintShadowLayer(
      context,
      this.props.vdRange.get(),
      this.props.verticalRange.get(),
      this.offsetDistance.get(),
    );
    this.runwayLayer.paintColorLayer(
      context,
      this.props.vdRange.get(),
      this.props.verticalRange.get(),
      this.offsetDistance.get(),
    );

    this.pwpLayer.paintShadowLayer(
      context,
      this.props.vdRange.get(),
      this.props.verticalRange.get(),
      this.offsetDistance.get(),
    );
    this.pwpLayer.paintColorLayer(
      context,
      this.props.vdRange.get(),
      this.props.verticalRange.get(),
      this.offsetDistance.get(),
    );
  }

  private handleNewSymbols() {
    const waypoints = this.fmsSymbols
      .get()
      .filter(
        (it) =>
          it.altConstraint ||
          (BitFlags.isAny(it.type, NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.FlightPlan) &&
            !(it.type & NdSymbolTypeFlags.Runway)),
      );

    this.waypointLayer.data = waypoints;
    const ppos: Coordinates = { lat: this.pposLat.get().value, long: this.pposLon.get().value };

    const runways = this.fmsSymbols
      .get()
      .filter(
        (it) =>
          it.type & NdSymbolTypeFlags.Runway &&
          it.location &&
          (bearingTo(ppos, it.location) < 30 || distanceTo(ppos, it.location) < 10),
      ); // FIXME: Need to somehow include runways in the vertical path, or filter out runways before the active leg

    this.runwayLayer.data = runways;

    const pseudoWaypoints = this.fmsSymbols
      .get()
      .filter((it) => it.type & (NdSymbolTypeFlags.PwpDecel | NdSymbolTypeFlags.PwpSpeedChange));

    this.pwpLayer.data = pseudoWaypoints;
  }

  public static distanceToX(distance: number, vdRange: number, offsetDistance: number = 0) {
    return ((distance + offsetDistance) / vdRange) * 540;
  }

  public static altToY(alt: number, verticalRange: [number, number]) {
    return VerticalDisplay.altToY(alt, verticalRange) - 800;
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.props.fmsVerticalPath.sub(() => this.handlePathFrame()),
      this.fmsSymbols.sub(() => {
        this.handleNewSymbols();
        this.handlePathFrame();
      }),
    );

    this.subscriptions.push(
      this.fmsSymbols,
      this.pposLat,
      this.pposLon,
      this.baroCorrectedAltitude,
      this.activeVerticalMode,
      this.mapRecomputing,
      this.pathVisibility,
    );
  }

  destroy(): void {
    for (const s of this.subscriptions) {
      s.destroy();
    }

    super.destroy();
  }

  render(): VNode {
    return (
      <canvas
        ref={this.canvasRef}
        width={VERTICAL_DISPLAY_CANVAS_WIDTH}
        height={VERTICAL_DISPLAY_CANVAS_HEIGHT}
        style={{
          width: `${VERTICAL_DISPLAY_CANVAS_WIDTH}px`,
          height: `${VERTICAL_DISPLAY_CANVAS_HEIGHT}px`,
          position: 'absolute',
          top: '800px',
          left: '150px',
          visibility: this.pathVisibility,
        }}
      />
    );
  }
}
