import { AbstractTransformingPathStream, NullPathStream, PathStream, TransformingPathStream } from './PathStream';

/**
 * A stack of {@link TransformingPathStream}s. Inputs are passed through the entire stack from top to bottom before the
 * final transformed output is sent to a consuming stream.
 */
export class TransformingPathStreamStack extends AbstractTransformingPathStream {
  private readonly stack: TransformingPathStream[] = [];

  /**
   * Adds a transforming path stream to the top of this stack.
   * @param stream A transforming path stream.
   */
  public push(stream: TransformingPathStream): void {
    stream.setConsumer(this.stack[this.stack.length - 1] ?? this.consumer);
    this.stack.push(stream);
  }

  /**
   * Removes the top-most path stream from this stack. The removed stream will have its consumer set to
   * {@link NullPathStream.INSTANCE}.
   * @returns The removed path stream, or undefined if this stack was empty.
   */
  public pop(): TransformingPathStream | undefined {
    const removed = this.stack.pop();
    removed?.setConsumer(NullPathStream.INSTANCE);
    return removed;
  }

  /**
   * Adds a transforming path stream to the bottom of this stack.
   * @param stream A transforming path stream.
   */
  public unshift(stream: TransformingPathStream): void {
    const displaced = this.stack[0];
    displaced?.setConsumer(stream);
    stream.setConsumer(this.consumer);
    this.stack.unshift(stream);
  }

  /**
   * Removes the bottom-most path stream from this stack. The removed stream will have its consumer set to
   * {@link NullPathStream.INSTANCE}.
   * @returns The removed path stream, or undefined if this stack was empty.
   */
  public shift(): TransformingPathStream | undefined {
    const removed = this.stack.shift();
    removed?.setConsumer(NullPathStream.INSTANCE);
    this.stack[0]?.setConsumer(this.consumer);
    return removed;
  }

  /** @inheritdoc */
  public setConsumer(consumer: PathStream): void {
    this.stack[0]?.setConsumer(consumer);

    super.setConsumer(consumer);
  }

  /** @inheritdoc */
  public beginPath(): void {
    (this.stack[this.stack.length - 1] ?? this.consumer).beginPath();
  }

  /** @inheritdoc */
  public moveTo(x: number, y: number): void {
    (this.stack[this.stack.length - 1] ?? this.consumer).moveTo(x, y);
  }

  /** @inheritdoc */
  public lineTo(x: number, y: number): void {
    (this.stack[this.stack.length - 1] ?? this.consumer).lineTo(x, y);
  }

  /** @inheritdoc */
  public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    (this.stack[this.stack.length - 1] ?? this.consumer).bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  /** @inheritdoc */
  public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    (this.stack[this.stack.length - 1] ?? this.consumer).quadraticCurveTo(cpx, cpy, x, y);
  }

  /** @inheritdoc */
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void {
    (this.stack[this.stack.length - 1] ?? this.consumer).arc(x, y, radius, startAngle, endAngle, counterClockwise);
  }

  /** @inheritdoc */
  public closePath(): void {
    this.stack[this.stack.length - 1].closePath();
  }
}