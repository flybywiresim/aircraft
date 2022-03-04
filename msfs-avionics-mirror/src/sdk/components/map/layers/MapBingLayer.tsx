/// <reference types="msfstypes/JS/common" />
/// <reference types="msfstypes/JS/Types" />
/// <reference types="msfstypes/JS/NetBingMap" />

import { FSComponent, VNode, BitFlags, Subscribable, SubscribableArray, UnitType, Vec2Math, Vec2Subject } from '../../../.';
import { BingComponent, WxrMode } from '../../bing';
import { MapProjection, MapProjectionChangeType } from '../MapProjection';
import { MapLayer, MapLayerProps } from '../MapLayer';

/**
 * Component props for the MapComponent.
 */
export interface MapBingLayerProps<M> extends MapLayerProps<M> {
  /** The unique ID to assign to this Bing map. */
  bingId: string;

  /**
   * A subscribable array which provides the earth colors for the layer's Bing component. The array should have a
   * length of exactly 61, with index 0 defining the water color and indexes 1 through 60 defining terrain colors from
   * 0 to 60000 feet.
   */
  earthColors: SubscribableArray<number>;

  /**
   * A subscribable which provides the reference mode for the layer's Bing component.
   */
  reference: Subscribable<EBingReference>;

  /**
   * A subscribable which provides the weather radar mode for the layer's Bing component.
   */
  wxrMode?: Subscribable<WxrMode>;
}

/**
 * A FSComponent that display the MSFS Bing Map, weather radar, and 3D terrain.
 */
export class MapBingLayer<M> extends MapLayer<MapBingLayerProps<M>> {
  public static readonly OVERDRAW_FACTOR = Math.SQRT2;

  private readonly wrapperRef = FSComponent.createRef<HTMLDivElement>();
  private readonly bingRef = FSComponent.createRef<BingComponent>();

  private readonly resolutionSub = Vec2Subject.createFromVector(new Float64Array([1024, 1024]));

  private size = 0;
  private needUpdate = false;

  /** @inheritdoc */
  public onAfterRender(): void {
    this.updateFromProjectedSize(this.props.mapProjection.getProjectedSize());
  }

  /** @inheritdoc */
  public onWake(): void {
    this.bingRef.instance.wake();
  }

  /** @inheritdoc */
  public onSleep(): void {
    this.bingRef.instance.sleep();
  }

  /**
   * Updates this layer according to the current size of the projected map window.
   * @param projectedSize The size of the projected map window.
   */
  private updateFromProjectedSize(projectedSize: Float64Array): void {
    this.size = this.getSize(projectedSize);

    const offsetX = (projectedSize[0] - this.size) / 2;
    const offsetY = (projectedSize[1] - this.size) / 2;
    this.wrapperRef.instance.style.left = `${offsetX}px`;
    this.wrapperRef.instance.style.top = `${offsetY}px`;
    this.wrapperRef.instance.style.width = `${this.size}px`;
    this.wrapperRef.instance.style.height = `${this.size}px`;

    this.resolutionSub.set(this.size, this.size);
  }

  /**
   * Gets an appropriate size, in pixels, for this Bing layer given specific map projection window dimensions.
   * @param projectedSize - the size of the projected map window.
   * @returns an appropriate size for this Bing layer.
   */
  private getSize(projectedSize: Float64Array): number {
    return Vec2Math.abs(projectedSize);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.updateFromProjectedSize(mapProjection.getProjectedSize());
    }

    if (this.bingRef.instance.isBound()) {
      this.needUpdate = true;
    }
  }

  /**
   * A callback which is called when the Bing component is bound.
   */
  private onBingBound(): void {
    this.needUpdate = true;
  }

  /** @inheritdoc */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    if (!this.needUpdate) {
      return;
    }

    this.updatePositionRadius();

    this.needUpdate = false;
  }

  /**
   * Updates the Bing map center position and radius.
   */
  private updatePositionRadius(): void {
    const center = this.props.mapProjection.getCenter();
    const radius = this.calculateDesiredRadius(this.props.mapProjection);
    this.bingRef.instance.setPositionRadius(new LatLong(center.lat, center.lon), radius);

    this.wrapperRef.instance.style.transform = `rotate(${this.props.mapProjection.getRotation() * Avionics.Utils.RAD2DEG}deg)`;
  }

  /**
   * Gets the desired Bing map radius in meters given a map projection model.
   * @param mapProjection - a map projection model.
   * @returns the desired Bing map radius.
   */
  private calculateDesiredRadius(mapProjection: MapProjection): number {
    const scaleFactor = mapProjection.getGeoProjection().getScaleFactor();
    const pointScaleFactor = 1 / Math.cos(mapProjection.getCenter().lat * Avionics.Utils.DEG2RAD);
    const radiusGARad = this.size / (2 * scaleFactor * pointScaleFactor);
    return UnitType.GA_RADIAN.convertTo(radiusGARad, UnitType.METER) as number;
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div ref={this.wrapperRef} style='position: absolute;' class={this.props.class ?? ''}>
        <BingComponent
          ref={this.bingRef} id={this.props.bingId}
          onBoundCallback={this.onBingBound.bind(this)}
          resolution={this.resolutionSub}
          mode={EBingMode.PLANE}
          earthColors={this.props.earthColors}
          reference={this.props.reference}
          wxrMode={this.props.wxrMode}
        />
      </div>
    );
  }
}
