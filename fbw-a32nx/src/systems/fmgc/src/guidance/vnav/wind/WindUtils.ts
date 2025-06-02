import { Vec2Math } from '@microsoft/msfs-sdk';
import { WindEntry, WindVector } from '../../../flightplanning/data/wind';
import { Common } from '../common';

export class WindUtils {
  /**
   *
   * @param entries sorted array of wind entries ordered by altitude (descending)
   * @param altitude altitude to interpolate at
   * @param result wind vector to write the result to
   * @returns
   */
  static interpolateWindEntries(entries: WindEntry[], altitude: number, result: WindVector): WindVector {
    if (entries.length === 0) {
      return;
    }

    if (altitude >= entries[0].altitude) {
      return Vec2Math.copy(entries[0].vector, result);
    } else if (altitude <= entries[entries.length - 1].altitude) {
      return Vec2Math.copy(entries[0].vector, result);
    } else {
      for (let i = 0; i < entries.length - 1; i++) {
        const lower = entries[i + 1];

        if (lower.altitude <= altitude) {
          const upper = entries[i];

          return this.interpolateVectors(altitude, lower.altitude, upper.altitude, lower.vector, upper.vector, result);
        }
      }
    }
  }

  /**
   * Interpolate between two wind vectors
   * @param x the value to interpolate between x0 and x1
   * @param x0 the lower bound of the interpolation
   * @param x1 the upper bound of the interpolation
   * @param v0 wind vector at x0
   * @param v1 wind vector at x1
   * @param result wind vector to write the result to
   * @returns
   */
  static interpolateVectors(
    x: number,
    x0: number,
    x1: number,
    v0: WindVector,
    v1: WindVector,
    result: WindVector,
  ): WindVector {
    return Vec2Math.set(
      Common.interpolate(x, x0, x1, v0[0], v1[0]),
      Common.interpolate(x, x0, x1, v0[1], v1[1]),
      result,
    );
  }
}
