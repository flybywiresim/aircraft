import { BitFlags } from '../../math/BitFlags';
import { ReadonlyFloat64Array } from '../../math/VecMath';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableSet } from '../../sub/SubscribableSet';
import { SubscribableUtils } from '../../sub/SubscribableUtils';
import { Subscription } from '../../sub/Subscription';
import { ComponentProps, DisplayComponent, FSComponent, VNode } from '../FSComponent';
import { HorizonLayer } from './HorizonLayer';
import { HorizonProjection, HorizonProjectionChangeType } from './HorizonProjection';

/**
 * Component props for HorizonComponent.
 */
export interface HorizonComponentProps extends ComponentProps {
  /** The size, as `[width, height]` in pixels, of the horizon component's projected window. */
  projectedSize: ReadonlyFloat64Array | Subscribable<ReadonlyFloat64Array>;

  /** The field of view, in degrees, of the horizon component's projected window. */
  fov: number | Subscribable<number>;

  /**
   * The projected endpoints at which to measure the field of view as `[x1, y1, x2, y2]` with each component expressed
   * relative to the width or height of the projected window. Defaults to `[0.5, 0, 0.5, 1]`.
   */
  fovEndpoints?: ReadonlyFloat64Array | Subscribable<ReadonlyFloat64Array>;

  /** The projected offset of the center of the projection, as `[x, y]` in pixels. Defaults to `[0, 0]`. */
  projectedOffset?: ReadonlyFloat64Array | Subscribable<ReadonlyFloat64Array>;

  /** A projection to inject. A default will be used if none is provided. */
  projection?: HorizonProjection;

  /** CSS class(es) to apply to the root of the horizon component. */
  class?: string | SubscribableSet<string>
}

/**
 * A component which displays an artificial horizon. A horizon tracks the position, altitude, heading, pitch, and roll
 * of an airplane and uses a persepctive projection to project points in space to a planar pixel grid. Each horizon
 * component maintains a {@link HorizonComponent} instance which handles the details of the projection.
 * {@link HorizonLayer} objects added to the horizon as children determine what is drawn in the horizon window.
 */
export class HorizonComponent<P extends HorizonComponentProps = HorizonComponentProps> extends DisplayComponent<P> {
  /**
   * This horizon component's projection.
   */
  public readonly projection: HorizonProjection;

  private readonly layerEntries: LayerEntry[] = [];

  private readonly projectedSize: Subscribable<ReadonlyFloat64Array>;
  private readonly fov: Subscribable<number>;
  private readonly fovEndpoints?: Subscribable<ReadonlyFloat64Array>;
  private readonly projectedOffset?: Subscribable<ReadonlyFloat64Array>;

  private lastUpdateTime = 0;
  private _isAwake = true;

  private projectedSizeSub?: Subscription;
  private fovSub?: Subscription;
  private fovEndpointsSub?: Subscription;
  private projectedOffsetSub?: Subscription;

  /** @inheritdoc */
  constructor(props: P) {
    super(props);

    this.projectedSize = SubscribableUtils.toSubscribable(this.props.projectedSize, true);
    this.fov = SubscribableUtils.toSubscribable(this.props.fov, true);
    if (this.props.fovEndpoints !== undefined) {
      this.fovEndpoints = SubscribableUtils.toSubscribable(this.props.fovEndpoints, true);
    }
    if (this.props.projectedOffset !== undefined) {
      this.projectedOffset = SubscribableUtils.toSubscribable(this.props.projectedOffset, true);
    }

    const initialSize = this.projectedSize.get();
    const initialFov = this.fov.get();

    if (this.props.projection !== undefined) {
      this.props.projection.set({ projectedSize: initialSize, fov: initialFov });
    }
    this.projection = this.props.projection ?? new HorizonProjection(initialSize[0], initialSize[1], initialFov);
  }

  /**
   * Gets the size of this map's projected window, in pixels.
   * @returns The size of this map's projected window.
   */
  public getProjectedSize(): ReadonlyFloat64Array {
    return this.projection.getProjectedSize();
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * Whether this horizon is awake.
   */
  public get isAwake(): boolean {
    return this._isAwake;
  }

  /**
   * Puts this horizon to sleep. While asleep, this horizon will not be updated.
   */
  public sleep(): void {
    this.setAwakeState(false);
  }

  /**
   * Wakes this horizon, allowing it to be updated.
   */
  public wake(): void {
    this.setAwakeState(true);
  }

  /**
   * Sets this horizon's awake state. If the new awake state is the same as the current state, nothing will happen.
   * Otherwise, this horizon's layers will be notified that the map has either been woken or put to sleep.
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
  public onAfterRender(thisNode: VNode): void {
    this.projection.onChange(this.onProjectionChanged.bind(this));

    this.projectedSizeSub = this.projectedSize.sub(size => {
      this.projection.set({ projectedSize: size });
    }, true);

    this.fovSub = this.fov.sub(fov => {
      this.projection.set({ fov });
    }, true);

    this.fovEndpointsSub = this.fovEndpoints?.sub(fovEndpoints => {
      this.projection.set({ fovEndpoints });
    }, true);

    this.projectedOffsetSub = this.projectedOffset?.sub(projectedOffset => {
      this.projection.set({ projectedOffset });
    }, true);

    this.attachLayers(thisNode);

    if (!this._isAwake) {
      this.sleepLayers();
    }
  }

  /**
   * Scans this component's VNode sub-tree for HorizonLayer components and attaches them when found. Only the top-most
   * level of HorizonLayer components are attached; layers that are themselves children of other layers are not
   * attached.
   * @param thisNode This component's VNode.
   */
  protected attachLayers(thisNode: VNode): void {
    FSComponent.visitNodes(thisNode, node => {
      if (node.instance instanceof HorizonLayer) {
        this.attachLayer(node.instance);
        return true;
      }
      return false;
    });
  }

  /**
   * This method is called when this horizon is awakened.
   */
  protected onWake(): void {
    this.wakeLayers();
  }

  /**
   * Calls the onWake() method of this horizon's layers.
   */
  protected wakeLayers(): void {
    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].layer.onWake();
    }
  }

  /**
   * This method is called when this horizon is put to sleep.
   */
  protected onSleep(): void {
    this.sleepLayers();
  }

  /**
   * Calls the onSleep() method of this horizon's layers.
   */
  protected sleepLayers(): void {
    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].layer.onSleep();
    }
  }

  /**
   * This method is called when this horizon's projection changes.
   * @param projection This horizon's projection.
   * @param changeFlags The types of changes made to the projection.
   */
  protected onProjectionChanged(projection: HorizonProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, HorizonProjectionChangeType.ProjectedSize)) {
      this.onProjectedSizeChanged();
    }

    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].layer.onProjectionChanged(projection, changeFlags);
    }
  }

  /**
   * This method is called when the size of this horizon's projected window changes.
   */
  protected onProjectedSizeChanged(): void {
    // noop
  }

  /**
   * Attaches a layer to this horizon component. If the layer is already attached, then this method has no effect.
   * @param layer The layer to attach.
   */
  protected attachLayer(layer: HorizonLayer): void {
    if (this.layerEntries.findIndex(entry => entry.layer === layer) >= 0) {
      return;
    }

    const entry = new LayerEntry(layer);
    this.layerEntries.push(entry);
    entry.attach();
  }

  /**
   * Detaches a layer from this horizon component.
   * @param layer The layer to detach.
   * @returns Whether the layer was succesfully detached.
   */
  protected detachLayer(layer: HorizonLayer): boolean {
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
   * Updates this horizon.
   * @param time The current real time as a UNIX timestamp in milliseconds.
   */
  public update(time: number): void {
    if (!this._isAwake) {
      return;
    }

    this.onUpdated(time, time - this.lastUpdateTime);
    this.lastUpdateTime = time;
  }

  /**
   * This method is called once every update cycle.
   * @param time The current real time as a UNIX timestamp in milliseconds.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  protected onUpdated(time: number, elapsed: number): void {
    this.updateLayers(time, elapsed);
  }

  /**
   * Updates this horizon's attached layers.
   * @param time The current real time as a UNIX timestamp in milliseconds.
   * @param elapsed The elapsed time, in milliseconds, since the last update.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected updateLayers(time: number, elapsed: number): void {
    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].update(time);
    }
  }

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={this.props.class ?? ''}>
        {this.props.children}
      </div>
    );
  }

  /** @inheritdoc */
  public destroy(): void {
    super.destroy();

    this.projectedSizeSub?.destroy();
    this.fovSub?.destroy();
    this.fovEndpointsSub?.destroy();
    this.projectedOffsetSub?.destroy();

    const len = this.layerEntries.length;
    for (let i = 0; i < len; i++) {
      this.layerEntries[i].destroy();
    }
  }
}

/**
 * An entry for a horizon layer.
 */
class LayerEntry {
  private updateFreqSub?: Subscription;

  private updatePeriod = 0;
  private lastUpdated = 0;

  /**
   * Constructor.
   * @param layer This entry's map layer.
   */
  constructor(public readonly layer: HorizonLayer) {
  }

  /**
   * Attaches this layer entry.
   */
  public attach(): void {
    this.updateFreqSub?.destroy();
    this.updateFreqSub = this.layer.props.updateFreq?.sub((freq: number): void => {
      const clamped = Math.max(0, freq);
      this.updatePeriod = clamped === 0 ? 0 : 1000 / clamped;
    }, true);
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
    this.updateFreqSub?.destroy();
    this.layer.onDetached();
  }

  /**
   * Destroys this layer entry. This will detach this entry's layer and destroy it.
   */
  public destroy(): void {
    this.detach();

    this.layer.destroy();
  }
}