import { ReadonlyFloat64Array } from '../../math/VecMath';
import { MapProjection } from '../map/MapProjection';
import { MapSystemComponent } from './MapSystemComponent';
import { MapSystemContext } from './MapSystemContext';
import { ContextRecord, ControllerRecord, LayerRecord, ModuleRecord } from './MapSystemTypes';

/**
 * A map controller.
 */
export abstract class MapSystemController<
  Modules extends ModuleRecord = any,
  Layers extends LayerRecord = any,
  Controllers extends ControllerRecord = any,
  Context extends ContextRecord = any
  > {

  private _isAlive = true;
  // eslint-disable-next-line jsdoc/require-returns
  /** Whether this controller is alive. */
  public get isAlive(): boolean {
    return this._isAlive;
  }

  protected readonly context: MapSystemContext<Modules, Layers, Controllers, Context>;

  /**
   * Constructor.
   * @param context This controller's map context.
   */
  constructor(context: MapSystemContext<Modules, Layers, any, Context>) {
    this.context = context;
  }

  /**
   * This method is called after this controller' map is rendered.
   * @param ref A reference to the rendered map.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onAfterMapRender(ref: MapSystemComponent): void {
    // noop
  }

  /**
   * This method is called when the dead zone of this controller's map changes.
   * @param deadZone The map's new dead zone.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onDeadZoneChanged(deadZone: ReadonlyFloat64Array): void {
    // noop
  }

  /**
   * This method is called when the projection of this controller's map changes.
   * @param mapProjection The map projection.
   * @param changeFlags Bit flags describing the type of change.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    // noop
  }

  /**
   * This method is called immediately before this controller's map updates its layers.
   * @param time The current sim time, as a UNIX timestamp in milliseconds.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onBeforeUpdated(time: number, elapsed: number): void {
    // noop
  }

  /**
   * This method is called immediately after this controller's map updates its layers.
   * @param time The current sim time, as a UNIX timestamp in milliseconds.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public onAfterUpdated(time: number, elapsed: number): void {
    // noop
  }

  /**
   * This method is called when this controller's map is awakened.
   */
  public onWake(): void {
    // noop
  }

  /**
   * This method is called when this controller's map is put to sleep.
   */
  public onSleep(): void {
    // noop
  }

  /**
   * This method is called when this controller's map is destroyed.
   */
  public onMapDestroyed(): void {
    // noop
  }

  /**
   * Destroys this controller.
   */
  public destroy(): void {
    this._isAlive = false;
  }
}