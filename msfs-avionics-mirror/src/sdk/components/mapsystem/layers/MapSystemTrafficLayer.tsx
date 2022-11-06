import { GeoPoint, GeoPointInterface } from '../../../geo';
import { BitFlags, NumberUnitInterface, ReadonlyFloat64Array, UnitFamily, UnitType, VecNMath, VecNSubject } from '../../../math';
import { Subject } from '../../../sub/Subject';
import { Subscribable } from '../../../sub/Subscribable';
import { MutableSubscribableSet } from '../../../sub/SubscribableSet';
import { TcasAlertLevel, TcasEvents, TcasIntruder, TcasOperatingMode } from '../../../traffic';
import { FSComponent, VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps, MapProjection, MapProjectionChangeType, MapSyncedCanvasLayer } from '../../map';
import { MapOwnAirplanePropsModule } from '../../map/modules/MapOwnAirplanePropsModule';
import { MapSystemContext } from '../MapSystemContext';
import { MapSystemKeys } from '../MapSystemKeys';
import { ControllerRecord, LayerRecord } from '../MapSystemTypes';
import { MapTrafficAlertLevelVisibility, MapTrafficModule } from '../modules/MapTrafficModule';

/**
 * Modules required by MapSystemTrafficLayer.
 */
export interface MapSystemTrafficLayerModules {
  /** Traffic module. */
  [MapSystemKeys.Traffic]: MapTrafficModule;
}

/**
 * A map icon for a TCAS intruder.
 */
export interface MapTrafficIntruderIcon {
  /** This icon's associated intruder. */
  readonly intruder: TcasIntruder;

  /** The projected position of this icon's intruder, in pixel coordinates, at the time it was last drawn. */
  readonly projectedPos: ReadonlyFloat64Array;

  /** Whether this icon's intruder is off-scale at the time it was last drawn. */
  readonly isOffScale: boolean;

  /**
   * Draws this icon.
   * @param projection The map projection.
   * @param context The canvas rendering context to which to draw.
   * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
   * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
   */
  draw(projection: MapProjection, context: CanvasRenderingContext2D, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void;
}

/**
 * A function which creates map icons for TCAS intruders.
 * @param intruder The intruder for which to create an icon.
 * @param context The context of the icon's parent map.
 */
export type MapTrafficIntruderIconFactory<Modules = any, Layers extends LayerRecord = any, Controllers extends ControllerRecord = any, Context = any>
  = (intruder: TcasIntruder, context: MapSystemContext<Modules, Layers, Controllers, Context>) => MapTrafficIntruderIcon;

/**
 * Component props for MapSystemTrafficLayer.
 */
export interface MapSystemTrafficLayerProps extends MapLayerProps<MapSystemTrafficLayerModules> {
  /** The context of the layer's parent map. */
  context: MapSystemContext<any, any, any, any>;

  /** A function which creates icons for intruders. */
  iconFactory: MapTrafficIntruderIconFactory;

  /**
   * A function which initializes global canvas styles for the layer.
   * @param context The canvas rendering context for which to initialize styles.
   */
  initCanvasStyles?: (context: CanvasRenderingContext2D) => void;

  /** A subscribable set to update with off-scale intruders. */
  offScaleIntruders?: MutableSubscribableSet<TcasIntruder>;

  /**
   * A subscribable set to update with intruders that are not off-scale but whose projected positions are considered
   * out-of-bounds.
   */
  oobIntruders?: MutableSubscribableSet<TcasIntruder>;

  /**
   * A subscribable which provides the offset of the intruder out-of-bounds boundaries relative to the boundaries of
   * the map's projected window, as `[left, top, right, bottom]` in pixels. Positive offsets are directed toward the
   * center of the map. Defaults to `[0, 0, 0, 0]`.
   */
  oobOffset?: Subscribable<ReadonlyFloat64Array>;
}

/**
 * A map layer which displays traffic intruders.
 */
export class MapSystemTrafficLayer extends MapLayer<MapSystemTrafficLayerProps> {
  private static readonly DRAW_GROUPS = [
    { alertLevelVisFlag: MapTrafficAlertLevelVisibility.Other, alertLevel: TcasAlertLevel.None },
    { alertLevelVisFlag: MapTrafficAlertLevelVisibility.ProximityAdvisory, alertLevel: TcasAlertLevel.ProximityAdvisory },
    { alertLevelVisFlag: MapTrafficAlertLevelVisibility.TrafficAdvisory, alertLevel: TcasAlertLevel.TrafficAdvisory },
    { alertLevelVisFlag: MapTrafficAlertLevelVisibility.ResolutionAdvisory, alertLevel: TcasAlertLevel.ResolutionAdvisory },
  ];

  private readonly iconLayerRef = FSComponent.createRef<MapSyncedCanvasLayer<any>>();

  private readonly trafficModule = this.props.model.getModule(MapSystemKeys.Traffic);

  private readonly intruderIcons = {
    [TcasAlertLevel.None]: new Map<TcasIntruder, MapTrafficIntruderIcon>(),
    [TcasAlertLevel.ProximityAdvisory]: new Map<TcasIntruder, MapTrafficIntruderIcon>(),
    [TcasAlertLevel.TrafficAdvisory]: new Map<TcasIntruder, MapTrafficIntruderIcon>(),
    [TcasAlertLevel.ResolutionAdvisory]: new Map<TcasIntruder, MapTrafficIntruderIcon>()
  };

  private readonly needHandleOffscaleOob = this.props.offScaleIntruders !== undefined || this.props.oobIntruders !== undefined;
  private readonly oobOffset = this.props.oobOffset ?? Subject.create(VecNMath.create(4));

  private readonly oobBounds = VecNSubject.createFromVector(VecNMath.create(4));

  private isInit = false;

  /** @inheritdoc */
  public onVisibilityChanged(isVisible: boolean): void {
    if (!isVisible) {
      if (this.isInit) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.iconLayerRef.instance.display!.clear();
      }

      this.props.offScaleIntruders?.clear();
      this.props.oobIntruders?.clear();
    }
  }

  /** @inheritdoc */
  public onAttached(): void {
    this.iconLayerRef.instance.onAttached();

    this.oobOffset.sub(this.updateOobBounds.bind(this), true);

    this.trafficModule.operatingMode.sub(this.updateVisibility.bind(this));
    this.trafficModule.show.sub(this.updateVisibility.bind(this), true);
    this.initCanvasStyles();
    this.initIntruders();
    this.initTCASHandlers();

    this.isInit = true;
  }

  /**
   * Initializes canvas styles.
   */
  private initCanvasStyles(): void {
    this.props.initCanvasStyles && this.props.initCanvasStyles(this.iconLayerRef.instance.display.context);
  }

  /**
   * Initializes all currently existing TCAS intruders.
   */
  private initIntruders(): void {
    const intruders = this.trafficModule.tcas.getIntruders();
    const len = intruders.length;
    for (let i = 0; i < len; i++) {
      this.onIntruderAdded(intruders[i]);
    }
  }

  /**
   * Initializes handlers to respond to TCAS events.
   */
  private initTCASHandlers(): void {
    const tcasSub = this.props.context.bus.getSubscriber<TcasEvents>();

    tcasSub.on('tcas_intruder_added').handle(this.onIntruderAdded.bind(this));
    tcasSub.on('tcas_intruder_removed').handle(this.onIntruderRemoved.bind(this));
    tcasSub.on('tcas_intruder_alert_changed').handle(this.onIntruderAlertLevelChanged.bind(this));
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.iconLayerRef.instance.onMapProjectionChanged(mapProjection, changeFlags);

    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.initCanvasStyles();
      this.updateOobBounds();
    }
  }

  /**
   * Updates the boundaries of the intruder out-of-bounds area.
   */
  private updateOobBounds(): void {
    const projectedSize = this.props.mapProjection.getProjectedSize();
    const oobOffset = this.oobOffset.get();

    this.oobBounds.set(
      oobOffset[0],
      oobOffset[1],
      projectedSize[0] - oobOffset[2],
      projectedSize[1] - oobOffset[3]
    );
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (!this.isVisible()) {
      return;
    }

    this.redrawIntruders();
  }

  /**
   * Redraws all tracked intruders.
   */
  private redrawIntruders(): void {
    const alertLevelVisFlags = this.trafficModule.alertLevelVisibility.get();
    const offScaleRange = this.trafficModule.offScaleRange.get();
    const oobBounds = this.oobBounds.get();

    const iconDisplay = this.iconLayerRef.instance.display;
    iconDisplay.clear();

    for (let i = 0; i < MapSystemTrafficLayer.DRAW_GROUPS.length; i++) {
      const group = MapSystemTrafficLayer.DRAW_GROUPS[i];

      if (BitFlags.isAll(alertLevelVisFlags, group.alertLevelVisFlag)) {
        this.intruderIcons[group.alertLevel].forEach(icon => {
          icon.draw(this.props.mapProjection, iconDisplay.context, offScaleRange);

          if (this.needHandleOffscaleOob) {
            if (icon.isOffScale) {
              this.props.oobIntruders?.delete(icon.intruder);
              this.props.offScaleIntruders?.add(icon.intruder);
            } else if (!this.props.mapProjection.isInProjectedBounds(icon.projectedPos, oobBounds)) {
              this.props.offScaleIntruders?.delete(icon.intruder);
              this.props.oobIntruders?.add(icon.intruder);
            } else {
              this.props.offScaleIntruders?.delete(icon.intruder);
              this.props.oobIntruders?.delete(icon.intruder);
            }
          }
        });
      } else if (this.needHandleOffscaleOob) {
        this.intruderIcons[group.alertLevel].forEach(icon => {
          this.props.offScaleIntruders?.delete(icon.intruder);
          this.props.oobIntruders?.delete(icon.intruder);
        });
      }
    }
  }

  /**
   * Updates this layer's visibility.
   */
  private updateVisibility(): void {
    this.setVisible(this.trafficModule.tcas.getOperatingMode() !== TcasOperatingMode.Standby && this.trafficModule.show.get());
  }

  /**
   * A callback which is called when a TCAS intruder is added.
   * @param intruder The new intruder.
   */
  private onIntruderAdded(intruder: TcasIntruder): void {
    const icon = this.props.iconFactory(intruder, this.props.context);
    this.intruderIcons[intruder.alertLevel.get()].set(intruder, icon);
  }

  /**
   * A callback which is called when a TCAS intruder is removed.
   * @param intruder The removed intruder.
   */
  private onIntruderRemoved(intruder: TcasIntruder): void {
    this.props.offScaleIntruders?.delete(intruder);
    this.props.oobIntruders?.delete(intruder);
    this.intruderIcons[intruder.alertLevel.get()].delete(intruder);
  }

  /**
   * A callback which is called when the alert level of a TCAS intruder is changed.
   * @param intruder The intruder.
   */
  private onIntruderAlertLevelChanged(intruder: TcasIntruder): void {
    let oldAlertLevel;
    let view = this.intruderIcons[oldAlertLevel = TcasAlertLevel.None].get(intruder);
    view ??= this.intruderIcons[oldAlertLevel = TcasAlertLevel.ProximityAdvisory].get(intruder);
    view ??= this.intruderIcons[oldAlertLevel = TcasAlertLevel.TrafficAdvisory].get(intruder);
    view ??= this.intruderIcons[oldAlertLevel = TcasAlertLevel.ResolutionAdvisory].get(intruder);

    if (view) {
      this.intruderIcons[oldAlertLevel].delete(intruder);
      this.intruderIcons[intruder.alertLevel.get()].set(intruder, view);
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <MapSyncedCanvasLayer ref={this.iconLayerRef} model={this.props.model} mapProjection={this.props.mapProjection} />
    );
  }
}

/**
 * An abstract implementation of {@link MapTrafficIntruderIcon} which handles the projection of the intruder's position
 * and off-scale calculations.
 */
export abstract class AbstractMapTrafficIntruderIcon implements MapTrafficIntruderIcon {
  private static readonly geoPointCache = [new GeoPoint(0, 0)];

  public readonly projectedPos = new Float64Array(2);

  public isOffScale = false;

  /**
   * Constructor.
   * @param intruder This icon's associated intruder.
   * @param trafficModule The traffic module for this icon's parent map.
   * @param ownshipModule The ownship module for this icon's parent map.
   */
  constructor(
    public readonly intruder: TcasIntruder,
    protected readonly trafficModule: MapTrafficModule,
    protected readonly ownshipModule: MapOwnAirplanePropsModule
  ) { }

  /**
   * Draws this icon.
   * @param projection The map projection.
   * @param context The canvas rendering context to which to draw this icon.
   * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
   * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
   */
  public draw(projection: MapProjection, context: CanvasRenderingContext2D, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void {
    this.updatePosition(projection, offScaleRange);
    this.drawIcon(projection, context, this.projectedPos, this.isOffScale);
  }

  /**
   * Updates this icon's intruder's projected position and off-scale status.
   * @param projection The map projection.
   * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
   * considered off-scale. If the value is `NaN`, the intruder is never considered off-scale.
   */
  protected updatePosition(projection: MapProjection, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void {
    const ownAirplanePos = this.ownshipModule.position.get();
    if (offScaleRange.isNaN()) {
      projection.project(this.intruder.position, this.projectedPos);
      this.isOffScale = false;
    } else {
      this.handleOffScaleRange(projection, ownAirplanePos, offScaleRange);
    }
  }

  /**
   * Updates this icon's intruder's projected position and off-scale status using a specific range from the own
   * airplane to define off-scale.
   * @param projection The map projection.
   * @param ownAirplanePos The position of the own airplane.
   * @param offScaleRange The distance from the own airplane to this icon's intruder beyond which the intruder is
   * considered off-scale.
   */
  protected handleOffScaleRange(projection: MapProjection, ownAirplanePos: GeoPointInterface, offScaleRange: NumberUnitInterface<UnitFamily.Distance>): void {
    const intruderPos = this.intruder.position;
    const horizontalSeparation = intruderPos.distance(ownAirplanePos);
    const offscaleRangeRad = offScaleRange.asUnit(UnitType.GA_RADIAN);
    if (horizontalSeparation > offscaleRangeRad) {
      this.isOffScale = true;
      projection.project(ownAirplanePos.offset(ownAirplanePos.bearingTo(intruderPos), offscaleRangeRad, AbstractMapTrafficIntruderIcon.geoPointCache[0]), this.projectedPos);
    } else {
      this.isOffScale = false;
      projection.project(intruderPos, this.projectedPos);
    }
  }

  /**
   * Draws this icon.
   * @param projection The map projection.
   * @param context The canvas rendering context to which to draw this icon.
   * @param projectedPos The projected position of this icon's intruder.
   * @param isOffScale Whether this icon's intruder is off-scale.
   */
  protected abstract drawIcon(
    projection: MapProjection,
    context: CanvasRenderingContext2D,
    projectedPos: ReadonlyFloat64Array,
    isOffScale: boolean
  ): void;
}