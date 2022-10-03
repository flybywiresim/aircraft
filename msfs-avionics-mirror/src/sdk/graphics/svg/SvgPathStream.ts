import { MathUtils } from '../../math/MathUtils';
import { Vec2Math } from '../../math/VecMath';
import { PathStream } from '../path/PathStream';
import { NumberFormatter } from '../text/NumberFormatter';

/**
 * A path stream which builds SVG path strings from its input path commands.
 */
export class SvgPathStream implements PathStream {
  private static readonly vec2Cache = [new Float64Array(2), new Float64Array(2), new Float64Array(2), new Float64Array(2)];

  private svgPath = '';
  private precision: number;
  private formatter: (val: number) => string;

  private readonly firstPoint = new Float64Array([NaN, NaN]);
  private readonly prevPoint = new Float64Array([NaN, NaN]);

  /**
   * Constructor.
   * @param precision The precision of this stream. All coordinates will be rounded to this stream's precision when
   * building the SVG path string. A value of `0` indicates infinite precision. Defaults to `0`.
   */
  constructor(precision = 0) {
    this.precision = precision;
    this.formatter = NumberFormatter.create({ precision, forceDecimalZeroes: false });
  }

  /**
   * Gets the SVG path string describing all path commands consumed by this stream since the last call to
   * `beginPath()`.
   * @returns The SVG path string describing all path commands consumed by this stream since the last call to
   * `beginPath()`.
   */
  public getSvgPath(): string {
    return this.svgPath.trim();
  }

  /**
   * Gets the precision of this stream. All coordinates will be rounded to this stream's precision when building the
   * SVG path string. A value of `0` indicates infinite precision.
   * @returns The precision of this stream.
   */
  public getPrecision(): number {
    return this.precision;
  }

  /**
   * Sets the precision of this stream. All coordinates will be rounded to this stream's precision when building the
   * SVG path string. A value of `0` indicates infinite precision.
   * @param precision The precision of this stream. Negative numbers will be converted to their absolute values.
   */
  public setPrecision(precision: number): void {
    this.precision = Math.abs(precision);
    this.formatter = NumberFormatter.create({ precision: this.precision, forceDecimalZeroes: false });
  }

  /** @inheritdoc */
  public beginPath(): void {
    this.reset();
  }

  /** @inheritdoc */
  public moveTo(x: number, y: number): void {
    if (!(isFinite(x) && isFinite(y))) {
      return;
    }

    if (isNaN(this.firstPoint[0])) {
      Vec2Math.set(x, y, this.firstPoint);
    }

    this.svgPath += `M ${this.formatter(x)} ${this.formatter(y)} `;
    Vec2Math.set(x, y, this.prevPoint);
  }

  /** @inheritdoc */
  public lineTo(x: number, y: number): void {
    if (!(isFinite(x) && isFinite(y))) {
      return;
    }

    if (isNaN(this.prevPoint[0])) {
      this.moveTo(x, y);
      return;
    }

    this.svgPath += `L ${this.formatter(x)} ${this.formatter(y)} `;
    Vec2Math.set(x, y, this.prevPoint);
  }

  /** @inheritdoc */
  public bezierCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): void {
    if (!(isFinite(x) && isFinite(y) && isFinite(cp1x) && isFinite(cp1y) && isFinite(cp2x) && isFinite(cp2y))) {
      return;
    }

    if (isNaN(this.prevPoint[0])) {
      this.moveTo(x, y);
      return;
    }

    this.svgPath += `C ${this.formatter(cp1x)} ${this.formatter(cp1y)} ${this.formatter(cp2x)} ${this.formatter(cp2y)} ${this.formatter(x)} ${this.formatter(y)} `;
    Vec2Math.set(x, y, this.prevPoint);
  }

  /** @inheritdoc */
  public quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    if (!(isFinite(x) && isFinite(y) && isFinite(cpx) && isFinite(cpy))) {
      return;
    }

    if (isNaN(this.prevPoint[0])) {
      this.moveTo(x, y);
      return;
    }

    this.svgPath += `Q ${this.formatter(cpx)} ${this.formatter(cpy)} ${this.formatter(x)} ${this.formatter(y)} `;
    Vec2Math.set(x, y, this.prevPoint);
  }

  /** @inheritdoc */
  public arc(x: number, y: number, radius: number, startAngle: number, endAngle: number, counterClockwise?: boolean): void {
    if (!(isFinite(x) && isFinite(y) && isFinite(radius) && isFinite(startAngle) && isFinite(endAngle))) {
      return;
    }

    const directionSign = counterClockwise ? -1 : 1;

    if (Math.sign(endAngle - startAngle) !== directionSign) {
      // Replicate behavior of canvas context arc() when the sign of the difference between start and end angles
      // doesn't match the counterClockwise flag.
      const angleDiff = counterClockwise ? MathUtils.diffAngle(endAngle, startAngle) : MathUtils.diffAngle(startAngle, endAngle);
      endAngle = startAngle + angleDiff * directionSign;
    }

    // Clamp to 2pi because we don't need to draw anything past a full circle.
    const angularWidth = Math.min(MathUtils.TWO_PI, (endAngle - startAngle) * directionSign);

    if (angularWidth === MathUtils.TWO_PI) {
      // SVG arc commands cannot draw a full circle, so we need to split the circle into two half circles
      const midAngle = startAngle + Math.PI * directionSign;
      this.arc(x, y, radius, startAngle, midAngle, counterClockwise);
      this.arc(x, y, radius, midAngle, startAngle, counterClockwise);
      return;
    }

    const startPoint = Vec2Math.add(
      Vec2Math.set(x, y, SvgPathStream.vec2Cache[0]),
      Vec2Math.setFromPolar(radius, startAngle, SvgPathStream.vec2Cache[2]),
      SvgPathStream.vec2Cache[0]
    );

    if (isNaN(this.prevPoint[0])) {
      this.moveTo(startPoint[0], startPoint[1]);
    } else if (!Vec2Math.equals(this.prevPoint, startPoint)) {
      this.lineTo(startPoint[0], startPoint[1]);
    }

    const endPoint = Vec2Math.add(
      Vec2Math.set(x, y, SvgPathStream.vec2Cache[1]),
      Vec2Math.setFromPolar(radius, endAngle, SvgPathStream.vec2Cache[2]),
      SvgPathStream.vec2Cache[1]
    );

    const radiusString = this.formatter(radius);
    this.svgPath += `A ${radiusString} ${radiusString} 0 ${angularWidth > Math.PI ? 1 : 0} ${counterClockwise ? 0 : 1} ${this.formatter(endPoint[0])} ${this.formatter(endPoint[1])} `;
    Vec2Math.copy(endPoint, this.prevPoint);
  }

  /** @inheritdoc */
  public closePath(): void {
    if (!isNaN(this.firstPoint[0])) {
      this.lineTo(this.firstPoint[0], this.firstPoint[1]);
    }
  }

  /**
   * Resets the state of this stream.
   */
  private reset(): void {
    Vec2Math.set(NaN, NaN, this.firstPoint);
    Vec2Math.set(NaN, NaN, this.prevPoint);
    this.svgPath = '';
  }
}