import { ReadonlyFloat64Array, Vec3Math } from './VecMath';

/** A readonly 3D affine transformation. */
export type ReadonlyTransform3D = Pick<Transform3D, 'getParameters' | 'apply' | 'copy'>;

/**
 * A 3D affine transformation. By default, Transform3D objects are initially created as identity transformations.
 */
export class Transform3D {
  private readonly array = new Float64Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0
  ]);

  /**
   * Gets the parameters of this transformation as a 12-tuple:
   * `[scaleX, skewX(Y), skewX(Z), translateX, skewY(X), scaleY, skewY(Z), translateY, skewZ(X), skewZ(Y), scaleZ, translateZ]`.
   * @returns The parameters of this transformation.
   */
  public getParameters(): Readonly<Float64Array> {
    return this.array;
  }

  /**
   * Sets the parameters of this transformation.
   * @param scaleX The x scaling factor.
   * @param skewXY The x skew factor along the y axis.
   * @param skewXZ The x skew factor along the z axis.
   * @param translateX The x translation.
   * @param skewYX The y skew factor along the x axis.
   * @param scaleY The y scaling factor.
   * @param skewYZ The y skew factor along the z axis.
   * @param translateY The y translation.
   * @param skewZX The z skew factor along the x axis.
   * @param skewZY The z skew factor along the y axis.
   * @param scaleZ The z scaling factor.
   * @param translateZ The z translation.
   * @returns This transformation, after it has been changed.
   */
  public set(
    scaleX: number,
    skewXY: number,
    skewXZ: number,
    translateX: number,
    skewYX: number,
    scaleY: number,
    skewYZ: number,
    translateY: number,
    skewZX: number,
    skewZY: number,
    scaleZ: number,
    translateZ: number
  ): this;
  /**
   * Sets the parameters of this transformation from another transformation.
   * @param transform The transformation from which to take parameters.
   */
  public set(transform: ReadonlyTransform3D): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(
    arg1: number | ReadonlyTransform3D,
    skewXY?: number,
    skewXZ?: number,
    translateX?: number,
    skewYX?: number,
    scaleY?: number,
    skewYZ?: number,
    translateY?: number,
    skewZX?: number,
    skewZY?: number,
    scaleZ?: number,
    translateZ?: number
  ): this {
    let scaleX = arg1;
    if (arg1 instanceof Transform3D) {
      [scaleX, skewXY, skewXZ, translateX, skewYX, scaleY, skewYZ, translateY, skewZX, skewZY, scaleZ, translateZ] = arg1.array;
    }

    const array = this.array;
    array[0] = scaleX as number;
    array[1] = skewXY as number;
    array[2] = skewXZ as number;
    array[3] = translateX as number;
    array[4] = skewYX as number;
    array[5] = scaleY as number;
    array[6] = skewYZ as number;
    array[7] = translateY as number;
    array[8] = skewZX as number;
    array[9] = skewZY as number;
    array[10] = scaleZ as number;
    array[11] = translateZ as number;
    return this;
  }

  /**
   * Sets the x scaling factor of this transformation.
   * @param value The new x scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public setScaleX(value: number): this {
    this.array[0] = value;
    return this;
  }

  /**
   * Sets the y scaling factor of this transformation.
   * @param value The new y scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public setScaleY(value: number): this {
    this.array[5] = value;
    return this;
  }

  /**
   * Sets the z scaling factor of this transformation.
   * @param value The new z scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public setScaleZ(value: number): this {
    this.array[10] = value;
    return this;
  }

  /**
   * Sets the x and y scaling factors of this transformation.
   * @param x The new x scaling factor.
   * @param y The new y scaling factor.
   * @param z The new z scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public setScale(x: number, y: number, z: number): this {
    this.array[0] = x;
    this.array[5] = y;
    this.array[10] = z;
    return this;
  }

  /**
   * Sets the x skew factor of this transformation.
   * @param y The new x skew factor along the y axis.
   * @param z The new x skew factor along the z axis.
   * @returns This transformation, after it has been changed.
   */
  public setSkewX(y: number, z: number): this {
    this.array[1] = y;
    this.array[2] = z;
    return this;
  }

  /**
   * Sets the y skew factor of this transformation.
   * @param x The new y skew factor along the x axis.
   * @param z The new y skew factor along the z axis.
   * @returns This transformation, after it has been changed.
   */
  public setSkewY(x: number, z: number): this {
    this.array[4] = x;
    this.array[6] = z;
    return this;
  }

  /**
   * Sets the z skew factor of this transformation.
   * @param x The new z skew factor along the x axis.
   * @param y The new z skew factor along the y axis.
   * @returns This transformation, after it has been changed.
   */
  public setSkewZ(x: number, y: number): this {
    this.array[8] = x;
    this.array[9] = y;
    return this;
  }

  /**
   * Sets the x translation of this transformation.
   * @param value The new x translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslateX(value: number): this {
    this.array[3] = value;
    return this;
  }

  /**
   * Sets the y translation of this transformation.
   * @param value The new y translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslateY(value: number): this {
    this.array[7] = value;
    return this;
  }

  /**
   * Sets the z translation of this transformation.
   * @param value The new z translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslateZ(value: number): this {
    this.array[11] = value;
    return this;
  }

  /**
   * Sets the x and y translations of this transformation.
   * @param x The new x translation.
   * @param y The new y translation.
   * @param z The new z translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslate(x: number, y: number, z: number): this {
    this.array[3] = x;
    this.array[7] = y;
    this.array[11] = z;
    return this;
  }

  /**
   * Inverts this transformation.
   * @returns This transformation, after it has been inverted.
   * @throws Error if this transformation cannot be inverted.
   */
  public invert(): this {
    const array = this.array;

    const e_00 = array[0];
    const e_01 = array[1];
    const e_02 = array[2];
    const e_03 = array[3];
    const e_10 = array[4];
    const e_11 = array[5];
    const e_12 = array[6];
    const e_13 = array[7];
    const e_20 = array[8];
    const e_21 = array[9];
    const e_22 = array[10];
    const e_23 = array[11];

    const c_00 = e_11 * e_22 - e_12 * e_21;
    const c_01 = e_12 * e_20 - e_10 * e_22;
    const c_02 = e_10 * e_21 - e_11 * e_20;

    const c_10 = e_02 * e_21 - e_01 * e_22;
    const c_11 = e_00 * e_22 - e_02 * e_20;
    const c_12 = e_01 * e_20 - e_00 * e_21;

    const c_20 = e_01 * e_12 - e_02 * e_11;
    const c_21 = e_02 * e_10 - e_00 * e_12;
    const c_22 = e_00 * e_11 - e_01 * e_10;

    const det = e_00 * c_00 + e_01 * c_01 + e_02 * c_02;

    if (det === 0) {
      throw new Error(`Transform3D: cannot invert transformation with parameters: ${this.array}`);
    }

    const i_00 = c_00 / det;
    const i_01 = c_10 / det;
    const i_02 = c_20 / det;
    const i_10 = c_01 / det;
    const i_11 = c_11 / det;
    const i_12 = c_21 / det;
    const i_20 = c_02 / det;
    const i_21 = c_12 / det;
    const i_22 = c_22 / det;

    const i_03 = -(i_00 * e_03 + i_01 * e_13 + i_02 * e_23);
    const i_13 = -(i_10 * e_03 + i_11 * e_13 + i_12 * e_23);
    const i_23 = -(i_20 * e_03 + i_21 * e_13 + i_22 * e_23);

    return this.set(
      i_00, i_01, i_02, i_03,
      i_10, i_11, i_12, i_13,
      i_20, i_21, i_22, i_23
    );
  }

  /**
   * Copies this transformation.
   * @returns A copy of this transformation.
   */
  public copy(): Transform3D {
    return new Transform3D().set(this);
  }

  /**
   * Applies this transformation to a 3D vector.
   * @param vec A 3D vector.
   * @param out The vector to which to write the result.
   * @returns The result of applying this transformation to `vec`.
   */
  public apply(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array {
    const array = this.array;
    const x = vec[0] * array[0] + vec[1] * array[1] + vec[2] * array[2] + array[3];
    const y = vec[0] * array[4] + vec[1] * array[5] + vec[2] * array[6] + array[7];
    const z = vec[0] * array[8] + vec[1] * array[9] + vec[2] * array[10] + array[11];

    return Vec3Math.set(x, y, z, out);
  }

  private static readonly offsetOriginCache = [new Transform3D(), undefined, new Transform3D()] as Transform3D[];

  /**
   * Changes this transformation to the one that is the result of offsetting this transformation's origin.
   * @param x The x-coordinate of the offset origin.
   * @param y The y-coordinate of the offset origin.
   * @param z The z-coordinate of the offset origin.
   * @returns This transformation, after it has been changed.
   */
  public offsetOrigin(x: number, y: number, z: number): this {
    Transform3D.offsetOriginCache[0].toTranslation(-x, -y, -z);
    Transform3D.offsetOriginCache[1] = this;
    Transform3D.offsetOriginCache[2].toTranslation(x, y, z);

    return Transform3D.concat(this, Transform3D.offsetOriginCache);
  }

  /**
   * Sets this transformation to the identity transformation.
   * @returns This transformation, after it has been changed.
   */
  public toIdentity(): this {
    return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0);
  }

  /**
   * Sets this transformation to a translation.
   * @param x The x translation.
   * @param y The y translation.
   * @param z The z translation.
   * @returns This transformation, after it has been changed.
   */
  public toTranslation(x: number, y: number, z: number): this {
    return this.set(1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z);
  }

  /**
   * Sets this transformation to a scaling about the origin (0, 0, 0).
   * @param x The x scaling factor.
   * @param y The y scaling factor.
   * @param z The z scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public toScale(x: number, y: number, z: number): this;
  /**
   * Sets this transformation to a scaling about an arbitrary origin.
   * @param x The x scaling factor.
   * @param y The y scaling factor.
   * @param z The z scaling factor.
   * @param originX The x-coordinate of the scaling origin.
   * @param originY The y-coordinate of the scaling origin.
   * @param originZ The z-coordinate of the scaling origin.
   * @returns This transformation, after it has been changed.
   */
  public toScale(x: number, y: number, z: number, originX: number, originY: number, originZ: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toScale(x: number, y: number, z: number, originX?: number, originY?: number, originZ?: number): this {
    this.set(x, 0, 0, 0, 0, y, 0, 0, 0, 0, 1, 0);
    if (originX !== undefined && originY !== undefined && originZ !== undefined) {
      this.offsetOrigin(originX, originY, originZ);
    }
    return this;
  }

  /**
   * Sets this transformation to a rotation about an axis parallel to the x axis passing through the origin (0, 0, 0).
   * @param theta The rotation angle, in radians.
   * @returns This transformation, after it has been changed.
   */
  public toRotationX(theta: number): this;
  /**
   * Sets this transformation to a rotation about an axis parallel to the x axis passing through an arbitrary point.
   * @param theta The rotation angle, in radians.
   * @param originX The x-coordinate of the rotation origin.
   * @param originY The y-coordinate of the rotation origin.
   * @param originZ The z-coordinate of the rotation origin.
   * @returns This transformation, after it has been changed.
   */
  public toRotationX(theta: number, originX: number, originY: number, originZ: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toRotationX(theta: number, originX?: number, originY?: number, originZ?: number): this {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    this.set(1, 0, 0, 0, 0, cos, -sin, 0, 0, sin, cos, 0);
    if (originX !== undefined && originY !== undefined && originZ !== undefined) {
      this.offsetOrigin(originX, originY, originZ);
    }
    return this;
  }

  /**
   * Sets this transformation to a rotation about an axis parallel to the y axis passing through the origin (0, 0, 0).
   * @param theta The rotation angle, in radians.
   * @returns This transformation, after it has been changed.
   */
  public toRotationY(theta: number): this;
  /**
   * Sets this transformation to a rotation about an axis parallel to the y axis passing through an arbitrary point.
   * @param theta The rotation angle, in radians.
   * @param originX The x-coordinate of the rotation origin.
   * @param originY The y-coordinate of the rotation origin.
   * @param originZ The z-coordinate of the rotation origin.
   * @returns This transformation, after it has been changed.
   */
  public toRotationY(theta: number, originX: number, originY: number, originZ: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toRotationY(theta: number, originX?: number, originY?: number, originZ?: number): this {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    this.set(cos, 0, sin, 0, 0, 1, 0, 0, -sin, 0, cos, 0);
    if (originX !== undefined && originY !== undefined && originZ !== undefined) {
      this.offsetOrigin(originX, originY, originZ);
    }
    return this;
  }

  /**
   * Sets this transformation to a rotation about an axis parallel to the z axis passing through the origin (0, 0, 0).
   * @param theta The rotation angle, in radians.
   * @returns This transformation, after it has been changed.
   */
  public toRotationZ(theta: number): this;
  /**
   * Sets this transformation to a rotation about an axis parallel to the z axis passing through an arbitrary point.
   * @param theta The rotation angle, in radians.
   * @param originX The x-coordinate of the rotation origin.
   * @param originY The y-coordinate of the rotation origin.
   * @param originZ The z-coordinate of the rotation origin.
   * @returns This transformation, after it has been changed.
   */
  public toRotationZ(theta: number, originX: number, originY: number, originZ: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toRotationZ(theta: number, originX?: number, originY?: number, originZ?: number): this {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    this.set(cos, -sin, 0, 0, sin, cos, 0, 0, 0, 0, 1, 0);
    if (originX !== undefined && originY !== undefined && originZ !== undefined) {
      this.offsetOrigin(originX, originY, originZ);
    }
    return this;
  }

  /**
   * Sets this transformation to a rotation about an arbitrary axis passing through the origin (0, 0, 0).
   * @param theta The rotation angle, in radians.
   * @param axisX The x component of the vector defining the direction of the rotation axis.
   * @param axisY The y component of the vector defining the direction of the rotation axis.
   * @param axisZ The z component of the vector defining the direction of the rotation axis.
   * @returns This transformation, after it has been changed.
   */
  public toRotation(theta: number, axisX: number, axisY: number, axisZ: number): this;
  /**
   * Sets this transformation to a rotation about an arbitrary axis passing through an arbitrary point.
   * @param theta The rotation angle, in radians.
   * @param axisX The x component of the vector defining the direction of the rotation axis.
   * @param axisY The y component of the vector defining the direction of the rotation axis.
   * @param axisZ The z component of the vector defining the direction of the rotation axis.
   * @param originX The x-coordinate of the rotation origin.
   * @param originY The y-coordinate of the rotation origin.
   * @param originZ The z-coordinate of the rotation origin.
   * @returns This transformation, after it has been changed.
   */
  public toRotation(theta: number, axisX: number, axisY: number, axisZ: number, originX: number, originY: number, originZ: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toRotation(theta: number, axisX: number, axisY: number, axisZ: number, originX?: number, originY?: number, originZ?: number): this {
    const abs = Math.hypot(axisX, axisY, axisZ);

    const ux = axisX / abs;
    const uy = axisY / abs;
    const uz = axisZ / abs;

    const ux_uy = ux * uy;
    const ux_uz = ux * uz;
    const uy_uz = uy * uz;

    const sin = Math.sin(theta);
    const cos = Math.cos(theta);
    const cosCompl = 1 - cos;

    this.set(
      cos + ux * ux * cosCompl, ux_uy * cosCompl - uz * sin, ux_uz * cosCompl * uy * sin, 0,
      ux_uy * cosCompl + uz * sin, cos + uy * uy * cosCompl, uy_uz * cosCompl - ux * sin, 0,
      ux_uz * cosCompl - uy * sin, uy_uz * cosCompl + ux * sin, cos + uz * uz * cosCompl, 0
    );
    if (originX !== undefined && originY !== undefined && originZ !== undefined) {
      this.offsetOrigin(originX, originY, originZ);
    }
    return this;
  }

  private static readonly concatCache = [new Transform3D(), new Transform3D()];

  /**
   * Concatenates one or more transformations and returns the result. Concatenating transformations `[A, B, ...]`
   * results in a transformation that is equivalent to first applying `A`, then applying `B`, etc. Note that this order
   * is the _opposite_ of the one resulting from multiplying the individual transformation _matrices_
   * `M_A * M_B * ...`.
   *
   * If the number of transformations to concatenate equals zero, the identity matrix is returned.
   * @param out The transformation to which to write the result.
   * @param transforms The transformations to concatenate, in order.
   * @returns The result of concatenating all transformations in `transforms`.
   */
  public static concat<T extends Transform3D>(out: T, transforms: readonly ReadonlyTransform3D[]): T {
    if (transforms.length === 0) {
      return out.toIdentity();
    }

    if (transforms.length === 1) {
      return out.set(transforms[0]);
    }

    let index = 0;
    let next = transforms[index];
    const oldTransform = Transform3D.concatCache[0];
    const newTransform = Transform3D.concatCache[1].set(next);
    const oldArray = oldTransform.array;
    const newArray = newTransform.array;

    const end = transforms.length;
    while (++index < end) {
      next = transforms[index];
      const nextArray = (next as Transform3D).array;
      oldTransform.set(newTransform);

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 3; j++) {
          newArray[j * 4 + i] =
            oldArray[i] * nextArray[j * 4]
            + oldArray[4 + i] * nextArray[j * 4 + 1]
            + oldArray[8 + i] * nextArray[j * 4 + 2]
            + (i === 3 ? 1 : 0) * nextArray[j * 4 + 3];
        }
      }
    }

    return out.set(newTransform);
  }
}