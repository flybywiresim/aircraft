import {
  Arinc429LocalVarConsumerSubject,
  Arinc429WordData,
  ArincEventBus,
  EfisSide,
  FmsData,
  NdPwpSymbolTypeFlags,
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
import { GenericFmsEvents } from '../../../../../../../fbw-common/src/systems/instruments/src/ND/types/GenericFmsEvents';
import { GenericFcuEvents } from '@flybywiresim/navigation-display';
import { FGVars } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';
import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';

export interface VerticalDisplayCanvasMapProps extends ComponentProps {
  bus: ArincEventBus;
  side: EfisSide;
  visible: Subscribable<'block' | 'none'>;
  vdAvailable: Subscribable<boolean>;
  fmsTargetVdProfile: Subscribable<VerticalPathCheckpoint[]>;
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
      NDControlEvents &
      GenericFmsEvents &
      FGVars &
      FmsData &
      MfdSurvEvents
  >();

  private readonly fmsActualVdProfile = ConsumerSubject.create(this.sub.on('a32nx_fms_vertical_actual_profile'), []);
  private readonly fmsDescentVdProfile = ConsumerSubject.create(this.sub.on('a32nx_fms_vertical_descent_profile'), []);
  private readonly fmsConstraints = ConsumerSubject.create(this.sub.on('a32nx_fms_vertical_constraints'), []);

  private readonly fmsSymbols = ConsumerSubject.create(this.sub.on(`vdSymbols_${this.props.side}`), []);

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

  private readonly offsetDistance = this.props.fmsTargetVdProfile.map((_path) => 0);

  private readonly activeVerticalMode = ConsumerSubject.create(this.sub.on('fg.fma.verticalMode'), 0);

  private readonly mapRecomputing = ConsumerSubject.create(this.sub.on('set_map_recomputing'), false);

  private readonly pathVisibility = MappedSubject.create(
    ([mapVisible, vdAvailable, recomputing]) =>
      mapVisible === 'block' && vdAvailable && !recomputing ? 'visible' : 'hidden',
    this.props.visible,
    this.props.vdAvailable,
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

    context.strokeStyle = '#5bea06';
    context.lineWidth = 2;

    const targetIsDashed = this.fmsActualVdProfile.get().length > 1;

    if (this.props.fmsTargetVdProfile.get().length > 0) {
      context.beginPath();
      if (targetIsDashed) {
        context.setLineDash([10, 10]);
      }

      context.moveTo(
        VerticalDisplayCanvasMap.distanceToX(
          this.props.fmsTargetVdProfile.get()[0].distanceFromAircraft,
          vdRange,
          this.offsetDistance.get(),
        ),
        VerticalDisplayCanvasMap.altToY(this.props.fmsTargetVdProfile.get()[0].altitude, verticalRange),
      );

      for (const pe of this.props.fmsTargetVdProfile.get()) {
        context.lineTo(
          VerticalDisplayCanvasMap.distanceToX(pe.distanceFromAircraft, vdRange, this.offsetDistance.get()),
          VerticalDisplayCanvasMap.altToY(pe.altitude, verticalRange),
        );
      }
      context.stroke();
    }

    // FIXME add descent profile when its display conditions are better understood

    if (targetIsDashed) {
      context.beginPath();
      context.setLineDash([]);
      context.moveTo(
        VerticalDisplayCanvasMap.distanceToX(
          this.fmsActualVdProfile.get()[0].distanceFromAircraft,
          vdRange,
          this.offsetDistance.get(),
        ),
        VerticalDisplayCanvasMap.altToY(this.fmsActualVdProfile.get()[0].altitude, verticalRange),
      );

      for (const pe of this.fmsActualVdProfile.get()) {
        context.lineTo(
          VerticalDisplayCanvasMap.distanceToX(pe.distanceFromAircraft, vdRange, this.offsetDistance.get()),
          VerticalDisplayCanvasMap.altToY(pe.altitude, verticalRange),
        );
      }

      const lastElement = this.fmsActualVdProfile.get()[this.fmsActualVdProfile.get().length - 1];
      context.lineTo(
        VerticalDisplayCanvasMap.distanceToX(540, vdRange, this.offsetDistance.get()),
        VerticalDisplayCanvasMap.altToY(lastElement.altitude, verticalRange),
      );
      context.stroke();
    }

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

    const runways = this.fmsSymbols.get().filter((it) => it.type & NdSymbolTypeFlags.Runway && it.location); // FIXME: Need to somehow include runways in the vertical path, or filter out runways before the active leg

    this.runwayLayer.data = runways;

    const pseudoWaypoints = this.fmsSymbols
      .get()
      .filter((it) => it.typePwp && it.typePwp & (NdPwpSymbolTypeFlags.PwpDecel | NdPwpSymbolTypeFlags.PwpSpeedChange));

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
      this.props.fmsTargetVdProfile.sub(() => this.handlePathFrame()),
      this.fmsDescentVdProfile.sub(() => this.handlePathFrame()),
      this.fmsActualVdProfile.sub(() => this.handlePathFrame()),
      this.fmsSymbols.sub(() => {
        this.handleNewSymbols();
        this.handlePathFrame();
      }),
    );

    this.subscriptions.push(
      this.fmsActualVdProfile,
      this.fmsDescentVdProfile,
      this.fmsConstraints,
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
