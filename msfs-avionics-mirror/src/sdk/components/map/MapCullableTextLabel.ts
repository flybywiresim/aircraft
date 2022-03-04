import { GeoPointInterface } from '../../utils/geo/GeoPoint';
import { MapProjection } from './MapProjection';
import { MapLocationTextLabel, MapLocationTextLabelOptions, MapTextLabel } from './MapTextLabel';

/**
 * A map text label which can be culled to prevent collision with other labels.
 */
export interface MapCullableTextLabel extends MapTextLabel {
  /** Whether this label is immune to culling. */
  readonly alwaysShow: boolean;

  /** The bounding box of this label. */
  readonly bounds: Float64Array;

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
  public readonly bounds = new Float64Array(4);

  /**
   * Constructor.
   * @param text The text of this label.
   * @param priority The priority of this label.
   * @param location The geographic location of this label.
   * @param alwaysShow Whether this label is immune to culling.
   * @param options Options with which to initialize this label.
   */
  constructor(
    text: string,
    priority: number,
    location: GeoPointInterface,
    public readonly alwaysShow: boolean,
    options?: MapLocationTextLabelOptions
  ) {
    super(text, priority, location, options);
  }

  // eslint-disable-next-line jsdoc/require-jsdoc
  public updateBounds(mapProjection: MapProjection): void {
    const width = 0.6 * this.fontSize * this.text.length;
    const height = this.fontSize;

    const pos = this.getPosition(mapProjection, MapCullableLocationTextLabel.tempVec2);

    let left = pos[0] - this.anchor[0] * width;
    let right = left + width;
    let top = pos[1] - this.anchor[1] * height;
    let bottom = top + height;
    if (this.showBg) {
      left -= (this.bgPadding[3] + this.bgOutlineWidth);
      right += (this.bgPadding[1] + this.bgOutlineWidth);
      top -= (this.bgPadding[0] + this.bgOutlineWidth);
      bottom += (this.bgPadding[2] + this.bgOutlineWidth);
    }

    this.bounds[0] = left;
    this.bounds[1] = top;
    this.bounds[2] = right;
    this.bounds[3] = bottom;
  }
}

/**
 * Manages a set of MapCullableTextLabels. Colliding labels will be culled based on their render priority. Labels with
 * lower priorities will be culled before labels with higher priorities.
 */
export class MapCullableTextLabelManager {
  public static readonly ROTATION_UPDATE_THRESHOLD = Math.PI / 6;

  private readonly registered = new Set<MapCullableTextLabel>();
  private _visibleLabels: MapCullableTextLabel[] = [];
  // eslint-disable-next-line jsdoc/require-returns
  /** An array of labels registered with this manager that are visible. */
  public get visibleLabels(): readonly MapCullableTextLabel[] {
    return this._visibleLabels;
  }

  private needUpdate = false;
  private lastRange = 0;
  private lastRotation = 0;

  /**
   * Registers a label with this manager. Newly registered labels will be processed with the next manager update.
   * @param label The label to register.
   */
  public register(label: MapCullableTextLabel): void {
    if (this.registered.has(label)) {
      return;
    }

    this.registered.add(label);
    this.needUpdate = true;
  }

  /**
   * Deregisters a label with this manager. Newly deregistered labels will be processed with the next manager update.
   * @param label The label to deregister.
   */
  public deregister(label: MapCullableTextLabel): void {
    this.needUpdate = this.registered.delete(label) || this.needUpdate;
  }

  /**
   * Updates this manager.
   * @param mapProjection The projection of the map to which this manager's labels are to be drawn.
   */
  public update(mapProjection: MapProjection): void {
    if (!this.needUpdate) {
      if (mapProjection.getRange() === this.lastRange) {
        const rotationDelta = Math.abs(mapProjection.getRotation() - this.lastRotation);
        if (Math.min(rotationDelta, 2 * Math.PI - rotationDelta) < MapCullableTextLabelManager.ROTATION_UPDATE_THRESHOLD) {
          return;
        }
      }
    }

    this._visibleLabels = [];

    const labelArray = Array.from(this.registered.values());
    const len = labelArray.length;
    for (let i = 0; i < len; i++) {
      labelArray[i].updateBounds(mapProjection);
    }

    labelArray.sort((a: MapCullableTextLabel, b: MapCullableTextLabel): number => {
      if (a.alwaysShow && !b.alwaysShow) {
        return -1;
      } else if (b.alwaysShow && !a.alwaysShow) {
        return 1;
      } else {
        return b.priority - a.priority;
      }
    });

    const collisionArray: Float64Array[] = [];
    for (let i = 0; i < len; i++) {
      const label = labelArray[i];
      let show = true;
      if (!label.alwaysShow) {
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

    this.lastRange = mapProjection.getRange();
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