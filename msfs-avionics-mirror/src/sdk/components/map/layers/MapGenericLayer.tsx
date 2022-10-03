import { FSComponent, VNode } from '../../FSComponent';
import { MapLayer, MapLayerProps } from '../MapLayer';
import { MapProjection } from '../MapProjection';

/**
 * Component props for MapGenericLayer.
 */
export interface MapGenericLayerProps<M> extends MapLayerProps<M> {
  /** A function to be called when the layer's visibility changes. */
  onVisibilityChanged?: (layer: MapGenericLayer<M>, isVisible: boolean) => void;

  /** A function to be called when the layer is attached to a map. */
  onAttached?: (layer: MapGenericLayer<M>) => void;

  /** A function to be called when the layer is awakened. */
  onWake?: (layer: MapGenericLayer<M>) => void;

  /** A function to be called when the layer is put to sleep. */
  onSleep?: (layer: MapGenericLayer<M>) => void;

  /** A function to be called when the projection of the layer's parent map changes. */
  onMapProjectionChanged?: (layer: MapGenericLayer<M>, mapProjection: MapProjection, changeFlags: number) => void;

  /** A function to be called when the layer updates. */
  onUpdated?: (layer: MapGenericLayer<M>, time: number, elapsed: number) => void;

  /** A function to be called when the layer is detached from a map. */
  onDetached?: (layer: MapGenericLayer<M>) => void;
}

/**
 * A generic map layer which renders its children.
 */
export class MapGenericLayer<M = any> extends MapLayer<MapGenericLayerProps<M>> {
  /** @inheritdoc */
  public onVisibilityChanged(isVisible: boolean): void {
    this.props.onVisibilityChanged && this.props.onVisibilityChanged(this, isVisible);
  }

  /** @inheritdoc */
  public onAttached(): void {
    this.props.onAttached && this.props.onAttached(this);
  }

  /** @inheritdoc */
  public onWake(): void {
    this.props.onWake && this.props.onWake(this);
  }

  /** @inheritdoc */
  public onSleep(): void {
    this.props.onSleep && this.props.onSleep(this);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.props.onMapProjectionChanged && this.props.onMapProjectionChanged(this, mapProjection, changeFlags);
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    this.props.onUpdated && this.props.onUpdated(this, time, elapsed);
  }

  /** @inheritdoc */
  public onDetached(): void {
    this.props.onDetached && this.props.onDetached(this);
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>
        {this.props.children}
      </div>
    );
  }
}