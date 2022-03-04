import { MapOwnAirplaneIconModule } from '../modules/MapOwnAirplaneIconModule';
import { MapOwnAirplanePropsModule } from '../modules/MapOwnAirplanePropsModule';
import { MapProjection } from '../MapProjection';
import { GeoPointInterface } from '../../../utils/geo/GeoPoint';
import { Vec2Math } from '../../../utils/math/VecMath';
import { FSComponent, VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { BitFlags } from '../../../utils/BitFlags';
import { Subscribable } from '../../../utils/Subscribable';

/**
 * Modules required by MapOwnAirplaneLayer.
 */
export interface MapOwnAirplaneLayerModules {
  /** Own airplane properties module. */
  ownAirplaneProps: MapOwnAirplanePropsModule;

  /** Own airplane icon module. */
  ownAirplaneIcon: MapOwnAirplaneIconModule;
}

/**
 * Component props for MapOwnAirplaneLayer.
 */
export interface MapOwnAirplaneLayerProps<M extends MapOwnAirplaneLayerModules> extends MapLayerProps<M> {
  /** The path to the icon's image file. */
  imageFilePath: Subscribable<string>;

  /** The size of the airplane icon, in pixels. */
  iconSize: number;

  /**
   * The point on the icon which is anchored to the airplane's position, expressed relative to the icon's width and
   * height, with [0, 0] at the top left and [1, 1] at the bottom right.
   */
  iconAnchor: Subscribable<Float64Array>;
}

/**
 * A layer which draws an own airplane icon.
 */
export class MapOwnAirplaneLayer<M extends MapOwnAirplaneLayerModules> extends MapLayer<MapOwnAirplaneLayerProps<M>> {
  protected static readonly UPDATE_VISIBILITY = 1;
  protected static readonly UPDATE_TRANSFORM = 1 << 1;

  private static readonly tempVec2_1 = new Float64Array(2);

  protected readonly iconImgRef = FSComponent.createRef<HTMLImageElement>();
  protected readonly iconOffset = new Float64Array(2);
  protected updateFlags = 0;

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  public onVisibilityChanged(isVisible: boolean): void {
    this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY);
  }

  /** @inheritdoc */
  public onAttached(): void {
    const ownAirplaneIconModule = this.props.model.getModule('ownAirplaneIcon');
    ownAirplaneIconModule.show.sub(this.onIconShowChanged.bind(this));

    const ownAirplanePropsModule = this.props.model.getModule('ownAirplaneProps');
    ownAirplanePropsModule.position.sub(this.onAirplanePositionChanged.bind(this));
    ownAirplanePropsModule.hdgTrue.sub(this.onAirplaneHeadingChanged.bind(this));

    this.props.iconAnchor.sub(anchor => {
      this.iconOffset.set(anchor);
      Vec2Math.multScalar(this.iconOffset, -this.props.iconSize, this.iconOffset);

      const img = this.iconImgRef.instance;
      img.style.left = `${this.iconOffset[0]}px`;
      img.style.top = `${this.iconOffset[1]}px`;
      img.style.transformOrigin = `${anchor[0] * 100}% ${anchor[1] * 100}%`;

      this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
    }, true);

    this.props.imageFilePath.sub(path => {
      this.iconImgRef.instance.src = path;
      this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
    }, true);

    this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_TRANSFORM);
  }

  /**
   * Schedules an update.
   * @param updateFlags The types of updates to schedule.
   */
  protected scheduleUpdate(updateFlags: number): void {
    this.updateFlags = BitFlags.union(this.updateFlags, updateFlags);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (this.updateFlags === 0) {
      return;
    }

    if (BitFlags.isAll(this.updateFlags, MapOwnAirplaneLayer.UPDATE_VISIBILITY)) {
      this.updateIconVisibility();
    }
    if (BitFlags.isAll(this.updateFlags, MapOwnAirplaneLayer.UPDATE_TRANSFORM)) {
      this.updateIconTransform();
    }

    this.updateFlags = BitFlags.not(this.updateFlags, MapOwnAirplaneLayer.UPDATE_VISIBILITY | MapOwnAirplaneLayer.UPDATE_TRANSFORM);
  }

  /**
   * Updates the airplane icon's visibility.
   */
  protected updateIconVisibility(): void {
    const show = this.isVisible() && this.props.model.getModule('ownAirplaneIcon').show.get();
    this.iconImgRef.instance.style.display = show ? 'block' : 'none';
  }

  /**
   * Updates the airplane icon's display transformation.
   */
  protected updateIconTransform(): void {
    const ownAirplanePropsModule = this.props.model.getModule('ownAirplaneProps');

    const projected = this.props.mapProjection.project(ownAirplanePropsModule.position.get(), MapOwnAirplaneLayer.tempVec2_1);
    const rotation = ownAirplanePropsModule.hdgTrue.get() + this.props.mapProjection.getRotation() * Avionics.Utils.RAD2DEG;

    this.iconImgRef.instance.style.transform = `translate(${projected[0].toFixed(1)}px, ${projected[1].toFixed(1)}px) rotate(${rotation.toFixed(1)}deg) rotateX(0deg)`;
  }

  /**
   * A callback which is called when the show airplane icon property changes.
   * @param show The new value of the show airplane icon property.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onIconShowChanged(show: boolean): void {
    this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_VISIBILITY);
  }

  /**
   * A callback which is called when the airplane's position changes.
   * @param pos The new position of the airplane.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onAirplanePositionChanged(pos: GeoPointInterface): void {
    this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_TRANSFORM);
  }

  /**
   * A callback which is called when the airplane's true heading changes.
   * @param hdgTrue - the new true heading of the airplane.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private onAirplaneHeadingChanged(hdgTrue: number): void {
    this.scheduleUpdate(MapOwnAirplaneLayer.UPDATE_TRANSFORM);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <img ref={this.iconImgRef} class={this.props.class ?? ''} src={this.props.imageFilePath}
        style={`position: absolute; width: ${this.props.iconSize}px; height: ${this.props.iconSize}px; transform: rotateX(0deg);`} />
    );
  }
}