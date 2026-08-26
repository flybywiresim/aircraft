// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { copyWindVector, WindEntry, WindVector } from '../../../flightplanning/data/wind';
import { MathUtils } from '@flybywiresim/fbw-sdk';

export class WindUtils {
  private static readonly VectorCache = { direction: 0, magnitude: 0 };

  public static undefinedWindVector: WindVector = { direction: undefined, magnitude: undefined };

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
      return copyWindVector(entries[0].vector, result);
    }

    const isDescendingOrder = (entries[1].altitude ?? 0) < (entries[0].altitude ?? 0);

    const lowest = isDescendingOrder ? entries[entries.length - 1] : entries[0];
    const highest = isDescendingOrder ? entries[0] : entries[entries.length - 1];

    if (lowest.altitude !== undefined && altitude <= lowest.altitude) {
      return copyWindVector(lowest.vector, result);
    } else if (highest.altitude !== undefined && altitude >= highest.altitude) {
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
            altitude,
            lower.altitude,
            upper.altitude,
            lower.vector,
            upper.vector,
            result,
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
    return -WindUtils.dot(wind, this.setPolar(1, trueCourseDegrees * MathUtils.DEGREES_TO_RADIANS, this.VectorCache));
  }

  public static interpolateWindVector(
    x: number,
    x0: number,
    x1: number,
    v0: WindVector,
    v1: WindVector,
    out: WindVector,
  ): WindVector {
    return copyWindVector(
      {
        direction:
          v0.direction === undefined || v1.direction === undefined
            ? undefined
            : MathUtils.interpolate(x, x0, x1, v0.direction, v1.direction),
        magnitude:
          v0.magnitude === undefined || v1.magnitude === undefined
            ? undefined
            : MathUtils.interpolate(x, x0, x1, v0.magnitude, v1.magnitude),
      },
      out,
    );
  }
  /**
   * Sets the polar components of a wind vector.
   * @param r - the new length (magnitude).
   * @param theta - the new polar angle theta, in radians.
   * @param vector - the wind vector to change.
   * @returns the wind vector after it has been changed.
   */
  public static setPolar(r: number, theta: number, vector: WindVector) {
    vector.direction = r * Math.cos(theta);
    vector.magnitude = r * Math.sin(theta);
    return vector;
  }

  public static copyEmptyWindVector(result: WindVector) {
    return copyWindVector(WindUtils.emptyWindVector, result);
  }

  /**
   * Gets the dot product of two wind vectors.
   * @param v1 The first wind vector.
   * @param v2 The second wind vector.
   * @returns The dot product of the vectors.
   */
  public static dot(first: WindVector, second: WindVector): number {
    return (first.direction ?? 0) * (second.direction ?? 0) + (first.magnitude ?? 0) * (second.magnitude ?? 0);
  }
}
