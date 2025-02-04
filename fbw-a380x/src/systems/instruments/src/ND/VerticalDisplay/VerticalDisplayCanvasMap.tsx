import {
  Arinc429LocalVarConsumerSubject,
  ArincEventBus,
  NdSymbolTypeFlags,
  VerticalPathCheckpoint,
} from '@flybywiresim/fbw-sdk';
import {
  BitFlags,
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
import { GenericFcuEvents, VerticalDisplay } from 'instruments/src/ND/VerticalDisplay/VerticalDisplay';
import { VerticalDisplayWaypointLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayWaypointLayer';
import { VdPseudoWaypointLayer } from './VdPseudoWaypointLayer';
import { VerticalDisplayRunwayLayer } from 'instruments/src/ND/VerticalDisplay/VerticalDisplayRunwayLayer';

export interface VerticalDisplayCanvasMapProps {
  bus: ArincEventBus;
  visible: Subscribable<'block' | 'none'>;
  displayedFmsPath: Subscribable<VerticalPathCheckpoint[]>;
  vdRange: Subscribable<number>;
  verticalRange: Subscribable<[number, number]>;
}

export class VerticalDisplayCanvasMap extends DisplayComponent<VerticalDisplayCanvasMapProps> {
  private readonly subscriptions: Subscription[] = [];

  private readonly sub = this.props.bus.getArincSubscriber<
    GenericFcuEvents & NDSimvars & DmcLogicEvents & SimplaneValues & FmsSymbolsData & NDControlEvents
  >();

  private readonly fmsSymbols = ConsumerSubject.create(this.sub.on('symbols'), []);

  private readonly pposLat = Arinc429LocalVarConsumerSubject.create(this.sub.on('latitude'), 0);
  private readonly pposLon = Arinc429LocalVarConsumerSubject.create(this.sub.on('longitude'), 0);

  private readonly baroCorrectedAltitude = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('baroCorrectedAltitude'),
    0,
  );

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

    if (
      !context ||
      this.pposLat.get().isFailureWarning() ||
      this.pposLon.get().isFailureWarning() ||
      this.baroCorrectedAltitude.get().isFailureWarning()
    ) {
      return;
    }

    const sizeX = 540;
    const sizeY = 200;

    context.clearRect(0, 0, sizeX, sizeY);
    context.resetTransform();

    const vdRange = this.props.vdRange.get();
    const verticalRange = this.props.verticalRange.get();

    context.beginPath();
    context.strokeStyle = '#0f0';
    context.lineWidth = 2;

    context.moveTo(
      VerticalDisplayCanvasMap.distanceToX(0, vdRange),
      VerticalDisplayCanvasMap.altToY(this.baroCorrectedAltitude.get().value, verticalRange),
    );

    // Draw runway

    for (const pe of this.props.displayedFmsPath.get()) {
      context.lineTo(
        VerticalDisplayCanvasMap.distanceToX(pe.distanceFromAircraft, vdRange),
        VerticalDisplayCanvasMap.altToY(pe.altitude, verticalRange),
      );
    }
    context.stroke();

    this.waypointLayer.paintShadowLayer(context, this.props.vdRange.get(), this.props.verticalRange.get());
    this.waypointLayer.paintColorLayer(context, this.props.vdRange.get(), this.props.verticalRange.get());

    this.runwayLayer.paintShadowLayer(context, this.props.vdRange.get(), this.props.verticalRange.get());
    this.runwayLayer.paintColorLayer(context, this.props.vdRange.get(), this.props.verticalRange.get());

    this.pwpLayer.paintShadowLayer(context, this.props.vdRange.get(), this.props.verticalRange.get());
    this.pwpLayer.paintColorLayer(context, this.props.vdRange.get(), this.props.verticalRange.get());
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

    const runways = this.fmsSymbols.get().filter((it) => it.type & NdSymbolTypeFlags.Runway);

    this.runwayLayer.data = runways;

    const pseudoWaypoints = this.fmsSymbols
      .get()
      .filter((it) => it.type & (NdSymbolTypeFlags.PwpDecel | NdSymbolTypeFlags.PwpSpeedChange));

    this.pwpLayer.data = pseudoWaypoints;
  }

  public static distanceToX(distance: number, vdRange: number) {
    return (distance / vdRange) * 540;
  }

  public static altToY(alt: number, verticalRange: [number, number]) {
    return VerticalDisplay.altToY(alt, verticalRange) - 800;
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.props.displayedFmsPath.sub(() => this.handlePathFrame()),
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
        width={540}
        height={200}
        style={{
          width: '540px',
          height: '200px',
          position: 'absolute',
          top: '800px',
          left: '150px',
          visibility: this.pathVisibility,
        }}
      />
    );
  }
}
