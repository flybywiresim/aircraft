import { Vec2Math } from '@microsoft/msfs-sdk';
import { WindEntry, WindVector } from '../../../flightplanning/data/wind';
import { MathUtils, Vec2Utils } from '@flybywiresim/fbw-sdk';

export class WindUtils {
  private static readonly VectorCache = Vec2Math.create();

  /**
   *
   * @param entries sorted array of wind entries ordered by altitude (works for both ascending and descending altitudes)
   * @param altitude altitude to interpolate at
   * @param result wind vector to write the result to
   * @returns
   */
  static interpolateWindEntries(entries: WindEntry[], altitude: number, result: WindVector): WindVector {
    if (entries.length === 0) {
      return Vec2Math.set(0, 0, result);
    } else if (entries.length === 1) {
      return Vec2Math.copy(entries[0].vector, result);
    }

    const isDescendingOrder = entries[1].altitude < entries[0].altitude;

    const lowest = isDescendingOrder ? entries[entries.length - 1] : entries[0];
    const highest = isDescendingOrder ? entries[0] : entries[entries.length - 1];

    if (altitude <= lowest.altitude) {
      return Vec2Math.copy(lowest.vector, result);
    } else if (altitude >= highest.altitude) {
      return Vec2Math.copy(highest.vector, result);
    } else {
      for (let i = 0; i < entries.length - 1; i++) {
        const lower = isDescendingOrder ? entries[i + 1] : entries[i];
        const upper = !isDescendingOrder ? entries[i + 1] : entries[i];

        if (lower.altitude <= altitude) {
          return Vec2Utils.interpolate(altitude, lower.altitude, upper.altitude, lower.vector, upper.vector, result);
        }
      }
    }

    return Vec2Math.set(0, 0, result);
  }

  public static computeTailwindComponent(wind: WindVector, trueCourseDegrees: number): number {
    // We need a minus here because the wind vector points in the direction that the wind is coming from,
    // whereas the true track vector points in the direction that the aircraft is going. So if they are pointing in the same direction,
    // the wind is actually a headwind.
    return -Vec2Math.dot(
      wind,
      Vec2Math.setFromPolar(1, trueCourseDegrees * MathUtils.DEGREES_TO_RADIANS, this.VectorCache),
    );
  }
}
