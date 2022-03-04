import { Subscribable } from '../..';
import { MapModel } from './MapModel';
import { MapProjection, MapProjectionChangeType } from './MapProjection';
import { ComponentProps, DisplayComponent } from '../FSComponent';
import { MapLayer } from './MapLayer';
import { Consumer, EventBus } from '../../data';
import { ClockEvents } from '../../instruments/Clock';
import { Vec2Math } from '../../utils/math/VecMath';
import { BitFlags } from '../../utils/BitFlags';

/**
 * Component props for MapComponent.
 */
export interface MapComponentProps<M> extends ComponentProps {
  /** A map model. */
  model: MapModel<M>;

  /** The event bus. */
  bus: EventBus;

  /** The update frequency of the map, in hertz. */
  updateFreq: Subscribable<number>;

  /** The initial width, in pixels, of the map component's projected window. */
  projectedWidth: number;

  /** The initial height, in pixels, of the map component's projected window. */
  projectedHeight: number;
}

/**
 * A component which displays a map. A map projects geographic coordinates onto a planar pixel grid. Each map component
 * maintains a MapProjection instance which handles the details of the projection. MapLayer objects added to the map
 * as children determine what is drawn on the map.
 */
export abstract class MapComponent<P extends MapComponentProps<any> = MapComponentProps<any>> extends DisplayComponent<P> {
  /**
   * This map component's projection model.
   */
  public readonly mapProjection: MapProjection;

  private readonly layerEntries: LayerEntry[] = [];

  private lastUpdateTime = 0;
  private _isAwake = true;

  private updateCycleConsumer?: Consumer<number>;
  private readonly updateCycleHandler = this.updateCycleCallback.bind(this);

  /** @inheritdoc */
  constructor(props: P) {
    super(props);

    this.mapProjection = new MapProjection(this.props.projectedWidth, this.props.projectedHeight);
  }

  /**
   * Gets the size of this map's projected window, in pixels.
   * @returns The size of this map's projected window.
   */
  public getProjectedSize(): Float64Array {
    return this.mapProjection.getProjectedSize();
  }

  /**
   * Sets the size of this map's projected window.
   * @param width The new width, in pixels.
   * @param height The new height, in pixels.
   */
  public setProjectedSize(width: number, height: number): void;
  /**
   * Sets the size of this map's projected window.
   * @param size The new size, in pixels.
   */
  public setProjectedSize(size: Float64Array): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public setProjectedSize(arg1: number | Float64Array, arg2?: number): void {
    const size = arg1 instanceof Float64Array ? arg1 : Vec2Math.set(arg1, arg2 as number, new Float64Array(2));
    this.mapProjection.set({ projectedSize: size });
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * Whether this map is awake.
   */
  public get isAwake(): boolean {
    return this._isAwake;
  }

  /**
   * Puts this map to sleep. While asleep, this map will not be updated.
   */
  public sleep(): void {
    this.setAwakeState(false);
  }

  /**
   * Wakes this map, allowing it to be updated.
   */
  public wake(): void {
    this.setAwakeState(true);
  }

  /**
   * Sets this map's awake state. If the new awake state is the same as the current state, nothing will happen.
   * Otherwise, this map's layers will be notified that the map has either been woken or put to sleep.
   * @param isAwake The new awake state.
   */
  private setAwakeState(isAwake: boolean): void {
    if (this._isAwake === isAwake) {
      return;
    }

    this._isAwake = isAwake;
    this._isAwake ? this.onWake() : this.onSleep();
  }

  /** @inheritdoc */
  public onAfterRender(): void {
    this.mapProjection.addChangeListener(this.onMapProjectionChanged.bind(this));

    this.props.updateFreq.sub(freq => {
      this.updateCycleConsumer?.off(this.updateCycleHandler);

      this.updateCycleConsumer = this.props.bus.getSubscriber<ClockEvents>()
        .on('realTime')
        .whenChanged()
        .atFrequency(freq);
      this.updateCycleConsumer.handle(this.updateCycleHandler);
    }, true);
  }

  /**
   * This method is called when the map is awakened.
   */
  protected onWake(): void {
    this.wakeLayers();
  }

  /**
   * Calls the onWake() method of this map's layers.
   */
  protected wakeLayers(): void {
    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].layer.onWake();
    }
  }

  /**
   * This method is called when the map is put to sleep.
   */
  protected onSleep(): void {
    this.sleepLayers();
  }

  /**
   * Calls the onSleep() method of this map's layers.
   */
  protected sleepLayers(): void {
    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].layer.onSleep();
    }
  }

  /**
   * This method is called when the map projection changes.
   * @param mapProjection This layer's map projection.
   * @param changeFlags The types of changes made to the projection.
   */
  protected onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.onProjectedSizeChanged();
    }

    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].layer.onMapProjectionChanged(mapProjection, changeFlags);
    }
  }

  /**
   * This method is called when the size of this map's projected window changes.
   */
  protected abstract onProjectedSizeChanged(): void;

  /**
   * Attaches a layer to this map component. If the layer is already attached, then this method has no effect.
   * @param layer The layer to attach.
   */
  protected attachLayer(layer: MapLayer): void {
    if (this.layerEntries.findIndex(entry => entry.layer === layer) >= 0) {
      return;
    }

    const entry = new LayerEntry(layer);
    this.layerEntries.push(entry);
    entry.attach();
  }

  /**
   * Detaches a layer from this map component.
   * @param layer The layer to detach.
   * @returns Whether the layer was succesfully detached.
   */
  protected detachLayer(layer: MapLayer): boolean {
    const index = this.layerEntries.findIndex(entry => entry.layer === layer);
    if (index >= 0) {
      const entry = this.layerEntries[index];
      entry.detach();
      this.layerEntries.splice(index, 1);
      return true;
    } else {
      return false;
    }
  }

  /**
   * A callback which is called once every update cycle.
   * @param time The current time as a UNIX timestamp.
   */
  private updateCycleCallback(time: number): void {
    if (!this._isAwake) {
      return;
    }

    this.onUpdated(time, time - this.lastUpdateTime);
    this.lastUpdateTime = time;
  }

  /**
   * This method is called once every update cycle.
   * @param time The current time as a UNIX timestamp.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  protected onUpdated(time: number, elapsed: number): void {
    this.updateLayers(time, elapsed);
  }

  /**
   * Updates this map's attached layers.
   * @param time The current time as a UNIX timestamp.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected updateLayers(time: number, elapsed: number): void {
    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].update(time);
    }
  }
}

/**
 * An entry for a map layer.
 */
class LayerEntry {
  private updatePeriod = 0;
  private lastUpdated = 0;

  private readonly freqHandler = (freq: number): void => {
    const clamped = Math.max(0, freq);
    this.updatePeriod = clamped === 0 ? 0 : 1000 / clamped;
  };

  /**
   * Constructor.
   * @param layer This entry's map layer.
   */
  constructor(public readonly layer: MapLayer) {
  }

  /**
   * Attaches this layer entry.
   */
  public attach(): void {
    this.layer.props.updateFreq?.sub(this.freqHandler, true);
    this.layer.onAttached();
  }

  /**
   * Updates this layer entry.
   * @param currentTime The current time as a UNIX timestamp.
   */
  public update(currentTime: number): void {
    if (currentTime - this.lastUpdated >= this.updatePeriod) {
      this.layer.onUpdated(currentTime, currentTime - this.lastUpdated);
      this.lastUpdated = currentTime;
    }
  }

  /**
   * Detaches this layer entry.
   */
  public detach(): void {
    this.layer.props.updateFreq?.unsub(this.freqHandler);
    this.layer.onDetached();
  }
}