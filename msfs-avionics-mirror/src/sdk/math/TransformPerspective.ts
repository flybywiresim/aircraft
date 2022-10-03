import { ReadonlyTransform3D, Transform3D } from './Transform3D';
import { ReadonlyFloat64Array, Vec2Math, Vec3Math } from './VecMath';

/**
 * A readonly perspective transformation.
 */
export type ReadonlyTransformPerspective = Pick<TransformPerspective, 'getCameraPosition' | 'getCameraRotation' | 'getSurfacePosition' | 'apply' | 'copy'>;

/**
 * A perspective transformation.
 */
export class TransformPerspective {
  private static readonly vec3Cache = [Vec3Math.create()];

  private readonly cameraPos = Vec3Math.create();
  private readonly surfacePos = Vec3Math.create(0, 0, 1);

  private readonly cameraPosTransform = new Transform3D();
  private readonly cameraRotationTransform = new Transform3D();
  private readonly cameraRotationInverseTransform = new Transform3D();
  private readonly allCameraTransforms = [this.cameraPosTransform, this.cameraRotationInverseTransform];

  private readonly fullTransform = new Transform3D();

  /**
   * Gets the position of this transformation's camera, as `[x, y, z]` in world coordinates.
   * @returns The position of this transformation's camera, as `[x, y, z]` in world coordinates.
   */
  public getCameraPosition(): ReadonlyFloat64Array {
    return this.cameraPos;
  }

  /**
   * Gets the transformation representing the rotation of this transformation's camera.
   * @returns The transformation representing the rotation of this transformation's camera.
   */
  public getCameraRotation(): ReadonlyTransform3D {
    return this.cameraRotationTransform;
  }

  /**
   * Gets the position of this transformation's projection surface relative to the camera, as `[x, y, z]` in camera
   * coordinates.
   * @returns The position of this transformation's projection surface relative to the camera, as `[x, y, z]` in camera
   * coordinates.
   */
  public getSurfacePosition(): ReadonlyFloat64Array {
    return this.cameraPos;
  }

  /**
   * Sets the parameters of this transformation.
   * @param cameraPos The position of the camera, as `[x, y, z]` in world coordinates.
   * @param cameraRotation A transformation representing the rotation of the camera.
   * @param surfacePos The position of the projection surface relative to the camera, as `[x, y, z]` in camera
   * coordinates.
   * @returns This transformation, after it has been changed.
   */
  public set(
    cameraPos: ReadonlyFloat64Array,
    cameraRotation: ReadonlyTransform3D,
    surfacePos: ReadonlyFloat64Array
  ): this;
  /**
   * Sets the parameters of this transformation from another transformation.
   * @param transform The transformation from which to take parameters.
   */
  public set(
    transform: ReadonlyTransformPerspective
  ): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(
    arg1: ReadonlyFloat64Array | ReadonlyTransformPerspective,
    arg2?: ReadonlyTransform3D,
    arg3?: ReadonlyFloat64Array
  ): this {
    if (arg1 instanceof Float64Array) {
      this._setCameraPosition(arg1);
      this._setCameraRotation(arg2 as ReadonlyTransform3D);
      this.setSurfacePosition(arg3 as ReadonlyFloat64Array);

      Transform3D.concat(this.fullTransform, this.allCameraTransforms);

      return this;
    } else {
      return this.set(
        (arg1 as ReadonlyTransformPerspective).getCameraPosition(),
        (arg1 as ReadonlyTransformPerspective).getCameraRotation(),
        (arg1 as ReadonlyTransformPerspective).getSurfacePosition()
      );
    }
  }

  /**
   * Sets the position of this projection's camera. Does not update the full camera transformation.
   * @param cameraPos The position of the camera, as `[x, y, z]` in world coordinates.
   */
  private _setCameraPosition(cameraPos: ReadonlyFloat64Array): void {
    Vec3Math.copy(cameraPos, this.cameraPos);

    this.cameraPosTransform.toTranslation(-cameraPos[0], -cameraPos[1], -cameraPos[2]);
  }

  /**
   * Sets the rotation of this projection's camera. Does not update the full camera transformation.
   * @param cameraRotation A transformation representing the rotation of the camera.
   */
  public _setCameraRotation(cameraRotation: ReadonlyTransform3D): void {
    this.cameraRotationTransform.set(cameraRotation);
    this.cameraRotationInverseTransform.set(cameraRotation).invert();
  }

  /**
   * Sets the position of this projection's camera.
   * @param cameraPos The position of the camera, as `[x, y, z]` in world coordinates.
   * @returns This transformation, after it has been changed.
   */
  public setCameraPosition(cameraPos: ReadonlyFloat64Array): this {
    this._setCameraPosition(cameraPos);
    Transform3D.concat(this.fullTransform, this.allCameraTransforms);

    return this;
  }

  /**
   * Sets the rotation of this projection's camera.
   * @param cameraRotation A transformation representing the rotation of the camera.
   * @returns This transformation, after it has been changed.
   */
  public setCameraRotation(cameraRotation: ReadonlyTransform3D): this {
    this._setCameraRotation(cameraRotation);
    Transform3D.concat(this.fullTransform, this.allCameraTransforms);

    return this;
  }

  /**
   * Sets the position of this transformation's projection surface relative to the camera.
   * @param surfacePos The position of the projection surface relative to the camera, as `[x, y, z]` in camera
   * coordinates.
   * @returns This transformation, after it has been changed.
   */
  public setSurfacePosition(surfacePos: ReadonlyFloat64Array): this {
    Vec3Math.copy(surfacePos, this.surfacePos);
    return this;
  }

  /**
   * Copies this transformation.
   * @returns A copy of this transformation.
   */
  public copy(): TransformPerspective {
    return new TransformPerspective().set(this);
  }

  /**
   * Applies this transformation to a 3D vector.
   * @param vec A 3D vector, in world coordinates.
   * @param out The 2D vector to which to write the result.
   * @returns The result of applying this transformation to `vec`.
   */
  public apply(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array {
    const transformedVec = this.fullTransform.apply(vec, TransformPerspective.vec3Cache[0]);

    if (Vec3Math.abs(transformedVec) < 1e-7) {
      return Vec2Math.set(0, 0, out);
    }

    if (transformedVec[2] < 0) {
      // vector is behind the camera.
      return Vec2Math.set(NaN, NaN, out);
    }

    const ratio = this.surfacePos[2] / transformedVec[2];

    return Vec2Math.set(
      transformedVec[0] * ratio + this.surfacePos[0],
      transformedVec[1] * ratio + this.surfacePos[1],
      out
    );
  }
}