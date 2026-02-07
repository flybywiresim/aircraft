import { ReadonlyFloat64Array, Vec2Math } from '@microsoft/msfs-sdk';
import { MathUtils } from './MathUtils';

export class Vec2Utils {
  /**
   * Interpolate between two wind vectors
   * @param x the value to interpolate between x0 and x1
   * @param x0 the lower bound of the interpolation
   * @param x1 the upper bound of the interpolation
   * @param v0 wind vector at x0
   * @param v1 wind vector at x1
   * @param out wind vector to write the result to
   * @returns
   */
  static interpolate(
    x: number,
    x0: number,
    x1: number,
    v0: ReadonlyFloat64Array,
    v1: ReadonlyFloat64Array,
    out: Float64Array,
  ): Float64Array {
    return Vec2Math.set(
      MathUtils.interpolate(x, x0, x1, v0[0], v1[0]),
      MathUtils.interpolate(x, x0, x1, v0[1], v1[1]),
      out,
    );
  }
}
