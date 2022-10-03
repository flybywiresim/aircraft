import { ReadonlyFloat64Array } from '../../math/VecMath';
import { MapProjection } from '../map/MapProjection';
import { MapSystemContext } from './MapSystemContext';
import { MapSystemController } from './MapSystemController';
import { ContextRecord, ControllerRecord, LayerRecord, ModuleRecord } from './MapSystemTypes';

/**
 * Callbacks supported by MapSystemGenericController.
 */
export type MapSystemGenericControllerCallbacks<Context extends MapSystemContext<any, any, any, any>> = {
  /** */
  onAfterMapRender?: (context: Context) => void;

  /** */
  onDeadZoneChanged?: (context: Context, deadZone: ReadonlyFloat64Array) => void;

  /** */
  onMapProjectionChanged?: (context: Context, mapProjection: MapProjection, changeFlags: number) => void;

  /** */
  onBeforeUpdated?: (context: Context, time: number, elapsed: number) => void;

  /** */
  onAfterUpdated?: (context: Context, time: number, elapsed: number) => void;

  /** */
  onWake?: (context: Context) => void;

  /** */
  onSleep?: (context: Context) => void;

  /** */
  onMapDestroyed?: (context: Context) => void;

  /** */
  onDestroyed?: (context: Context) => void;
};

/**
 * A map controller which delegates its behavior to injected callback functions.
 */
export class MapSystemGenericController<
  Modules extends ModuleRecord = any,
  Layers extends LayerRecord = any,
  Controllers extends ControllerRecord = any,
  Context extends ContextRecord = any
  > extends MapSystemController<Modules, Layers, Controllers, Context> {

  /**
   * Constructor.
   * @param context This controller's map context.
   * @param callbacks The callback functions to which this controller delegates its behavior.
   */
  constructor(
    context: MapSystemContext<Modules, Layers, any, Context>,
    private readonly callbacks: MapSystemGenericControllerCallbacks<MapSystemContext<Modules, Layers, Controllers, Context>>
  ) {
    super(context);
  }

  /** @inheritdoc */
  public onAfterMapRender(): void {
    this.callbacks.onAfterMapRender && this.callbacks.onAfterMapRender(this.context);
  }

  /** @inheritdoc */
  public onDeadZoneChanged(deadZone: ReadonlyFloat64Array): void {
    this.callbacks.onDeadZoneChanged && this.callbacks.onDeadZoneChanged(this.context, deadZone);
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    this.callbacks.onMapProjectionChanged && this.callbacks.onMapProjectionChanged(this.context, mapProjection, changeFlags);
  }

  /** @inheritdoc */
  public onBeforeUpdated(time: number, elapsed: number): void {
    this.callbacks.onBeforeUpdated && this.callbacks.onBeforeUpdated(this.context, time, elapsed);
  }

  /** @inheritdoc */
  public onAfterUpdated(time: number, elapsed: number): void {
    this.callbacks.onAfterUpdated && this.callbacks.onAfterUpdated(this.context, time, elapsed);
  }

  /** @inheritdoc */
  public onWake(): void {
    this.callbacks.onWake && this.callbacks.onWake(this.context);
  }

  /** @inheritdoc */
  public onSleep(): void {
    this.callbacks.onSleep && this.callbacks.onSleep(this.context);
  }

  /** @inheritdoc */
  public onMapDestroyed(): void {
    this.callbacks.onMapDestroyed && this.callbacks.onMapDestroyed(this.context);
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.callbacks.onDestroyed && this.callbacks.onDestroyed(this.context);
  }
}