import { Vec2Math } from '@microsoft/msfs-sdk';
import { WindEntry, WindVector } from '../../../flightplanning/data/wind';
import { Vec2Utils } from '@flybywiresim/fbw-sdk';

export class WindUtils {
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
    }

    if (altitude >= Math.max(entries[0].altitude, entries[entries.length - 1].altitude)) {
      return Vec2Math.copy(entries[0].vector, result);
    } else if (altitude <= Math.min(entries[0].altitude, entries[entries.length - 1].altitude)) {
      return Vec2Math.copy(entries[0].vector, result);
    } else {
      for (let i = 0; i < entries.length - 1; i++) {
        const lower = entries[i + 1].altitude < entries[i].altitude ? entries[i + 1] : entries[i];
        const upper = entries[i + 1].altitude > entries[i].altitude ? entries[i + 1] : entries[i];

        if (lower.altitude <= altitude) {
          return Vec2Utils.interpolate(altitude, lower.altitude, upper.altitude, lower.vector, upper.vector, result);
        }
      }
    }

    return Vec2Math.set(0, 0, result);
  }
}
