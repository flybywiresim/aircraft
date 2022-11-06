import { ReadonlyFloat64Array, Vec2Math } from './VecMath';

/** A readonly 2D affine transformation. */
export type ReadonlyTransform2D = Pick<Transform2D, 'getParameters' | 'apply' | 'copy'>;

/**
 * A 2D affine transformation. By default, Transform2D objects are initially created as identity transformations.
 */
export class Transform2D {
  private readonly array = new Float64Array([1, 0, 0, 0, 1, 0]);

  /**
   * Gets the parameters of this transformation as a 6-tuple: `[scaleX, skewX, translateX, skewY, scaleY, translateY]`.
   * @returns The parameters of this transformation.
   */
  public getParameters(): ReadonlyFloat64Array {
    return this.array;
  }

  /**
   * Sets the parameters of this transformation.
   * @param scaleX The x scaling factor.
   * @param skewX The x skew factor.
   * @param translateX The x translation.
   * @param skewY The y skew factor.
   * @param scaleY The y scaling factor.
   * @param translateY The y translation.
   * @returns This transformation, after it has been changed.
   */
  public set(scaleX: number, skewX: number, translateX: number, skewY: number, scaleY: number, translateY: number): this;
  /**
   * Sets the parameters of this transformation from another transformation.
   * @param transform The transformation from which to take parameters.
   */
  public set(transform: ReadonlyTransform2D): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: number | ReadonlyTransform2D, skewX?: number, translateX?: number, skewY?: number, scaleY?: number, translateY?: number): this {
    let scaleX = arg1;
    if (arg1 instanceof Transform2D) {
      [scaleX, skewX, translateX, skewY, scaleY, translateY] = arg1.array;
    }

    const array = this.array;
    array[0] = scaleX as number;
    array[1] = skewX as number;
    array[2] = translateX as number;
    array[3] = skewY as number;
    array[4] = scaleY as number;
    array[5] = translateY as number;
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
    this.array[4] = value;
    return this;
  }

  /**
   * Sets the x and y scaling factors of this transformation.
   * @param x The new x scaling factor.
   * @param y The new y scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public setScale(x: number, y: number): this {
    this.array[0] = x;
    this.array[4] = y;
    return this;
  }

  /**
   * Sets the x skew factor of this transformation.
   * @param value The new x skew factor.
   * @returns This transformation, after it has been changed.
   */
  public setSkewX(value: number): this {
    this.array[1] = value;
    return this;
  }

  /**
   * Sets the y skew factor of this transformation.
   * @param value The new y skew factor.
   * @returns This transformation, after it has been changed.
   */
  public setSkewY(value: number): this {
    this.array[3] = value;
    return this;
  }

  /**
   * Sets the x translation of this transformation.
   * @param value The new x translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslateX(value: number): this {
    this.array[2] = value;
    return this;
  }

  /**
   * Sets the y translation of this transformation.
   * @param value The new y translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslateY(value: number): this {
    this.array[5] = value;
    return this;
  }

  /**
   * Sets the x and y translations of this transformation.
   * @param x The new x translation.
   * @param y The new y translation.
   * @returns This transformation, after it has been changed.
   */
  public setTranslate(x: number, y: number): this {
    this.array[2] = x;
    this.array[5] = y;
    return this;
  }

  /**
   * Inverts this transformation.
   * @returns This transformation, after it has been inverted.
   */
  public invert(): this {
    const array = this.array;

    const e_00 = array[0];
    const e_01 = array[1];
    const e_02 = array[2];
    const e_10 = array[3];
    const e_11 = array[4];
    const e_12 = array[5];

    const i_00 = e_11;
    const i_01 = -e_10;

    const i_10 = -e_01;
    const i_11 = e_00;

    const i_20 = e_01 * e_12 - e_02 * e_11;
    const i_21 = -(e_00 * e_12 - e_02 * e_10);

    const det = e_00 * i_00 + e_01 * i_01;

    return this.set(i_00 / det, i_10 / det, i_20 / det, i_01 / det, i_11 / det, i_21 / det);
  }

  /**
   * Copies this transformation.
   * @returns A copy of this transformation.
   */
  public copy(): Transform2D {
    return new Transform2D().set(this);
  }

  /**
   * Applies this transformation to a 2D vector.
   * @param vec A 2D vector.
   * @param out The vector to which to write the result.
   * @returns The result of applying this transformation to `vec`.
   */
  public apply(vec: ReadonlyFloat64Array, out: Float64Array): Float64Array {
    const array = this.array;
    const x = vec[0] * array[0] + vec[1] * array[1] + array[2];
    const y = vec[0] * array[3] + vec[1] * array[4] + array[5];

    return Vec2Math.set(x, y, out);
  }

  private static readonly offsetOriginCache = [new Transform2D(), undefined, new Transform2D()] as Transform2D[];

  /**
   * Changes this transformation to the one that is the result of offsetting this transformation's origin.
   * @param x The x-coordinate of the offset origin.
   * @param y The y-coordinate of the offset origin.
   * @returns This transformation, after it has been changed.
   */
  public offsetOrigin(x: number, y: number): this {
    Transform2D.offsetOriginCache[0].toTranslation(-x, -y);
    Transform2D.offsetOriginCache[1] = this;
    Transform2D.offsetOriginCache[2].toTranslation(x, y);

    return Transform2D.concat(this, Transform2D.offsetOriginCache);
  }

  /**
   * Sets this transformation to the identity transformation.
   * @returns This transformation, after it has been changed.
   */
  public toIdentity(): this {
    return this.set(1, 0, 0, 0, 1, 0);
  }

  /**
   * Sets this transformation to a translation.
   * @param x The x translation.
   * @param y The y translation.
   * @returns This transformation, after it has been changed.
   */
  public toTranslation(x: number, y: number): this {
    return this.set(1, 0, x, 0, 1, y);
  }

  /**
   * Sets this transformation to a scaling about the origin (0, 0).
   * @param x The x scaling factor.
   * @param y The y scaling factor.
   * @returns This transformation, after it has been changed.
   */
  public toScale(x: number, y: number): this;
  /**
   * Sets this transformation to a scaling about an arbitrary origin.
   * @param x The x scaling factor.
   * @param y The y scaling factor.
   * @param originX The x-coordinate of the scaling origin.
   * @param originY The y-coordinate of the scaling origin.
   * @returns This transformation, after it has been changed.
   */
  public toScale(x: number, y: number, originX: number, originY: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toScale(x: number, y: number, originX?: number, originY?: number): this {
    this.set(x, 0, 0, 0, y, 0);
    if (originX !== undefined && originY !== undefined) {
      this.offsetOrigin(originX, originY);
    }
    return this;
  }

  /**
   * Sets this transformation to a rotation about the origin (0, 0).
   * @param theta The rotation angle, in radians.
   * @returns This transformation, after it has been changed.
   */
  public toRotation(theta: number): this;
  /**
   * Sets this transformation to a rotation about an arbitrary origin.
   * @param theta The rotation angle, in radians.
   * @param originX The x-coordinate of the rotation origin.
   * @param originY The y-coordinate of the rotation origin.
   * @returns This transformation, after it has been changed.
   */
  public toRotation(theta: number, originX: number, originY: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toRotation(theta: number, originX?: number, originY?: number): this {
    const sin = Math.sin(theta);
    const cos = Math.cos(theta);

    this.set(cos, -sin, 0, sin, cos, 0);
    if (originX !== undefined && originY !== undefined) {
      this.offsetOrigin(originX, originY);
    }
    return this;
  }

  /**
   * Sets this transformation to a reflection across a line passing through the origin (0, 0).
   * @param theta The angle of the reflection line, in radians, with respect to the positive x axis.
   * @returns This transformation, after it has been changed.
   */
  public toReflection(theta: number): this;
  /**
   * Sets this transformation to a reflection across a line passing through an arbitrary origin.
   * @param theta The angle of the reflection line, in radians, with respect to the positive x axis.
   * @param originX The x-coordinate of the reflection origin.
   * @param originY The y-coordinate of the reflection origin.
   * @returns This transformation, after it has been changed.
   */
  public toReflection(theta: number, originX: number, originY: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public toReflection(theta: number, originX?: number, originY?: number): this {
    const sin = Math.sin(2 * theta);
    const cos = Math.cos(2 * theta);

    this.set(cos, sin, 0, sin, -cos, 0);
    if (originX !== undefined && originY !== undefined) {
      this.offsetOrigin(originX, originY);
    }
    return this;
  }

  private static readonly concatCache = [new Transform2D(), new Transform2D()];

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
  public static concat<T extends Transform2D>(out: T, transforms: readonly ReadonlyTransform2D[]): T {
    if (transforms.length === 0) {
      return out.toIdentity();
    }

    if (transforms.length === 1) {
      return out.set(transforms[0]);
    }

    let index = 0;
    let next = transforms[index];
    const oldTransform = Transform2D.concatCache[0];
    const newTransform = Transform2D.concatCache[1].set(next);
    const oldArray = oldTransform.array;
    const newArray = newTransform.array;

    const end = transforms.length;
    while (++index < end) {
      next = transforms[index];
      const nextArray = (next as Transform2D).array;
      oldTransform.set(newTransform);

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          newArray[j * 3 + i] = oldArray[i] * nextArray[j * 3] + oldArray[3 + i] * nextArray[j * 3 + 1] + (i === 2 ? 1 : 0) * nextArray[j * 3 + 2];
        }
      }
    }

    return out.set(newTransform);
  }
}