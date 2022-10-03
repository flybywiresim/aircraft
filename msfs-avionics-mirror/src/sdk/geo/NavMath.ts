import { UnitType } from '../math/NumberUnit';
import { GeoCircle } from './GeoCircle';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint } from './GeoPoint';

/**
 * Navigational mathematics functions.
 */
export class NavMath {
  private static readonly vec3Cache = [new Float64Array(3)];
  private static readonly geoPointCache = [new GeoPoint(0, 0), new GeoPoint(0, 0)];
  private static readonly geoCircleCache = [new GeoCircle(new Float64Array(3), 0)];

  /**
   * Clamps a value to a min and max.
   * @param val The value to clamp.
   * @param min The minimum value to clamp to.
   * @param max The maximum value to clamp to.
   * @returns The clamped value.
   */
  public static clamp(val: number, min: number, max: number): number {
    return Math.min(Math.max(val, min), max);
  }

  /**
   * Normalizes a heading to a 0-360 range.
   * @param heading The heading to normalize.
   * @returns The normalized heading.
   */
  public static normalizeHeading(heading: number): number {
    if (isFinite(heading)) {
      return (heading % 360 + 360) % 360;
    } else {
      console.error(`normalizeHeading: Invalid heading: ${heading}`);
      return NaN;
    }
  }

  /**
   * Gets the turn radius for a given true airspeed.
   * @param airspeedTrue The true airspeed of the plane.
   * @param bankAngle The bank angle of the plane, in degrees.
   * @returns The airplane turn radius.
   */
  public static turnRadius(airspeedTrue: number, bankAngle: number): number {
    return (Math.pow(airspeedTrue, 2) / (11.26 * Math.tan(bankAngle * Avionics.Utils.DEG2RAD)))
      / 3.2808399;
  }

  /**
   * Gets the required bank angle for a given true airspeed and turn radius.
   * @param airspeedTrue The true airspeed of the plane.
   * @param radius The airplane turn radius.
   * @returns The required bank angle, in degrees.
   */
  public static bankAngle(airspeedTrue: number, radius: number): number {
    const airspeedMS = airspeedTrue * 0.51444444;
    return Math.atan(Math.pow(airspeedMS, 2) / (radius * 9.80665)) * Avionics.Utils.RAD2DEG;
  }

  /**
   * Get the turn direction for a given course change.
   * @param startCourse The start course.
   * @param endCourse The end course.
   * @returns The turn direction for the course change.
   */
  public static getTurnDirection(startCourse: number, endCourse: number): 'left' | 'right' {
    return NavMath.normalizeHeading(endCourse - startCourse) > 180 ? 'left' : 'right';
  }

  /**
   * Converts polar radians to degrees north.
   * @param radians The radians to convert.
   * @returns The angle, in degrees north.
   */
  public static polarToDegreesNorth(radians: number): number {
    return NavMath.normalizeHeading((180 / Math.PI) * (Math.PI / 2 - radians));
  }

  /**
   * Converts degrees north to polar radians.
   * @param degrees The degrees to convert.
   * @returns The angle radians, in polar.
   */
  public static degreesNorthToPolar(degrees: number): number {
    return NavMath.normalizeHeading(degrees - 90) / (180 / Math.PI);
  }

  /**
   * Calculates the distance along an arc on Earth's surface. The arc begins at the intersection of the great circle
   * passing through the center of a circle of radius `radius` meters in the direction of 'startBearing', and ends at
   * the intersection of the great circle passing through the center of the circle in the direction of 'endBearing',
   * proceeding clockwise (as viewed from above).
   * @param startBearing The degrees of the start of the arc.
   * @param endBearing The degrees of the end of the arc.
   * @param radius The radius of the arc, in meters.
   * @returns The arc distance.
   */
  public static calculateArcDistance(startBearing: number, endBearing: number, radius: number): number {
    const angularWidth = ((endBearing - startBearing + 360) % 360) * Avionics.Utils.DEG2RAD;
    const conversion = UnitType.GA_RADIAN.convertTo(1, UnitType.METER);
    return angularWidth * Math.sin(radius / conversion) * conversion;
  }

  /**
   * Calculates the intersection of a line and a circle.
   * @param x1 The start x of the line.
   * @param y1 The start y of the line.
   * @param x2 The end x of the line.
   * @param y2 The end y of the line.
   * @param cx The circle center x.
   * @param cy The circle center y.
   * @param r The radius of the circle.
   * @param sRef The reference to the solution object to write the solution to.
   * @returns The number of solutions (0, 1 or 2).
   */
  public static circleIntersection(x1: number, y1: number, x2: number, y2: number,
    cx: number, cy: number, r: number, sRef: CircleIntersection): 0 | 1 | 2 {

    const dx = x2 - x1;
    const dy = y2 - y1;

    const a = dx * dx + dy * dy;
    const b = 2 * (dx * (x1 - cx) + dy * (y1 - cy));
    const c = (x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy) - r * r;

    const det = b * b - 4 * a * c;
    if (a < 0.0000001 || det < 0) {
      sRef.x1 = NaN;
      sRef.x2 = NaN;
      sRef.y1 = NaN;
      sRef.y2 = NaN;

      return 0;
    } else if (det == 0) {
      const t = -b / (2 * a);
      sRef.x1 = x1 + t * dx;
      sRef.y1 = y1 + t * dy;

      sRef.x2 = NaN;
      sRef.y2 = NaN;

      return 1;
    } else {
      const t1 = ((-b + Math.sqrt(det)) / (2 * a));
      sRef.x1 = x1 + t1 * dx;
      sRef.y1 = y1 + t1 * dy;

      const t2 = ((-b - Math.sqrt(det)) / (2 * a));
      sRef.x2 = x1 + t2 * dx;
      sRef.y2 = y1 + t2 * dy;

      return 2;
    }
  }

  /**
   * Gets the degrees north that a point lies on a circle.
   * @param cx The x point of the center of the circle.
   * @param cy The y point of the center of the circle.
   * @param x The x point to get the bearing for.
   * @param y The y point to get the bearing for.
   * @returns The angle in degrees north that the point is relative to the center.
   */
  public static northAngle(cx: number, cy: number, x: number, y: number): number {
    return NavMath.polarToDegreesNorth(Math.atan2(y - cy, x - cx));
  }

  /**
   * Checks if a degrees north bearing is between two other degrees north bearings.
   * @param bearing The bearing in degrees north to check.
   * @param start The start bearing in degrees north.
   * @param end The end bearing, in degrees north.
   * @returns True if the bearing is between the two provided bearings, false otherwise.
   */
  public static bearingIsBetween(bearing: number, start: number, end: number): boolean {
    const range = this.normalizeHeading(end - start);
    const relativeBearing = this.normalizeHeading(bearing - start);

    return relativeBearing >= 0 && relativeBearing <= range;
  }

  /**
   * Converts a degrees north heading to a degrees north turn circle angle.
   * @param heading The heading to convert.
   * @param turnDirection The direction of the turn.
   * @returns A degrees north turn circle angle.
   */
  public static headingToAngle(heading: number, turnDirection: 'left' | 'right'): number {
    return NavMath.normalizeHeading(heading + (turnDirection === 'left' ? 90 : -90));
  }

  /**
   * Converts a degrees north turn circle angle to a degrees north heading.
   * @param angle The turn circle angle to convert.
   * @param turnDirection The direction of the turn.
   * @returns A degrees north heading.
   */
  public static angleToHeading(angle: number, turnDirection: 'left' | 'right'): number {
    return NavMath.normalizeHeading(angle + (turnDirection === 'left' ? -90 : 90));
  }

  /**
   * Calculates the wind correction angle.
   * @param course The current plane true course.
   * @param airspeedTrue The current plane true airspeed.
   * @param windDirection The direction of the wind, in degrees true.
   * @param windSpeed The current speed of the wind.
   * @returns The calculated wind correction angle.
   */
  static windCorrectionAngle(course: number, airspeedTrue: number, windDirection: number, windSpeed: number): number {
    const currCrosswind = windSpeed * (Math.sin((course * Math.PI / 180) - (windDirection * Math.PI / 180)));
    const windCorrection = 180 * Math.asin(currCrosswind / airspeedTrue) / Math.PI;

    return windCorrection;
  }

  /**
   * Calculates the cross track deviation from the provided leg fixes.
   * @param start The location of the starting fix of the leg.
   * @param end The location of the ending fix of the leg.
   * @param pos The current plane location coordinates.
   * @returns The amount of cross track deviation, in nautical miles.
   */
  static crossTrack(start: LatLonInterface, end: LatLonInterface, pos: LatLonInterface): number {
    const path = NavMath.geoCircleCache[0].setAsGreatCircle(start, end);

    if (isNaN(path.center[0])) {
      return NaN;
    }

    return UnitType.GA_RADIAN.convertTo(path.distance(pos), UnitType.NMILE);
  }

  /**
   * Calculates the along-track distance from a starting point to another point along a great-circle track running
   * through the starting point.
   * @param start The start of the great-circle track.
   * @param end The end of the great-circle track.
   * @param pos The point for which to calculate the along-track distance.
   * @returns The along-track distance, in nautical miles.
   */
  public static alongTrack(start: LatLonInterface, end: LatLonInterface, pos: LatLonInterface): number {
    const path = NavMath.geoCircleCache[0].setAsGreatCircle(start, end);

    if (isNaN(path.center[0])) {
      return NaN;
    }

    const distance = path.distanceAlong(start, path.closest(pos, NavMath.vec3Cache[0]));
    return UnitType.GA_RADIAN.convertTo((distance + Math.PI) % (2 * Math.PI) - Math.PI, UnitType.NMILE);
  }

  /**
   * Calculates the desired track from the provided leg fixes.
   * @param start The location of the starting fix of the leg.
   * @param end The location of the ending fix of the leg.
   * @param pos The current plane location coordinates.
   * @returns The desired track, in degrees true.
   */
  static desiredTrack(start: LatLonInterface, end: LatLonInterface, pos: LatLonInterface): number {
    const path = NavMath.geoCircleCache[0].setAsGreatCircle(start, end);

    if (isNaN(path.center[0])) {
      return NaN;
    }

    return path.bearingAt(path.closest(pos, NavMath.vec3Cache[0]));
  }

  /**
   * Gets the desired track for a given arc.
   * @param center The center of the arc.
   * @param turnDirection The direction of the turn.
   * @param pos The current plane position.
   * @returns The desired track.
   */
  static desiredTrackArc(center: LatLonInterface, turnDirection: 'left' | 'right', pos: LatLonInterface): number {
    const northAngle = NavMath.geoPointCache[0].set(pos).bearingFrom(center);
    //TODO: Clamp the arc angle to the start and end angles
    return NavMath.angleToHeading(northAngle, turnDirection);
  }

  /**
   * Gets the percentage along the arc path that the plane currently is.
   * @param start The start of the arc, in degrees north.
   * @param end The end of the arc, in degrees north.
   * @param center The center location of the arc.
   * @param turnDirection The direction of the turn.
   * @param pos The current plane position.
   * @returns The percentage along the arc the plane is.
   */
  static percentAlongTrackArc(start: number, end: number, center: LatLonInterface, turnDirection: 'left' | 'right', pos: LatLonInterface): number {
    const bearingFromCenter = NavMath.geoPointCache[0].set(center).bearingTo(pos);

    const sign = turnDirection === 'right' ? 1 : -1;
    const alpha = ((end - start) * sign + 360) % 360;
    const mid = (start + alpha / 2 * sign + 360) % 360;
    const rotBearing = ((bearingFromCenter - mid) + 540) % 360 - 180;
    const frac = rotBearing * sign / alpha + 0.5;

    return frac;
  }

  /**
   * Gets a position given an arc and a distance from the arc start.
   * @param start The start bearing of the arc.
   * @param center The center of the arc.
   * @param radius The radius of the arc.
   * @param turnDirection The turn direction for the arc.
   * @param distance The distance along the arc to get the position for.
   * @param out The position to write to.
   * @returns The position along the arc that was written to.
   */
  public static positionAlongArc(start: number, center: GeoPoint, radius: number, turnDirection: 'left' | 'right', distance: number, out: GeoPoint): GeoPoint {
    const convertedRadius = UnitType.GA_RADIAN.convertTo(Math.sin(UnitType.METER.convertTo(radius, UnitType.GA_RADIAN)), UnitType.METER);
    const theta = UnitType.RADIAN.convertTo(distance / convertedRadius, UnitType.DEGREE);

    const bearing = turnDirection === 'right' ? start + theta : start - theta;
    center.offset(NavMath.normalizeHeading(bearing), UnitType.METER.convertTo(radius, UnitType.GA_RADIAN), out);

    return out;
  }

  /**
   * Gets the cross track distance for a given arc.
   * @param center The center of the arc.
   * @param radius The radius of the arc, in meters.
   * @param pos The current plane position.
   * @returns The cross track distance, in NM.
   */
  static crossTrackArc(center: LatLonInterface, radius: number, pos: LatLonInterface): number {
    return UnitType.METER.convertTo(radius, UnitType.NMILE) - UnitType.GA_RADIAN.convertTo(NavMath.geoPointCache[0].set(pos).distance(center), UnitType.NMILE);
  }

  /**
   * Gets the total difference in degrees between two angles.
   * @param a The first angle.
   * @param b The second angle.
   * @returns The difference between the two angles, in degrees.
   */
  public static diffAngle(a: number, b: number): number {
    let diff = b - a;
    while (diff > 180) {
      diff -= 360;
    }
    while (diff <= - 180) {
      diff += 360;
    }
    return diff;
  }

  /**
   * Finds side a given sides b, c, and angles beta, gamma.
   * @param b The length of side b, as a trigonometric ratio.
   * @param c The length of side c, as a trigonometric ratio.
   * @param beta The angle, in radians, of the opposite of side b.
   * @param gamma The angle, in radians, of the opposite of side c
   * @returns The length of side a, as a trigonometric ratio.
   */
  public static napierSide(b: number, c: number, beta: number, gamma: number): number {
    return 2 * Math.atan(Math.tan(0.5 * (b - c))
      * (Math.sin(0.5 * (beta + gamma)) / Math.sin(0.5 * (beta - gamma))));
  }

  /**
   * Calculates a normal vector to a provided course in degrees north.
   * @param course The course in degrees north.
   * @param turnDirection The direction of the turn to orient the normal.
   * @param outVector The normal vector for the provided course.
   */
  public static normal(course: number, turnDirection: 'left' | 'right', outVector: Float64Array): void {
    const normalCourse = NavMath.headingToAngle(course, turnDirection);
    const polarCourse = NavMath.degreesNorthToPolar(normalCourse);

    outVector[0] = Math.cos(polarCourse);
    outVector[1] = Math.sin(polarCourse);
  }
}

/**
 * A circle intersection solution.
 */
export interface CircleIntersection {

  /** The x coordinate of the first solution point. */
  x1: number;

  /** The y coordinate of the first solution point. */
  y1: number

  /** The x coordinate of the second solution point. */
  x2: number

  /** The y coordinate of the second solution point. */
  y2: number
}

/**
 * A representation of a vector.
 */
export interface Vector {
  /** The x component of the vector. */
  x: number,

  /** The y component of the vector. */
  y: number
}