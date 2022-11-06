import { Subscribable } from '../../sub/Subscribable';
import { ComponentProps, DisplayComponent } from '../FSComponent';
import { HorizonProjection } from './HorizonProjection';

/**
 * Component props for HorizonLayer.
 */
export interface HorizonLayerProps extends ComponentProps {
  /** The layer's horizon projection. */
  projection: HorizonProjection;

  /**
   * A subscribable which provides the maximum update frequency of the layer, in hertz. Note that the actual update
   * frequency will not exceed the update frequency of the layer's parent map. If not defined, the frequency will
   * default to that of the layer's parent map.
   */
  updateFreq?: Subscribable<number>;
}

/**
 * A base component for horizon layers.
 */
export abstract class HorizonLayer<P extends HorizonLayerProps = HorizonLayerProps> extends DisplayComponent<P> {
  private _isAttached = false;
  private _isVisible = true;

  /**
   * Checks whether this layer is attached to a horizon component.
   * @returns Whether this layer is attached to a horizon component.
   */
  protected isAttached(): boolean {
    return this._isAttached;
  }

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
    if (this._isAttached) {
      this.onVisibilityChanged(val);
    }
  }

  /**
   * This method is called when this layer's visibility changes.
   * @param isVisible Whether the layer is now visible.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onVisibilityChanged(isVisible: boolean): void {
    // noop
  }

  /**
   * This method is called when this layer is attached to its parent horizon component.
   */
  public onAttached(): void {
    this._isAttached = true;

    if (!this._isVisible) {
      this.onVisibilityChanged(this._isVisible);
    }
  }

  /**
   * This method is called when this layer's parent horizon component is awakened.
   */
  public onWake(): void {
    // noop
  }

  /**
   * This method is called when this layer's parent horizon component is put to sleep.
   */
  public onSleep(): void {
    // noop
  }

  /**
   * This method is called when this layer's horizon projection changes.
   * @param projection This layer's horizon projection.
   * @param changeFlags The types of changes made to the projection.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onProjectionChanged(projection: HorizonProjection, changeFlags: number): void {
    // noop
  }

  /**
   * This method is called once every update cycle.
   * @param time The current time as a UNIX timestamp.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onUpdated(time: number, elapsed: number): void {
    // noop
  }

  /**
   * This method is called when this layer is detached from its parent horizon component.
   */
  public onDetached(): void {
    this._isAttached = false;
  }
}