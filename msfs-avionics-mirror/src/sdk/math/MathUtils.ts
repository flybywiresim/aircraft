/**
 * A utitlity class for basic math.
 */
export class MathUtils {
  /** Twice the value of pi. */
  public static readonly TWO_PI = Math.PI * 2;

  /** Half the value of pi. */
  public static readonly HALF_PI = Math.PI / 2;

  /**
   * Clamps a numerical value to the min/max range.
   * @param value The value to be clamped.
   * @param min The minimum.
   * @param max The maximum.
   *
   * @returns The clamped numerical value..
   */
  public static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Rounds a number.
   * @param value The number to round.
   * @param precision The precision with which to round. Defaults to `1`.
   * @returns The rounded number.
   */
  public static round(value: number, precision = 1): number {
    return Math.round(value / precision) * precision;
  }

  /**
   * Calculates the angular difference between two angles in the range `[0, 2 * pi)`. The calculation supports both
   * directional and non-directional differences. The directional difference is the angle swept from the start angle
   * to the end angle proceeding in the direction of increasing angle. The non-directional difference is the smaller
   * of the two angles swept from the start angle to the end angle proceeding in either direction.
   * @param start The starting angle, in radians.
   * @param end The ending angle, in radians.
   * @param directional Whether to calculate the directional difference. Defaults to `true`.
   * @returns The angular difference between the two angles, in radians, in the range `[0, 2 * pi)`.
   */
  public static diffAngle(start: number, end: number, directional = true): number {
    const diff = ((end - start) % MathUtils.TWO_PI + MathUtils.TWO_PI) % MathUtils.TWO_PI;
    return directional ? diff : Math.min(diff, MathUtils.TWO_PI - diff);
  }

  /**
   * Linearly interpolates a keyed value along one dimension.
   * @param x The key of the value to interpolate.
   * @param x0 The key of the first known value.
   * @param x1 The key of the second known value.
   * @param y0 The first known value.
   * @param y1 The second known value.
   * @param clampStart Whether to clamp the interpolated value to the first known value. Defaults to false.
   * @param clampEnd Whether to clamp the interpolated value to the second known value. Defaults to false.
   * @returns The interpolated value corresponding to the specified key.
   */
  public static lerp(x: number, x0: number, x1: number, y0: number, y1: number, clampStart = false, clampEnd = false): number {
    if (x0 !== x1 && y0 !== y1) {
      const fraction = MathUtils.clamp((x - x0) / (x1 - x0), clampStart ? 0 : -Infinity, clampEnd ? 1 : Infinity);
      return fraction * (y1 - y0) + y0;
    } else {
      return y0;
    }
  }
}