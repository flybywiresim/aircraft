import { Transform2D, Vec2Math } from '../../math';
import { AbstractTransformingPathStream } from './PathStream';

/**
 * A {@link TransformingPathStream} which applies an affine transformation to its input.
 *
 * The types of transformation supported by this class are:
 * * Translation.
 * * Uniform scaling.
 * * Rotation.
 */
export class AffineTransformPathStream extends AbstractTransformingPathStream {
  private static readonly vec2Cache = [new Float64Array(2)];
  private static readonly transformCache = [new Transform2D()];

  private readonly transform = new Transform2D();

  private readonly concatCache: Transform2D[] = [];

  private scale = 1;
  private rotation = 0;

  /**
   * Adds a translation to this stream's transformation.
   * @param x The x translation.
   * @param y The y translation.
   * @param order The order in which to add the translation (defaults to `'after'`):
   * * `'before'` - Applies the translation before this stream's current transformation.
   * * `'after'` - Applies the translation after this stream's current transformation.
   * @returns This stream, after its transformation has been changed.
   */
  public addTranslation(x: number, y: number, order: 'before' | 'after' = 'after'): this {
    const translation = AffineTransformPathStream.transformCache[0].toTranslation(x, y);

    if (order === 'before') {
      this.concatCache[0] = translation;
      this.concatCache[1] = this.transform;
    } else {
      this.concatCache[0] = this.transform;
      this.concatCache[1] = translation;
    }

    Transform2D.concat(this.transform, this.concatCache);

    return this;
  }

  /**
   * Adds a uniform scaling to this stream's transformation.
   * @param factor The scaling factor.
   * @param order The order in which to add the translation (defaults to `'after'`):
   * * `'before'` - Applies the scaling before this stream's current transformation.
   * * `'after'` - Applies the scaling after this stream's current transformation.
   * @returns This stream, after its transformation has been changed.
   */
  public addScale(factor: number, order: 'before' | 'after' = 'after'): this {
    const scale = AffineTransformPathStream.transformCache[0].toScale(factor, factor);

    if (order === 'before') {
      this.concatCache[0] = scale;
      this.concatCache[1] = this.transform;
    } else {
      this.concatCache[0] = this.transform;
      this.concatCache[1] = scale;
    }

    Transform2D.concat(this.transform, this.concatCache);

    this.updateScaleRotation();

    return this;
  }

  /**
   * Adds a rotation to this stream's transformation.
   * @param angle The rotation angle, in radians.
   * @param order The order in which to add the translation (defaults to `'after'`):
   * * `'before'` - Applies the rotation before this stream's current transformation.
   * * `'after'` - Applies the rotation after this stream's current transformation.
   * @returns This stream, after its transformation has been changed.
   */
  public addRotation(angle: number, order: 'before' | 'after' = 'after'): this {
    const rotation = AffineTransformPathStream.transformCache[0].toRotation(angle);

    if (order === 'before') {
      this.concatCache[0] = rotation;
      this.concatCache[1] = this.transform;
    } else {
      this.concatCache[0] = this.transform;
      this.concatCache[1] = rotation;
    }

    Transform2D.concat(this.transform, this.concatCache);

    this.updateScaleRotation();

    return this;
  }

  /**
   * Resets this stream's transformation to the identity transformation.
   * @returns This stream, after its transformation has been changed.
   */
  public resetTransform(): this {
    this.transform.toIdentity();
    this.updateScaleRotation();
    return this;
  }

  /** @inheritdoc */
  public beginPath(): void {
    this.consumer.beginPath();
  }

  /** @inheritdoc */
  public moveTo(x: number, y: number): void {
    const transformed = this.applyTransform(x, y);
    this.consumer.moveTo(transformed[0], transformed[1]);
  }

  /** @inheritdoc */
  public lineTo(x: number, y: number): void {
    const transformed = this.applyTransform(x, y);
    this.consumer.lineTo(transformed[0], transformed[1]);
  }

  /** @inheritdoc */
  public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    const cp1Transformed = this.applyTransform(cp1x, cp1y);
    cp1x = cp1Transformed[0];
    cp1y = cp1Transformed[1];

    const cp2Transformed = this.applyTransform(cp2x, cp2y);
    cp2x = cp2Transformed[0];
    cp2y = cp2Transformed[1];

    const endTransformed = this.applyTransform(x, y);
    x = endTransformed[0];
    y = endTransformed[1];

    this.consumer.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  /** @inheritdoc */
  public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    const cpTransformed = this.applyTransform(cpx, cpy);
    cpx = cpTransformed[0];
    cpy = cpTransformed[1];

    const endTransformed = this.applyTransform(x, y);
    x = endTransformed[0];
    y = endTransformed[1];

    this.consumer.quadraticCurveTo(cpx, cpy, x, y);
  }

  /** @inheritdoc */
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void {
    const transformed = this.applyTransform(x, y);

    this.consumer.arc(transformed[0], transformed[1], radius * this.scale, startAngle + this.rotation, endAngle + this.rotation, counterClockwise);
  }

  /** @inheritdoc */
  public closePath(): void {
    this.consumer.closePath();
  }

  /**
   * Updates this stream's cached scale and rotation values from its transformation.
   */
  private updateScaleRotation(): void {
    const params = this.transform.getParameters();
    this.scale = Math.sqrt(params[0] * params[0] + params[3] * params[3]);
    this.rotation = Math.atan2(params[0], params[3]);
  }

  /**
   * Applies this stream's transformation to a point.
   * @param x The x-coordinate of the point to transform.
   * @param y The y-coordinate of the point to transform.
   * @returns The transformed point.
   */
  private applyTransform(x: number, y: number): Float64Array {
    const vec = Vec2Math.set(x, y, AffineTransformPathStream.vec2Cache[0]);
    return this.transform.apply(vec, vec);
  }
}