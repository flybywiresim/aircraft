import { GeoPoint, GeoPointReadOnly } from '../../../geo/GeoPoint';
import { GeoProjection, MercatorProjection } from '../../../geo/GeoProjection';
import { BitFlags } from '../../../math/BitFlags';
import { ReadonlyFloat64Array, Vec2Math } from '../../../math/VecMath';
import { MapLayerProps } from '../MapLayer';
import { MapProjection, MapProjectionChangeType } from '../MapProjection';
import { MapCanvasLayer, MapCanvasLayerCanvasInstance, MapCanvasLayerCanvasInstanceClass } from './MapCanvasLayer';

/**
 * Properties for a MapCachedCanvasLayer.
 */
export interface MapCachedCanvasLayerProps<M> extends MapLayerProps<M> {
  /** Whether to include an offscreen buffer. Must be true. */
  useBuffer: true;

  /** The factor by which the canvas should be overdrawn. Values less than 1 will be clamped to 1. */
  overdrawFactor: number;
}

/**
 * A description of the reference projection of a MapCachedCanvasLayer.
 */
export interface MapCachedCanvasLayerReference {
  /** The map center of this reference. */
  readonly center: GeoPointReadOnly;
  /** The projection scale factor of this reference. */
  readonly scaleFactor: number;
  /** The rotation angle, in radians, of this reference. */
  readonly rotation: number;
}

/**
 * Implementation of MapCachedCanvasLayerReference.
 */
class MapCachedCanvasLayerReferenceClass implements MapCachedCanvasLayerReference {
  private _center = new GeoPoint(0, 0);
  private _scaleFactor = 1;
  private _rotation = 0;

  /** @inheritdoc */
  public get center(): GeoPointReadOnly {
    return this._center.readonly;
  }

  /** @inheritdoc */
  public get scaleFactor(): number {
    return this._scaleFactor;
  }

  /** @inheritdoc */
  public get rotation(): number {
    return this._rotation;
  }

  /**
   * Syncs this reference with the current state of a map projection.
   * @param mapProjection The map projection with which to sync.
   */
  public syncWithMapProjection(mapProjection: MapProjection): void {
    this._center.set(mapProjection.getCenter());
    this._scaleFactor = mapProjection.getScaleFactor();
    this._rotation = mapProjection.getRotation();
  }

  /**
   * Syncs this reference with another reference.
   * @param reference - the reference with which to sync.
   */
  public syncWithReference(reference: MapCachedCanvasLayerReference): void {
    this._center.set(reference.center);
    this._scaleFactor = reference.scaleFactor;
    this._rotation = reference.rotation;
  }
}

/**
 * A description of the transformation of a MapCachedCanvasLayer's canvas element.
 */
export interface MapCachedCanvasLayerTransform {
  /** The scaling factor of this transform. */
  readonly scale: number;
  /** The rotation angle, in radians, of this transform. */
  readonly rotation: number;
  /** The translation, in pixels, of this transform. */
  readonly translation: Float64Array;
  /**
   * The total margin, in pixels, available for translation without invalidating the canvas with this transform's
   * scale factor taken into account.
   */
  readonly margin: number;
  /**
   * The remaining margin, in pixels, available for translation without invalidating the canvas given this transform's
   * current translation and scale factor.
   */
  readonly marginRemaining: number;
}

/**
 * Implementation of MapCachedCanvasLayerTransform.
 */
class MapCachedCanvasLayerTransformClass implements MapCachedCanvasLayerTransform {
  private _scale = 0;
  private _rotation = 0;
  private _translation = new Float64Array(2);
  private _margin = 0;
  private _marginRemaining = 0;

  /** @inheritdoc */
  public get scale(): number {
    return this._scale;
  }

  /** @inheritdoc */
  public get rotation(): number {
    return this._rotation;
  }

  /** @inheritdoc */
  public get translation(): Float64Array {
    return this._translation;
  }

  /** @inheritdoc */
  public get margin(): number {
    return this._margin;
  }

  /** @inheritdoc */
  public get marginRemaining(): number {
    return this._marginRemaining;
  }

  /**
   * Updates this transform given the current map projection and a reference.
   * @param mapProjection The current map projection.
   * @param reference The reference to use.
   * @param referenceMargin The reference margin, in pixels.
   */
  public update(mapProjection: MapProjection, reference: MapCachedCanvasLayerReference, referenceMargin: number): void {
    this._scale = mapProjection.getScaleFactor() / reference.scaleFactor;
    this._rotation = mapProjection.getRotation() - reference.rotation;

    mapProjection.project(reference.center, this._translation);
    Vec2Math.sub(this._translation, mapProjection.getCenterProjected(), this._translation);
    this._margin = referenceMargin * this._scale;
    this._marginRemaining = this._margin - Math.max(Math.abs(this._translation[0]), Math.abs(this._translation[1]));
  }

  /**
   * Copies another transform's parameters to this one.
   * @param other The other transform.
   */
  public copyFrom(other: MapCachedCanvasLayerTransform): void {
    this._scale = other.scale;
    this._rotation = other.rotation;
    this._translation.set(other.translation);
    this._margin = other.margin;
  }
}

/**
 * An instance of a canvas within a MapCachedCanvasLayer.
 */
export interface MapCachedCanvasLayerCanvasInstance extends MapCanvasLayerCanvasInstance {
  /**
   * This instance's map projection reference. The rendering of items to this instance's canvas is based on this
   * reference.
   */
  readonly reference: MapCachedCanvasLayerReference;

  /** This instance's transform. */
  readonly transform: MapCachedCanvasLayerTransform;

  /** Whether this instance's transform is invalid. */
  readonly isInvalid: boolean;

  /** The projection used to draw this instance's canvas image. */
  readonly geoProjection: GeoProjection;

  /**
   * Syncs this canvas instance with the current map projection.
   * @param mapProjection The current map projection.
   */
  syncWithMapProjection(mapProjection: MapProjection): void;

  /**
   * Syncs this canvas instance with another canvas instance.
   * @param other - the canvas instance with which to sync.
   */
  syncWithCanvasInstance(other: MapCachedCanvasLayerCanvasInstance): void;

  /**
   * Invalidates this canvas instance. This also clears the canvas.
   */
  invalidate(): void;
}

/**
 * An implementation of MapCachedCanvasLayerCanvasInstance.
 */
export class MapCachedCanvasLayerCanvasInstanceClass extends MapCanvasLayerCanvasInstanceClass implements MapCachedCanvasLayerCanvasInstance {
  private static readonly SCALE_INVALIDATION_THRESHOLD = 1.2;

  private static readonly tempVec2_1 = new Float64Array(2);

  private readonly _reference = new MapCachedCanvasLayerReferenceClass();
  private readonly _transform = new MapCachedCanvasLayerTransformClass();
  private _isInvalid = false;
  private readonly _geoProjection = new MercatorProjection();

  /**
   * Creates a new canvas instance.
   * @param canvas The canvas element.
   * @param context The canvas 2D rendering context.
   * @param isDisplayed Whether the canvas is displayed.
   * @param getReferenceMargin A function which gets this canvas instance's reference margin, in pixels. The reference
   * margin is the maximum amount of translation allowed without invalidation at a scale factor of 1.
   */
  constructor(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    isDisplayed: boolean,
    private readonly getReferenceMargin: () => number
  ) {
    super(canvas, context, isDisplayed);
  }

  /** @inheritdoc */
  public get reference(): MapCachedCanvasLayerReference {
    return this._reference;
  }

  /** @inheritdoc */
  public get transform(): MapCachedCanvasLayerTransform {
    return this._transform;
  }

  /** @inheritdoc */
  public get isInvalid(): boolean {
    return this._isInvalid;
  }

  /** @inheritdoc */
  public get geoProjection(): GeoProjection {
    return this._geoProjection;
  }

  /** @inheritdoc */
  public syncWithMapProjection(mapProjection: MapProjection): void {
    const projectedCenter = Vec2Math.set(this.canvas.width / 2, this.canvas.height / 2, MapCachedCanvasLayerCanvasInstanceClass.tempVec2_1);
    this._reference.syncWithMapProjection(mapProjection);
    this._geoProjection.copyParametersFrom(mapProjection.getGeoProjection()).setTranslation(projectedCenter);
    this._transform.update(mapProjection, this.reference, this.getReferenceMargin());
    this._isInvalid = false;

    if (this.isDisplayed) {
      this.transformCanvasElement();
    }
  }

  /** @inheritdoc */
  public syncWithCanvasInstance(other: MapCachedCanvasLayerCanvasInstance): void {
    this._reference.syncWithReference(other.reference);
    this._geoProjection.copyParametersFrom(other.geoProjection);
    this._transform.copyFrom(other.transform);
    this._isInvalid = other.isInvalid;

    if (this.isDisplayed && !this._isInvalid) {
      this.transformCanvasElement();
    }
  }

  /**
   * Updates this canvas instance's transform given the current map projection.
   * @param mapProjection The current map projection.
   */
  public updateTransform(mapProjection: MapProjection): void {
    this._transform.update(mapProjection, this.reference, this.getReferenceMargin());

    if (!this._isInvalid) {
      const scaleFactorRatio = mapProjection.getScaleFactor() / this._reference.scaleFactor;
      this._isInvalid = scaleFactorRatio >= MapCachedCanvasLayerCanvasInstanceClass.SCALE_INVALIDATION_THRESHOLD
        || scaleFactorRatio <= 1 / MapCachedCanvasLayerCanvasInstanceClass.SCALE_INVALIDATION_THRESHOLD
        || this._transform.marginRemaining < 0;
    }

    if (this.isDisplayed && !this._isInvalid) {
      this.transformCanvasElement();
    }
  }

  /**
   * Transforms this instance's canvas element.
   */
  protected transformCanvasElement(): void {
    const transform = this.transform;
    const offsetX = transform.translation[0] / transform.scale;
    const offsetY = transform.translation[1] / transform.scale;

    this.canvas.style.transform = `scale(${transform.scale.toFixed(3)}) translate(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px) rotate(${(transform.rotation * Avionics.Utils.RAD2DEG).toFixed(2)}deg)`;
  }

  /** @inheritdoc */
  public invalidate(): void {
    this._isInvalid = true;
    this.clear();
  }
}

/**
 * A canvas map layer whose image can be cached and transformed as the map projection changes.
 */
export class MapCachedCanvasLayer<P extends MapCachedCanvasLayerProps<any> = MapCachedCanvasLayerProps<any>> extends MapCanvasLayer<P, MapCachedCanvasLayerCanvasInstance> {
  private size = 0;
  private referenceMargin = 0;
  private needUpdateTransforms = false;

  /** @inheritdoc */
  constructor(props: P) {
    super(props);

    this.props.overdrawFactor = Math.max(1, this.props.overdrawFactor);
  }

  /**
   * Gets the size, in pixels, of this layer's canvas.
   * @returns the size of this layer's canvas.
   */
  public getSize(): number {
    return this.size;
  }

  /**
   * Gets the reference translation margin, in pixels, of this layer's display canvas. This value is the maximum amount
   * the display canvas can be translated in the x or y direction at a scale factor of 1 without invalidation.
   * @returns the reference translation margin of this layer's display canvas.
   */
  public getReferenceMargin(): number {
    return this.referenceMargin;
  }

  /** @inheritdoc */
  public onAttached(): void {
    super.onAttached();

    this.updateFromProjectedSize(this.props.mapProjection.getProjectedSize());
    this.needUpdateTransforms = true;
  }

  /** @inheritdoc */
  protected createCanvasInstance(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, isDisplayed: boolean): MapCachedCanvasLayerCanvasInstanceClass {
    return new MapCachedCanvasLayerCanvasInstanceClass(canvas, context, isDisplayed, this.getReferenceMargin.bind(this));
  }

  /**
   * Updates this layer according to the current size of the projected map window.
   * @param projectedSize The size of the projected map window.
   */
  protected updateFromProjectedSize(projectedSize: ReadonlyFloat64Array): void {
    const projectedWidth = projectedSize[0];
    const projectedHeight = projectedSize[1];
    const diag = Math.hypot(projectedWidth, projectedHeight);

    this.size = diag * this.props.overdrawFactor;
    this.referenceMargin = (this.size - diag) / 2;

    this.setWidth(this.size);
    this.setHeight(this.size);

    const posX = (projectedWidth - this.size) / 2;
    const posY = (projectedHeight - this.size) / 2;

    const displayCanvas = this.display.canvas;
    displayCanvas.style.left = `${posX}px`;
    displayCanvas.style.top = `${posY}px`;
  }

  /** @inheritdoc */
  public onMapProjectionChanged(mapProjection: MapProjection, changeFlags: number): void {
    if (BitFlags.isAll(changeFlags, MapProjectionChangeType.ProjectedSize)) {
      this.updateFromProjectedSize(mapProjection.getProjectedSize());
      this.display.invalidate();
      this.buffer.invalidate();
    }

    this.needUpdateTransforms = true;
  }

  /** @inheritdoc */
  public onUpdated(time: number, elapsed: number): void {
    super.onUpdated(time, elapsed);

    if (!this.needUpdateTransforms) {
      return;
    }

    this.updateTransforms();
  }

  /**
   * Updates this layer's canvas instances' transforms.
   */
  protected updateTransforms(): void {
    const mapProjection = this.props.mapProjection;
    const display = this.display as MapCachedCanvasLayerCanvasInstanceClass;
    const buffer = this.buffer as MapCachedCanvasLayerCanvasInstanceClass;

    display.updateTransform(mapProjection);
    buffer.updateTransform(mapProjection);

    this.needUpdateTransforms = false;
  }
}