/**
 * Possible types of hold entries
 */
export enum HoldEntryType {
  Direct,
  Teardrop,
  Parallel,
  None,
}

export enum HoldMaxSpeedRule {
  Faa,
  Icao,
}


/**
 * Utilities for hold entries
 */
export class HoldUtils {

  /**
   * Gets a hold direction UI string for a given inbound course.
   *
   * @param course The inbound course to get the string for.
   * @param short Whether to get the string in short form (single letter)
   *
   * @returns A UI human-readable course string.
   */
  public static getDirectionString(course: number, short = false): string {
    if (course >= 0 && course < 22.5) {
      return  short ? 'S' : 'South';
    } else if (course >= 22.5 && course < 67.5) {
      return short ? 'SW' : 'Southwest';
    } else if (course >= 67.5 && course < 112.5) {
      return short ? 'W' : 'West';
    } else if (course >= 112.5 && course < 157.5) {
      return  short ? 'NW' : 'Northwest';
    } else if (course >= 157.5 && course < 202.5) {
      return short ? 'N' : 'North';
    } else if (course >= 202.5 && course < 247.5) {
      return short ? 'NE' : 'Northeast';
    } else if (course >= 247.5 && course < 292.5) {
      return short ?'E' : 'East';
    } else if (course >= 292.5 && course < 337.5) {
      return short ? 'SE' : 'Southeast';
    } else {
      return short ? 'S' : 'South';
    }
  }

  /**
   * Obtains hold speed (number and isMach) depending on altitude and speed rule (ICAO or FAA)
   *
   * @param altitude MSL altitude
   * @param rule     hold speed rule
   *
   * @returns hold speed and whether that number is in Mach
   */
  static getHoldSpeed(altitude: number, rule: HoldMaxSpeedRule): [speed: number, isMach: boolean] {
    switch (rule) {
      case HoldMaxSpeedRule.Faa:
        if (altitude < 6_000) {
          return [200, false];
        } else if (altitude < 14_000) {
          return [230, false];
        } else {
          return [265, false];
        }
      case HoldMaxSpeedRule.Icao:
        if (altitude < 14_000) {
          return [230, false];
        } else if (altitude < 20_000) {
          return [240, false];
        } else if (altitude < 34_000) {
          return [265, false];
        } else {
          return [.83, true];
        }
    }
  }

}
