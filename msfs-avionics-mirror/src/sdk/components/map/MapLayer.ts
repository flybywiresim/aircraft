import { Subscribable } from '../..';
import { MapModel } from './MapModel';
import { MapProjection } from './MapProjection';
import { ComponentProps, DisplayComponent } from '../FSComponent';

/**
 * An interface for basic map layer properties.
 */
export interface MapLayerProps<M> extends ComponentProps {
  /** A map model. */
  model: MapModel<M>;

  /** A map projection model. */
  mapProjection: MapProjection;

  /**
   * A subscribable which provides the maximum update frequency of the layer, in hertz. Note that the actual update
   * frequency will not exceed the update frequency of the layer's parent map. If not defined, the frequency will
   * default to that of the layer's parent map.
   */
  updateFreq?: Subscribable<number>;

  /** The CSS class(es) to apply to the root of this layer. */
  class?: string;
}

/**
 * A base component for map layers.
 */
export abstract class MapLayer<P extends MapLayerProps<any> = MapLayerProps<any>> extends DisplayComponent<P> {
  private _isVisible = true;

  /**
   * Checks whether this layer is visible.
   * @returns whether this layer is visible.
   */
  public isVisible(): boolean {
    return this._isVisible;
  }

  /**
   * Sets this layer's visibility.
   * @param val Whether this layer should be visible.
   */
  public setVisible(val: boolean): void {
    if (this._isVisible === val) {
      return;
    }

    this._isVisible = val;
    this.onVisibilityChanged(val);
  }

  /**
   * This method is called when this layer's visibility changes.
   * @param isVisible Whether the layer is now visible.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onVisibilityChanged(isVisible: boolean): void {
    // noop
  }

  /**
   * This method is called when this layer is attached to its parent map component.
   */
  public onAttached(): void {
    // noop
  }

  /**
   * This method is called when this layer's parent map is woken.
   */
  public onWake(): void {
    // noop
  }

  /**
   * This method is called when this layer's parent map is put to sleep.
   */
  public onSleep(): void {
    // noop
  }

  /**
   * This method is called when the map projection changes.
   * @param mapProjection - this layer's map projection.
   * @param changeFlags The types of changes made to the projection.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    // noop
  }

  /**
   * This method is called once every map update cycle.
   * @param time The current time as a UNIX timestamp.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    // noop
  }

  /**
   * This method is called when this layer is detached from its parent map component.
   */
  public onDetached(): void {
    // noop
  }
}