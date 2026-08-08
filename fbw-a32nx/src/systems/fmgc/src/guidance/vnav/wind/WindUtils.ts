import { Vec2Math } from '@microsoft/msfs-sdk';
import { copyWindVector, cloneWindVector, WindEntry, WindVector } from '../../../flightplanning/data/wind';
import { MathUtils } from '@flybywiresim/fbw-sdk';

export class WindUtils {
  private static readonly VectorCache = Vec2Math.create();

  private static readonly emptyWindVector: WindVector = { direction: 0, magnitude: 0 };

  /**
   *
   * @param entries sorted array of wind entries ordered by altitude (works for both ascending and descending altitudes)
   * @param altitude altitude to interpolate at
   * @param result wind vector to write the result to
   * @returns
   */
  static interpolateWindEntries(entries: WindEntry[], altitude: number, result: WindVector): WindVector {
    if (entries.length === 0) {
      return this.copyEmptyWindVector(result);
    } else if (entries.length === 1) {
      return cloneWindVector(entries[0].vector);
    }

    const isDescendingOrder = (entries[1].altitude ?? 0) < (entries[0].altitude ?? 0);

    const lowest = isDescendingOrder ? entries[entries.length - 1] : entries[0];
    const highest = isDescendingOrder ? entries[0] : entries[entries.length - 1];

    if (lowest.vector !== undefined && lowest.altitude !== undefined && altitude <= lowest.altitude) {
      return copyWindVector(lowest.vector, result);
    } else if (highest.vector !== undefined && highest.altitude !== undefined && altitude >= highest.altitude) {
      return copyWindVector(highest.vector, result);
    } else {
      for (let i = 0; i < entries.length - 1; i++) {
        const lower = isDescendingOrder ? entries[i + 1] : entries[i];
        const upper = !isDescendingOrder ? entries[i + 1] : entries[i];

        if (
          lower.altitude !== undefined &&
          lower.altitude <= altitude &&
          upper.altitude !== undefined &&
          altitude <= upper.altitude
        ) {
          return WindUtils.interpolateWindVector(
            result,
            altitude,
            lower.altitude,
            upper.altitude,
            lower.vector,
            upper.vector,
          );
        }
      }
    }

    return this.copyEmptyWindVector(result);
  }

  public static computeTailwindComponent(wind: WindVector, trueCourseDegrees: number): number {
    // We need a minus here because the wind vector points in the direction that the wind is coming from,
    // whereas the true track vector points in the direction that the aircraft is going. So if they are pointing in the same direction,
    // the wind is actually a headwind.
    return wind.direction !== undefined && wind.magnitude !== undefined
      ? -Vec2Math.dot(
          Vec2Math.setFromPolar(wind.magnitude, wind.direction, Vec2Math.create()),
          Vec2Math.setFromPolar(1, trueCourseDegrees * MathUtils.DEGREES_TO_RADIANS, this.VectorCache),
        )
      : 0;
  }

  public static interpolateWindVector(
    result: WindVector,
    value: number,
    lowerValue: number,
    higherValue: number,
    first: WindVector,
    second: WindVector,
  ): WindVector {
    return copyWindVector(
      {
        direction:
          first.direction === undefined || second.direction === undefined
            ? undefined
            : MathUtils.interpolate(value, lowerValue, higherValue, first.direction, first.direction),
        magnitude:
          first.magnitude === undefined || second.magnitude === undefined
            ? undefined
            : MathUtils.interpolate(value, lowerValue, higherValue, first.magnitude, second.magnitude),
      },
      result,
    );
  }
  /**
   * Sets the polar components of a vector.
   * @param r - the new length (magnitude).
   * @param theta - the new polar angle theta, in radians.
   * @param vector - the vector to change.
   * @returns the vector after it has been changed.
   */
  public static setPolar(r: number, theta: number, vector: WindVector) {
    vector.direction = r * Math.cos(theta);
    vector.magnitude = r * Math.sin(theta);
    return vector;
  }

  public static copyEmptyWindVector(result: WindVector) {
    return copyWindVector(WindUtils.emptyWindVector, result);
  }
}
