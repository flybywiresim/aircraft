import { GeoCircleResampler, GeoProjection } from '../../geo';
import { AbstractTransformingPathStream, GeoProjectionPathStream, PathStream, TransformingPathStream, TransformingPathStreamStack } from '../../graphics/path';

/**
 * A stack of {@link TransformingPathStream}s which transforms an input in spherical geographic coordinates to planar
 * projected coordinates. The stack contains two sub-stacks: a pre-projected stack which transforms the path before
 * it is projected, and a post-projected stack which transforms the projected path before it is sent to the consumer.
 * Transforming streams can be added to the top and bottom of each sub-stack. The input will be passed through each
 * stream in the pre-projected stack from top to bottom, then projected, then passed through each stream in the post-
 * projected stack from top to bottom, and the final transformed output will be passed to the consumer.
 */
export class GeoProjectionPathStreamStack extends AbstractTransformingPathStream {
  private readonly projectionStream: GeoProjectionPathStream;
  private readonly preStack: TransformingPathStreamStack;
  private readonly postStack: TransformingPathStreamStack;

  /**
   * Constructor.
   * @param consumer The path stream that consumes this stream's transformed output.
   * @param projection The projection this stream uses.
   * @param minDistance The minimum great-circle distance this stream's resampler enforces between two adjacent
   * resampled points, in great-arc radians.
   * @param dpTolerance The Douglas-Peucker tolerance this stream's resampler uses when deciding whether to discard a
   * resampled point during the line simplification process.
   * @param maxDepth The maximum depth of the resampling algorithm used by this stream's resampler. The number of
   * resampled points is bounded from above by 2^[maxDepth] - 1.
   */
  constructor(consumer: PathStream, projection: GeoProjection, minDistance: number, dpTolerance: number, maxDepth: number);
  /**
   * Constructor.
   * @param consumer The path stream that consumes this stream's transformed output.
   * @param projection The projection this stream uses.
   * @param resampler The geo circle resampler this stream uses.
   */
  constructor(consumer: PathStream, projection: GeoProjection, resampler: GeoCircleResampler);
  // eslint-disable-next-line jsdoc/require-jsdoc
  constructor(consumer: PathStream, projection: GeoProjection, arg1: number | GeoCircleResampler, arg2?: number, arg3?: number) {
    super(consumer);

    this.postStack = new TransformingPathStreamStack(consumer);

    if (arg1 instanceof GeoCircleResampler) {
      this.projectionStream = new GeoProjectionPathStream(this.postStack, projection, arg1);
    } else {
      this.projectionStream = new GeoProjectionPathStream(this.postStack, projection, arg1, arg2 as number, arg3 as number);
    }

    this.preStack = new TransformingPathStreamStack(this.projectionStream);
  }

  /**
   * Gets the projection used by this stream.
   * @returns The projection used by this stream.
   */
  public getProjection(): GeoProjection {
    return this.projectionStream.getProjection();
  }

  /**
   * Sets the projection used by this stream.
   * @param projection A projection.
   */
  public setProjection(projection: GeoProjection): void {
    this.projectionStream.setProjection(projection);
  }

  /**
   * Adds a transforming path stream to the top of the pre-projected stack.
   * @param stream A transforming path stream.
   */
  public pushPreProjected(stream: TransformingPathStream): void {
    this.preStack.push(stream);
  }

  /**
   * Removes the top-most path stream from the pre-projected stack. The removed stream will have its consumer set to
   * {@link NullPathStream.INSTANCE}.
   * @returns The removed path stream, or undefined if this stack was empty.
   */
  public popPreProjected(): TransformingPathStream | undefined {
    return this.preStack.pop();
  }

  /**
   * Adds a transforming path stream to the bottom of the pre-projected stack.
   * @param stream A transforming path stream.
   */
  public unshiftPreProjected(stream: TransformingPathStream): void {
    this.preStack.unshift(stream);
  }

  /**
   * Removes the bottom-most path stream from the pre-projected stack. The removed stream will have its consumer set to
   * {@link NullPathStream.INSTANCE}.
   * @returns The removed path stream, or undefined if this stack was empty.
   */
  public shiftPreProjected(): TransformingPathStream | undefined {
    return this.preStack.shift();
  }

  /**
   * Adds a transforming path stream to the top of the post-projected stack.
   * @param stream A transforming path stream.
   */
  public pushPostProjected(stream: TransformingPathStream): void {
    this.postStack.push(stream);
  }

  /**
   * Removes the top-most path stream from the post-projected stack. The removed stream will have its consumer set to
   * {@link NullPathStream.INSTANCE}.
   * @returns The removed path stream, or undefined if this stack was empty.
   */
  public popPostProjected(): TransformingPathStream | undefined {
    return this.postStack.pop();
  }

  /**
   * Adds a transforming path stream to the bottom of the post-projected stack.
   * @param stream A transforming path stream.
   */
  public unshiftPostProjected(stream: TransformingPathStream): void {
    this.postStack.unshift(stream);
  }

  /**
   * Removes the bottom-most path stream from the post-projected stack. The removed stream will have its consumer set
   * to {@link NullPathStream.INSTANCE}.
   * @returns The removed path stream, or undefined if this stack was empty.
   */
  public shiftPostProjected(): TransformingPathStream | undefined {
    return this.postStack.shift();
  }

  /** @inheritdoc */
  public setConsumer(consumer: PathStream): void {
    this.postStack.setConsumer(consumer);

    super.setConsumer(consumer);
  }

  /** @inheritdoc */
  public beginPath(): void {
    this.preStack.beginPath();
  }

  /** @inheritdoc */
  public moveTo(x: number, y: number): void {
    this.preStack.moveTo(x, y);
  }

  /** @inheritdoc */
  public lineTo(x: number, y: number): void {
    this.preStack.lineTo(x, y);
  }

  /** @inheritdoc */
  public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    this.preStack.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  /** @inheritdoc */
  public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.preStack.quadraticCurveTo(cpx, cpy, x, y);
  }

  /** @inheritdoc */
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void {
    this.preStack.arc(x, y, radius, startAngle, endAngle, counterClockwise);
  }

  /** @inheritdoc */
  public closePath(): void {
    this.preStack.closePath();
  }
}