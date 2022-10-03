import { GeoPointInterface } from '../../geo/GeoPoint';
import { ReadonlySubEvent, SubEvent } from '../../sub/SubEvent';
import { Subscribable } from '../../sub/Subscribable';
import { SubscribableUtils } from '../../sub/SubscribableUtils';
import { Subscription } from '../../sub/Subscription';
import { MapProjection } from './MapProjection';
import { MapLocationTextLabel, MapLocationTextLabelOptions, MapTextLabel } from './MapTextLabel';

/**
 * A map text label which can be culled to prevent collision with other labels.
 */
export interface MapCullableTextLabel extends MapTextLabel {
  /** Whether this label is immune to culling. */
  readonly alwaysShow: Subscribable<boolean>;

  /** The bounding box of this label. */
  readonly bounds: Float64Array;

  /** An invalidation event. */
  readonly invalidation: ReadonlySubEvent<this, void>;

  /**
   * Updates this label's bounding box.
   * @param mapProjection The map projection to use.
   */
  updateBounds(mapProjection: MapProjection): void;
}

/**
 * A cullable text label associated with a specific geographic location.
 */
export class MapCullableLocationTextLabel extends MapLocationTextLabel implements MapCullableTextLabel {
  /** @inheritdoc */
  public readonly alwaysShow: Subscribable<boolean>;

  /** @inheritdoc */
  public readonly bounds = new Float64Array(4);

  /** @inheritdoc */
  public readonly invalidation = new SubEvent<this, void>();

  private readonly subs: Subscription[] = [];

  /**
   * Constructor.
   * @param text The text of this label, or a subscribable which provides it.
   * @param priority The priority of this label, or a subscribable which provides it.
   * @param location The geographic location of this label, or a subscribable which provides it.
   * @param alwaysShow Whether this label is immune to culling, or a subscribable which provides it.
   * @param options Options with which to initialize this label.
   */
  constructor(
    text: string | Subscribable<string>,
    priority: number | Subscribable<number>,
    location: GeoPointInterface | Subscribable<GeoPointInterface>,
    alwaysShow: boolean | Subscribable<boolean>,
    options?: MapLocationTextLabelOptions
  ) {
    super(text, priority, location, options);

    this.alwaysShow = SubscribableUtils.toSubscribable(alwaysShow, true);

    this.subs.push(this.priority.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.alwaysShow.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.location.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.text.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.fontSize.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.anchor.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.offset.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.bgPadding.sub(() => { this.invalidation.notify(this); }));
    this.subs.push(this.bgOutlineWidth.sub(() => { this.invalidation.notify(this); }));
  }

  /** @inheritdoc */
  public updateBounds(mapProjection: MapProjection): void {
    const fontSize = this.fontSize.get();
    const anchor = this.anchor.get();

    const width = 0.6 * fontSize * this.text.get().length;
    const height = fontSize;

    const pos = this.getPosition(mapProjection, MapCullableLocationTextLabel.tempVec2);

    let left = pos[0] - anchor[0] * width;
    let right = left + width;
    let top = pos[1] - anchor[1] * height;
    let bottom = top + height;
    if (this.showBg.get()) {
      const bgPadding = this.bgPadding.get();
      const bgOutlineWidth = this.bgOutlineWidth.get();

      left -= (bgPadding[3] + bgOutlineWidth);
      right += (bgPadding[1] + bgOutlineWidth);
      top -= (bgPadding[0] + bgOutlineWidth);
      bottom += (bgPadding[2] + bgOutlineWidth);
    }

    this.bounds[0] = left;
    this.bounds[1] = top;
    this.bounds[2] = right;
    this.bounds[3] = bottom;
  }

  /**
   * Destroys this label.
   */
  public destroy(): void {
    for (const sub of this.subs) {
      sub.destroy();
    }
  }
}

/**
 * Manages a set of MapCullableTextLabels. Colliding labels will be culled based on their render priority. Labels with
 * lower priorities will be culled before labels with higher priorities.
 */
export class MapCullableTextLabelManager {
  private static readonly SCALE_UPDATE_THRESHOLD = 1.2;
  private static readonly ROTATION_UPDATE_THRESHOLD = Math.PI / 6;

  private static readonly SORT_FUNC = (a: MapCullableTextLabel, b: MapCullableTextLabel): number => {
    const alwaysShowA = a.alwaysShow.get();
    const alwaysShowB = b.alwaysShow.get();

    if (alwaysShowA && !alwaysShowB) {
      return -1;
    } else if (alwaysShowB && !alwaysShowA) {
      return 1;
    } else {
      return b.priority.get() - a.priority.get();
    }
  };

  private readonly registered = new Map<MapCullableTextLabel, Subscription>();

  private _visibleLabels: MapCullableTextLabel[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** An array of labels registered with this manager that are visible. */
  public get visibleLabels(): readonly MapCullableTextLabel[] {
    return this._visibleLabels;
  }

  private needUpdate = false;
  private lastScaleFactor = 1;
  private lastRotation = 0;

  private readonly invalidationHandler = (): void => { this.needUpdate = true; };

  /**
   * Creates an instance of the MapCullableTextLabelManager.
   * @param cullingEnabled Whether or not culling of labels is enabled.
   */
  constructor(private cullingEnabled = true) { }

  /**
   * Registers a label with this manager. Newly registered labels will be processed with the next manager update.
   * @param label The label to register.
   */
  public register(label: MapCullableTextLabel): void {
    if (this.registered.has(label)) {
      return;
    }

    this.registered.set(label, label.invalidation.on(this.invalidationHandler));
    this.needUpdate = true;
  }

  /**
   * Deregisters a label with this manager. Newly deregistered labels will be processed with the next manager update.
   * @param label The label to deregister.
   */
  public deregister(label: MapCullableTextLabel): void {
    const sub = this.registered.get(label);

    if (sub === undefined) {
      return;
    }

    sub.destroy();
    this.registered.delete(label);

    this.needUpdate = true;
  }

  /**
   * Sets whether or not text label culling is enabled.
   * @param enabled Whether or not culling is enabled.
   */
  public setCullingEnabled(enabled: boolean): void {
    this.cullingEnabled = enabled;
    this.needUpdate = true;
  }

  /**
   * Updates this manager.
   * @param mapProjection The projection of the map to which this manager's labels are to be drawn.
   */
  public update(mapProjection: MapProjection): void {
    if (!this.needUpdate) {
      const scaleFactorRatio = mapProjection.getScaleFactor() / this.lastScaleFactor;
      if (scaleFactorRatio < MapCullableTextLabelManager.SCALE_UPDATE_THRESHOLD && scaleFactorRatio > 1 / MapCullableTextLabelManager.SCALE_UPDATE_THRESHOLD) {
        const rotationDelta = Math.abs(mapProjection.getRotation() - this.lastRotation);
        if (Math.min(rotationDelta, 2 * Math.PI - rotationDelta) < MapCullableTextLabelManager.ROTATION_UPDATE_THRESHOLD) {
          return;
        }
      }
    }

    this._visibleLabels = [];
    if (this.cullingEnabled) {

      const labelArray = Array.from(this.registered.keys());
      const len = labelArray.length;
      for (let i = 0; i < len; i++) {
        labelArray[i].updateBounds(mapProjection);
      }

      labelArray.sort(MapCullableTextLabelManager.SORT_FUNC);

      const collisionArray: Float64Array[] = [];
      for (let i = 0; i < len; i++) {
        const label = labelArray[i];
        let show = true;
        if (!label.alwaysShow.get()) {
          const len2 = collisionArray.length;
          for (let j = 0; j < len2; j++) {
            const other = collisionArray[j];
            if (MapCullableTextLabelManager.doesCollide(label.bounds, other)) {
              show = false;
              break;
            }
          }
        }

        if (show) {
          collisionArray.push(label.bounds);
          this._visibleLabels.push(label);
        }
      }
    } else {
      this._visibleLabels.push(...this.registered.keys());
    }

    this.lastScaleFactor = mapProjection.getScaleFactor();
    this.lastRotation = mapProjection.getRotation();
    this.needUpdate = false;
  }

  /**
   * Checks if two bounding boxes collide.
   * @param a The first bounding box, as a 4-tuple [left, top, right, bottom].
   * @param b The second bounding box, as a 4-tuple [left, top, right, bottom].
   * @returns whether the bounding boxes collide.
   */
  private static doesCollide(a: Float64Array, b: Float64Array): boolean {
    return a[0] < b[2]
      && a[2] > b[0]
      && a[1] < b[3]
      && a[3] > b[1];
  }
}