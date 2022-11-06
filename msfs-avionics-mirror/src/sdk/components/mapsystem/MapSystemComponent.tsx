import { ReadonlyFloat64Array } from '../../math/VecMath';
import { VecNSubject } from '../../math/VectorSubject';
import { ObjectSubject } from '../../sub/ObjectSubject';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableSet } from '../../sub/SubscribableSet';
import { FSComponent, VNode } from '../FSComponent';
import { MapComponent, MapComponentProps } from '../map/MapComponent';
import { MapProjection } from '../map/MapProjection';

/**
 * Component props for MapSystemComponent.
 */
export interface MapSystemComponentProps<Modules> extends MapComponentProps<Modules> {
  /**
   * A subscribable which provides the size of the dead zone around each edge of the map projection window, which is
   * displayed but excluded in map range calculations. Expressed as [left, top, right, bottom] in pixels. Defaults to 0
   * on all sides.
   */
  deadZone?: Subscribable<Float64Array>;

  /** A function to be called after the map is rendered. */
  onAfterRender: () => void;

  /** A function to be called when the size of the map's dead zone changes. */
  onDeadZoneChanged: (deadZone: ReadonlyFloat64Array) => void;

  /** A function to be called when the map's projection changes. */
  onMapProjectionChanged: (mapProjection: MapProjection, changeFlags: number) => void;

  /** A function to be called immediately before the map's layers are updated. */
  onBeforeUpdated: (time: number, elapsed: number) => void;

  /** A function to be called immediately after the map's layers are updated. */
  onAfterUpdated: (time: number, elapsed: number) => void;

  /** A function to be called when the map is awakened. */
  onWake: () => void;

  /** A function to be called when the map is put to sleep. */
  onSleep: () => void;

  /** A function to be called when the map is destroyed. */
  onDestroy: () => void;

  /** CSS class(es) to apply to the root of the component. */
  class?: string | SubscribableSet<string>;
}

/**
 * A component that encompasses the compiled map system.
 */
export class MapSystemComponent<P extends MapSystemComponentProps<any> = MapSystemComponentProps<any>> extends MapComponent<P> {
  protected readonly rootStyles = ObjectSubject.create({
    width: '0px',
    height: '0px'
  });

  protected readonly deadZone: Subscribable<ReadonlyFloat64Array>;

  /** @inheritdoc */
  constructor(props: P) {
    super(props);

    this.deadZone = this.props.deadZone ?? VecNSubject.create(new Float64Array(4));
    this.deadZone.sub(this.onDeadZoneChanged.bind(this));
  }

  /** @inheritdoc */
  public onAfterRender(thisNode: VNode): void {
    super.onAfterRender(thisNode);

    this.onProjectedSizeChanged();

    this.props.onAfterRender();
  }

  /**
   * This method is called when the size of this map's dead zone changes.
   * @param deadZone The dead zone.
   */
  protected onDeadZoneChanged(deadZone: ReadonlyFloat64Array): void {
    this.props.onDeadZoneChanged(deadZone);
  }

  /** @inheritdoc */
  protected onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    super.onMapProjectionChanged(mapProjection, changeFlags);

    this.props.onMapProjectionChanged(mapProjection, changeFlags);
  }

  /**
   * Sets the size of this map's root HTML element.
   * @param size The new size, in pixels.
   */
  protected setRootSize(size: ReadonlyFloat64Array): void {
    this.rootStyles.set('width', `${size[0]}px`);
    this.rootStyles.set('height', `${size[1]}px`);
  }

  /** @inheritdoc */
  protected onProjectedSizeChanged(): void {
    this.setRootSize(this.mapProjection.getProjectedSize());
  }

  /** @inheritdoc */
  protected onUpdated(time: number, elapsed: number): void {
    this.props.onBeforeUpdated(time, elapsed);

    super.onUpdated(time, elapsed);

    this.props.onAfterUpdated(time, elapsed);
  }

  /** @inheritdoc */
  protected onWake(): void {
    super.onWake();

    this.props.onWake();
  }

  /** @inheritdoc */
  protected onSleep(): void {
    super.onSleep();

    this.props.onSleep();
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div style={this.rootStyles} class={this.props.class ?? ''}>
        {this.props.children}
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.props.onDestroy();
  }
}