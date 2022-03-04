import { Vec3Math } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint } from './GeoPoint';

/**
 * A circle on Earth's surface, defined as the set of points on the Earth's surface equidistant (as measured
 * geodetically) from a central point.
 */
export class GeoCircle {
  public static readonly ANGULAR_TOLERANCE = 1e-7; // ~61cm

  private static readonly NORTH_POLE = new Float64Array([0, 0, 1]);

  private static readonly tempGeoPoint = new GeoPoint(0, 0);
  private static readonly vec3Cache = [new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3), new Float64Array(3)];
  private static readonly intersectionCache = [new Float64Array(3), new Float64Array(3)];

  private _center = new Float64Array(3);
  private _radius = 0;

  /**
   * Constructor.
   * @param center The center of the new small circle, represented as a position vector in the standard geographic
   * cartesian reference system.
   * @param radius The radius of the new small circle in great-arc radians.
   */
  constructor(center: Float64Array, radius: number) {
    this.set(center, radius);
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * The center of this circle.
   */
  public get center(): Float64Array {
    return this._center;
  }

  // eslint-disable-next-line jsdoc/require-returns
  /**
   * The radius of this circle, in great-arc radians.
   */
  public get radius(): number {
    return this._radius;
  }

  /**
   * Checks whether this circle is a great circle, or equivalently, whether its radius is equal to pi / 2 great-arc
   * radians.
   * @returns Whether this circle is a great circle.
   */
  public isGreatCircle(): boolean {
    return this._radius === Math.PI / 2;
  }

  /**
   * Calculates the length of an arc along this circle subtended by a central angle.
   * @param angle A central angle, in radians.
   * @returns the length of the arc subtended by the angle, in great-arc radians.
   */
  public arcLength(angle: number): number {
    return Math.sin(this._radius) * angle;
  }

  /**
   * Sets the center and radius of this circle.
   * @param center The new center.
   * @param radius The new radius in great-arc radians.
   * @returns this circle, after it has been changed.
   */
  public set(center: Float64Array | LatLonInterface, radius: number): this {
    if (center instanceof Float64Array) {
      if (Vec3Math.abs(center) === 0) {
        // if center has no direction, arbitrarily set the center to 0 N, 0 E.
        Vec3Math.set(1, 0, 0, this._center);
      } else {
        Vec3Math.normalize(center, this._center);
      }
    } else {
      GeoPoint.sphericalToCartesian(center, this._center);
    }

    this._radius = Math.abs(radius) % Math.PI;

    return this;
  }

  /**
   * Sets this circle to be a great circle which contains two given points. There are two possible great circles that
   * contain any two unique points; these circles differ only by their directionality (equivalently, the sign of their
   * normal vectors). The order of points passed to this method and the right-hand rule determines which of the two is
   * returned.
   * @param point1 The first point that lies on the great circle.
   * @param point2 The second point that lies on the great circle.
   * @returns this circle, after it has been changed.
   */
  public setAsGreatCircle(point1: Float64Array | LatLonInterface, point2: Float64Array | LatLonInterface): this;
  /**
   * Sets this circle to be a great circle defined by a point and bearing offset, equivalent to the path projected from
   * the point with the specified initial bearing (forward azimuth).
   * @param point A point that lies on the great circle.
   * @param bearing The initial bearing from the point.
   * @returns this circle, after it has been changed.
   */
  public setAsGreatCircle(point: Float64Array | LatLonInterface, bearing: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public setAsGreatCircle(arg1: Float64Array | LatLonInterface, arg2: Float64Array | LatLonInterface | number): this {
    this.set(GeoCircle._getGreatCircleNormal(arg1, arg2, GeoCircle.vec3Cache[0]), Math.PI / 2);
    return this;
  }

  /**
   * Gets the distance from a point to the center of this circle, in great-arc radians.
   * @param point The point to which to measure the distance.
   * @returns the distance from the point to the center of this circle.
   */
  protected distanceToCenter(point: Float64Array | LatLonInterface): number {
    if (point instanceof Float64Array) {
      point = Vec3Math.normalize(point, GeoCircle.vec3Cache[0]);
    } else {
      point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[0]);
    }

    const dot = Vec3Math.dot(point, this._center);
    return Math.acos(Utils.Clamp(dot, -1, 1));
  }

  /**
   * Finds the closest point on this circle to a specified point. In other words, projects the specified point onto
   * this circle. If the specified point is equidistant from all points on this circle (i.e. it is coincident with or
   * antipodal to this circle's center), NaN will be written to all fields of the result.
   * @param point A point, represented as either a position vector or lat/long coordinates.
   * @param out A Float64Array object to which to write the result.
   * @returns The closest point on this circle to the specified point.
   */
  public closest(point: Float64Array | LatLonInterface, out: Float64Array): Float64Array;
  /**
   * Finds the closest point on this circle to a specified point. In other words, projects the specified point onto
   * this circle. If the specified point is equidistant from all points on this circle (i.e. it is coincident with or
   * antipodal to this circle's center), NaN will be written to all fields of the result.
   * @param point A point, represented as either a position vector or lat/long coordinates.
   * @param out A GeoPoint object to which to write the result.
   * @returns The closest point on this circle to the specified point.
   */
  public closest(point: Float64Array | LatLonInterface, out: GeoPoint): GeoPoint;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public closest(point: Float64Array | LatLonInterface, out: Float64Array | GeoPoint): Float64Array | GeoPoint {
    if (!(point instanceof Float64Array)) {
      point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[0]);
    }

    const offset = Vec3Math.multScalar(this._center, Math.cos(this._radius), GeoCircle.vec3Cache[1]);
    const dot = Vec3Math.dot(Vec3Math.sub(point, offset, GeoCircle.vec3Cache[2]), this._center);
    const planeProjected = Vec3Math.sub(point, Vec3Math.multScalar(this._center, dot, GeoCircle.vec3Cache[2]), GeoCircle.vec3Cache[2]);
    if (Vec3Math.dot(planeProjected, planeProjected) === 0 || Math.abs(Vec3Math.dot(planeProjected, this._center)) === 1) {
      // the point is equidistant from all points on this circle
      return out instanceof GeoPoint ? out.set(NaN, NaN) : Vec3Math.set(NaN, NaN, NaN, out);
    }

    const displacement = Vec3Math.multScalar(
      Vec3Math.normalize(
        Vec3Math.sub(planeProjected, offset, GeoCircle.vec3Cache[2]),
        GeoCircle.vec3Cache[2]
      ), Math.sin(this._radius), GeoCircle.vec3Cache[2]
    );
    const closest = Vec3Math.add(offset, displacement, GeoCircle.vec3Cache[2]);

    return out instanceof Float64Array ? Vec3Math.normalize(closest, out) : out.setFromCartesian(closest);
  }

  /**
   * Calculates and returns the great-circle distance from a specified point to the closest point that lies on this
   * circle. In other words, calculates the shortest distance from a point to this circle. The distance is signed, with
   * positive distances representing deviation away from the center of the circle, and negative distances representing
   * deviation toward the center of the circle.
   * @param point A point, represented as either a position vector or lat/long coordinates.
   * @returns the great circle distance, in great-arc radians, from the point to the closest point on this circle.
   */
  public distance(point: Float64Array | LatLonInterface): number {
    const distanceToCenter = this.distanceToCenter(point);
    return distanceToCenter - this._radius;
  }

  /**
   * Checks whether a point lies on this circle.
   * @param point A point, represented as either a position vector or lat/long coordinates.
   * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
   * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns whether the point lies on this circle.
   */
  public includes(point: Float64Array | LatLonInterface, tolerance = GeoCircle.ANGULAR_TOLERANCE): boolean {
    const distance = this.distance(point);
    return Math.abs(distance) < tolerance;
  }

  /**
   * Checks whether a point lies within the boundary defined by this circle. This is equivalent to checking whether
   * the distance of the point from the center of this circle is less than or equal to this circle's radius.
   * @param point A point, represented as either a position vector or lat/long coordinates.
   * @param inclusive Whether points that lie on this circle should pass the check. True by default.
   * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
   * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns whether the point lies within the boundary defined by this circle.
   */
  public encircles(point: Float64Array | LatLonInterface, inclusive = true, tolerance = GeoCircle.ANGULAR_TOLERANCE): boolean {
    const distance = this.distance(point);
    return inclusive
      ? distance <= tolerance
      : distance < -tolerance;
  }

  /**
   * Gets the angular distance along an arc between two points that lie on this circle. The arc extends from the first
   * point to the second in a counterclockwise direction when viewed from above the center of the circle.
   * @param start A point on this circle which marks the beginning of an arc.
   * @param end A point on this circle which marks the end of an arc.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `end` lie on this circle.
   * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns the angular width of the arc between the two points, in radians.
   * @throws Error if either point does not lie on this circle.
   */
  public angleAlong(start: Float64Array | LatLonInterface, end: Float64Array | LatLonInterface, tolerance = GeoCircle.ANGULAR_TOLERANCE): number {
    if (!(start instanceof Float64Array)) {
      start = GeoPoint.sphericalToCartesian(start, GeoCircle.vec3Cache[1]);
    }
    if (!(end instanceof Float64Array)) {
      end = GeoPoint.sphericalToCartesian(end, GeoCircle.vec3Cache[2]);
    }

    if (!this.includes(start, tolerance) || !this.includes(end, tolerance)) {
      throw new Error(`GeoCircle: at least one of the two specified arc end points does not lie on this circle (start point distance of ${this.distance(start)}, end point distance of ${this.distance(end)}, vs tolerance of ${tolerance}).`);
    }

    if (this._radius <= GeoCircle.ANGULAR_TOLERANCE) {
      return 0;
    }

    const startRadialNormal = Vec3Math.normalize(Vec3Math.cross(this._center, start, GeoCircle.vec3Cache[3]), GeoCircle.vec3Cache[3]);
    const endRadialNormal = Vec3Math.normalize(Vec3Math.cross(this._center, end, GeoCircle.vec3Cache[4]), GeoCircle.vec3Cache[4]);
    const angularDistance = Math.acos(Utils.Clamp(Vec3Math.dot(startRadialNormal, endRadialNormal), -1, 1));

    const isArcGreaterThanSemi = Vec3Math.dot(startRadialNormal, end) < 0;
    return isArcGreaterThanSemi ? 2 * Math.PI - angularDistance : angularDistance;
  }

  /**
   * Gets the distance along an arc between two points that lie on this circle. The arc extends from the first point
   * to the second in a counterclockwise direction when viewed from above the center of the circle.
   * @param start A point on this circle which marks the beginning of an arc.
   * @param end A point on this circle which marks the end of an arc.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `start` and `end` lie on this circle.
   * Defaults to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns the length of the arc between the two points, in great-arc radians.
   * @throws Error if either point does not lie on this circle.
   */
  public distanceAlong(start: Float64Array | LatLonInterface, end: Float64Array | LatLonInterface, tolerance = GeoCircle.ANGULAR_TOLERANCE): number {
    return this.arcLength(this.angleAlong(start, end, tolerance));
  }

  /**
   * Calculates the true bearing along this circle at a point on the circle.
   * @param point A point on this circle.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
   * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns the bearing along this circle at the point.
   * @throws Error if the point does not lie on this circle.
   */
  public bearingAt(point: Float64Array | LatLonInterface, tolerance = GeoCircle.ANGULAR_TOLERANCE): number {
    if (!(point instanceof Float64Array)) {
      point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[1]);
    }

    if (!this.includes(point, tolerance)) {
      throw new Error(`GeoCircle: the specified point does not lie on this circle (distance of ${Math.abs(this.distance(point))} vs tolerance of ${tolerance}).`);
    }

    if (this._radius <= GeoCircle.ANGULAR_TOLERANCE || 1 - Math.abs(Vec3Math.dot(point, GeoCircle.NORTH_POLE)) <= GeoCircle.ANGULAR_TOLERANCE) {
      // Meaningful bearings cannot be defined along a circle with 0 radius (effectively a point) and at the north and south poles.
      return NaN;
    }

    const radialNormal = Vec3Math.normalize(Vec3Math.cross(this._center, point, GeoCircle.vec3Cache[2]), GeoCircle.vec3Cache[2]);
    const northNormal = Vec3Math.normalize(Vec3Math.cross(point, GeoCircle.NORTH_POLE, GeoCircle.vec3Cache[3]), GeoCircle.vec3Cache[3]);

    return (Math.acos(Utils.Clamp(Vec3Math.dot(radialNormal, northNormal), -1, 1)) * (radialNormal[2] >= 0 ? 1 : -1) * Avionics.Utils.RAD2DEG - 90 + 360) % 360;
  }

  /**
   * Offsets a point on this circle by a specified distance. The direction of the offset for positive distances is
   * counterclockwise when viewed from above the center of this circle.
   * @param point The point to offset.
   * @param distance The distance by which to offset, in great-arc radians.
   * @param out A Float64Array object to which to write the result.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
   * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns The offset point.
   * @throws Error if the point does not lie on this circle.
   */
  public offsetDistanceAlong(point: Float64Array | LatLonInterface, distance: number, out: Float64Array, tolerance?: number): Float64Array;
  /**
   * Offsets a point on this circle by a specified distance. The direction of the offset for positive distances is
   * counterclockwise when viewed from above the center of this circle.
   * @param point The point to offset.
   * @param distance The distance by which to offset, in great-arc radians.
   * @param out A GeoPoint object to which to write the result.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
   * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns The offset point.
   * @throws Error if the point does not lie on this circle.
   */
  public offsetDistanceAlong(point: Float64Array | LatLonInterface, distance: number, out: GeoPoint, tolerance?: number): GeoPoint;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public offsetDistanceAlong(
    point: Float64Array | LatLonInterface,
    distance: number,
    out: Float64Array | GeoPoint,
    tolerance = GeoCircle.ANGULAR_TOLERANCE
  ): Float64Array | GeoPoint {
    const angle = distance / Math.sin(this.radius);
    return this._offsetAngleAlong(point, angle, out, tolerance);
  }

  /**
   * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
   * is counterclockwise when viewed from above the center of this circle.
   * @param point The point to offset.
   * @param angle The angular distance by which to offset, in radians.
   * @param out A Float64Array object to which to write the result.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
   * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns The offset point.
   * @throws Error if the point does not lie on this circle.
   */
  public offsetAngleAlong(point: Float64Array | LatLonInterface, angle: number, out: Float64Array, tolerance?: number): Float64Array;
  /**
   * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
   * is counterclockwise when viewed from above the center of this circle.
   * @param point The point to offset.
   * @param angle The angular distance by which to offset, in radians.
   * @param out A GeoPoint object to which to write the result.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
   * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns The offset point.
   * @throws Error if the point does not lie on this circle.
   */
  public offsetAngleAlong(point: Float64Array | LatLonInterface, angle: number, out: GeoPoint, tolerance?: number): GeoPoint;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public offsetAngleAlong(
    point: Float64Array | LatLonInterface,
    angle: number,
    out: Float64Array | GeoPoint,
    tolerance = GeoCircle.ANGULAR_TOLERANCE
  ): Float64Array | GeoPoint {
    return this._offsetAngleAlong(point, angle, out, tolerance);
  }

  /**
   * Offsets a point on this circle by a specified angular distance. The direction of the offset for positive distances
   * is counterclockwise when viewed from above the center of this circle.
   * @param point The point to offset.
   * @param angle The angular distance by which to offset, in radians.
   * @param out A Float64Array or GeoPoint object to which to write the result.
   * @param tolerance The error tolerance, in great-arc radians, when checking if `point` lies on this circle. Defaults
   * to `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns The offset point.
   * @throws Error if the point does not lie on this circle.
   */
  private _offsetAngleAlong(
    point: Float64Array | LatLonInterface,
    angle: number,
    out: Float64Array | GeoPoint,
    tolerance = GeoCircle.ANGULAR_TOLERANCE
  ): Float64Array | GeoPoint {
    if (!(point instanceof Float64Array)) {
      point = GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[3]);
    }

    if (!this.includes(point, tolerance)) {
      throw new Error(`GeoCircle: the specified point does not lie on this circle (distance of ${Math.abs(this.distance(point))} vs tolerance of ${tolerance}).`);
    }

    if (this.radius === 0) {
      return out instanceof GeoPoint ? out.setFromCartesian(point) : Vec3Math.copy(point, out);
    }

    // Since point may not lie exactly on this circle due to error tolerance, project point onto this circle to ensure
    // the offset point lies exactly on this circle.
    point = this.closest(point, GeoCircle.vec3Cache[3]);

    const sin = Math.sin(angle / 2);
    const q0 = Math.cos(angle / 2);
    const q1 = sin * this._center[0];
    const q2 = sin * this._center[1];
    const q3 = sin * this._center[2];
    const q0Sq = q0 * q0;
    const q1Sq = q1 * q1;
    const q2Sq = q2 * q2;
    const q3Sq = q3 * q3;
    const q01 = q0 * q1;
    const q02 = q0 * q2;
    const q03 = q0 * q3;
    const q12 = q1 * q2;
    const q13 = q1 * q3;
    const q23 = q2 * q3;

    const rot_11 = q0Sq + q1Sq - q2Sq - q3Sq;
    const rot_12 = 2 * (q12 - q03);
    const rot_13 = 2 * (q13 + q02);
    const rot_21 = 2 * (q12 + q03);
    const rot_22 = q0Sq - q1Sq + q2Sq - q3Sq;
    const rot_23 = 2 * (q23 - q01);
    const rot_31 = 2 * (q13 - q02);
    const rot_32 = 2 * (q23 + q01);
    const rot_33 = (q0Sq - q1Sq - q2Sq + q3Sq);

    const x = point[0];
    const y = point[1];
    const z = point[2];

    const rotX = rot_11 * x + rot_12 * y + rot_13 * z;
    const rotY = rot_21 * x + rot_22 * y + rot_23 * z;
    const rotZ = rot_31 * x + rot_32 * y + rot_33 * z;

    return out instanceof Float64Array
      ? Vec3Math.set(rotX, rotY, rotZ, out)
      : out.setFromCartesian(Vec3Math.set(rotX, rotY, rotZ, GeoCircle.vec3Cache[2]));
  }

  /**
   * Calculates and returns the set of intersection points between this circle and another one, and writes the results
   * to an array of position vectors.
   * @param other The other circle to test for intersections.
   * @param out An array in which to store the results. The results will be stored at indexes 0 and 1. If these indexes
   * are empty, then new Float64Array objects will be created and inserted into the array.
   * @returns The number of solutions written to the out array. Either 0, 1, or 2.
   */
  public intersection(other: GeoCircle, out: Float64Array[]): number {
    const center1 = this._center;
    const center2 = other._center;
    const radius1 = this._radius;
    const radius2 = other._radius;

    /**
     * Theory: We can model geo circles as the intersection between a sphere and the unit sphere (Earth's surface).
     * Therefore, the intersection of two geo circles is the intersection between two spheres AND the unit sphere.
     * First, we find the intersection of the two non-Earth spheres (which can either be a sphere, a circle, or a
     * point), then we find the intersection of that geometry with the unit sphere.
     */

    const dot = Vec3Math.dot(center1, center2);
    const dotSquared = dot * dot;
    if (dotSquared === 1) {
      // the two circles are concentric; either there are zero solutions or infinite solutions; either way we don't
      // write any solutions to the array.
      return 0;
    }

    // find the position vector to the center of the circle which defines the intersection of the two geo circle
    // spheres.
    const a = (Math.cos(radius1) - dot * Math.cos(radius2)) / (1 - dotSquared);
    const b = (Math.cos(radius2) - dot * Math.cos(radius1)) / (1 - dotSquared);
    const intersection = Vec3Math.add(
      Vec3Math.multScalar(center1, a, GeoCircle.vec3Cache[0]),
      Vec3Math.multScalar(center2, b, GeoCircle.vec3Cache[1]),
      GeoCircle.vec3Cache[0]
    );

    const intersectionLengthSquared = Vec3Math.dot(intersection, intersection);
    if (intersectionLengthSquared > 1) {
      // the two geo circle spheres do not intersect.
      return 0;
    }

    const cross = Vec3Math.cross(center1, center2, GeoCircle.vec3Cache[1]);
    const crossLengthSquared = Vec3Math.dot(cross, cross);
    if (crossLengthSquared === 0) {
      // this technically can't happen (since we already check if center1 dot center2 === +/-1 above, but just in
      // case...)
      return 0;
    }

    const offset = Math.sqrt((1 - intersectionLengthSquared) / crossLengthSquared);
    let solutionCount = 1;
    if (!out[0]) {
      out[0] = new Float64Array(3);
    }
    out[0].set(cross);
    Vec3Math.multScalar(out[0], offset, out[0]);
    Vec3Math.add(out[0], intersection, out[0]);
    if (offset > 0) {
      if (!out[1]) {
        out[1] = new Float64Array(3);
      }
      out[1].set(cross);
      Vec3Math.multScalar(out[1], -offset, out[1]);
      Vec3Math.add(out[1], intersection, out[1]);
      solutionCount++;
    }
    return solutionCount;
  }

  /**
   * Calculates and returns the set of intersection points between this circle and another one, and writes the results
   * to an array of GeoPoint objects.
   * @param other The other circle to test for intersections.
   * @param out An array in which to store the results. The results will be stored at indexes 0 and 1. If these indexes
   * are empty, then new GeoPoint objects will be created and inserted into the array.
   * @returns The number of solutions written to the out array. Either 0, 1, or 2.
   */
  public intersectionGeoPoint(other: GeoCircle, out: GeoPoint[]): number {
    const solutionCount = this.intersection(other, GeoCircle.intersectionCache);
    for (let i = 0; i < solutionCount; i++) {
      if (!out[i]) {
        out[i] = new GeoPoint(0, 0);
      }
      out[i].setFromCartesian(GeoCircle.intersectionCache[i]);
    }
    return solutionCount;
  }

  /**
   * Calculates and returns the number of intersection points between this circle and another one. Returns NaN if there
   * are an infinite number of intersection points.
   * @param other The other circle to test for intersections.
   * @param tolerance The error tolerance, in great-arc radians, of this operation. Defaults to
   * `GeoCircle.ANGULAR_TOLERANCE` if not specified.
   * @returns the number of intersection points between this circle and the other one.
   */
  public numIntersectionPoints(other: GeoCircle, tolerance = GeoCircle.ANGULAR_TOLERANCE): number {
    const center1 = this.center;
    const center2 = other.center;
    const radius1 = this.radius;
    const radius2 = other.radius;

    const dot = Vec3Math.dot(center1, center2);
    const dotSquared = dot * dot;
    if (dotSquared === 1) {
      // the two circles are concentric; if they are the same circle there are an infinite number of intersections,
      // otherwise there are none.
      if (dot === 1) {
        // centers are the same
        return (Math.abs(this.radius - other.radius) <= tolerance) ? NaN : 0;
      } else {
        // centers are antipodal
        return (Math.abs(Math.PI - this.radius - other.radius) <= tolerance) ? NaN : 0;
      }
    }

    const a = (Math.cos(radius1) - dot * Math.cos(radius2)) / (1 - dotSquared);
    const b = (Math.cos(radius2) - dot * Math.cos(radius1)) / (1 - dotSquared);
    const intersection = Vec3Math.add(
      Vec3Math.multScalar(center1, a, GeoCircle.vec3Cache[0]),
      Vec3Math.multScalar(center2, b, GeoCircle.vec3Cache[1]),
      GeoCircle.vec3Cache[1]
    );

    const intersectionLengthSquared = Vec3Math.dot(intersection, intersection);
    if (intersectionLengthSquared > 1) {
      return 0;
    }

    const cross = Vec3Math.cross(center1, center2, GeoCircle.vec3Cache[1]);
    const crossLengthSquared = Vec3Math.dot(cross, cross);
    if (crossLengthSquared === 0) {
      return 0;
    }

    const sinTol = Math.sin(tolerance);
    return ((1 - intersectionLengthSquared) / crossLengthSquared > sinTol * sinTol) ? 2 : 1;
  }

  /**
   * Creates a new small circle from a lat/long coordinate pair and radius.
   * @param point The center of the new small circle.
   * @param radius The radius of the new small circle, in great-arc radians.
   * @returns a small circle.
   */
  public static createFromPoint(point: LatLonInterface, radius: number): GeoCircle {
    return new GeoCircle(GeoPoint.sphericalToCartesian(point, GeoCircle.vec3Cache[0]), radius);
  }

  /**
   * Creates a new great circle that contains two points. There are two possible great circles that contain any two
   * unique points; these circles differ only by their directionality (equivalently, the sign of their normal vectors).
   * The order of points passed to this method and the right-hand rule determines which of the two is returned.
   * @param point1 The first point that lies on the new great circle.
   * @param point2 The second point that lies on the new great circle.
   * @returns a great circle.
   */
  public static createGreatCircle(point1: Float64Array | LatLonInterface, point2: Float64Array | LatLonInterface): GeoCircle;
  public static createGreatCircle(point: Float64Array | LatLonInterface, bearing: number): GeoCircle;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static createGreatCircle(arg1: Float64Array | LatLonInterface, arg2: Float64Array | LatLonInterface | number): GeoCircle {
    return new GeoCircle(GeoCircle._getGreatCircleNormal(arg1, arg2, GeoCircle.vec3Cache[0]), Math.PI / 2);
  }

  /**
   * Creates a new great circle defined by one point and a bearing offset. The new great circle will be equivalent to
   * the path projected from the point with the specified initial bearing (forward azimuth).
   * @param point A point that lies on the new great circle.
   * @param bearing The initial bearing from the point.
   * @returns a great circle.
   */
  public static createGreatCircleFromPointBearing(point: Float64Array | LatLonInterface, bearing: number): GeoCircle {
    return new GeoCircle(GeoCircle.getGreatCircleNormalFromPointBearing(point, bearing, GeoCircle.vec3Cache[0]), Math.PI / 2);
  }

  /**
   * Calculates a normal vector for a great circle given two points which lie on the circle. The order of points passed
   * to this method and the right-hand rule determines which of the two possible normal vectors for the great circle is
   * returned.
   * @param point1 The first point that lies on the great circle.
   * @param point2 The second point that lies on the great circle.
   * @param out The vector to which to write the result.
   * @returns the normal vector for the great circle.
   */
  public static getGreatCircleNormal(point1: Float64Array | LatLonInterface, point2: Float64Array | LatLonInterface, out: Float64Array): Float64Array;
  /**
   * Calculates a normal vector for a great circle given a point and initial bearing.
   * @param point A point that lies on the great circle.
   * @param bearing The initial bearing from the point.
   * @param out The vector to which to write the result.
   * @returns the normal vector for the great circle.
   */
  public static getGreatCircleNormal(point: Float64Array | LatLonInterface, bearing: number, out: Float64Array): Float64Array;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static getGreatCircleNormal(arg1: Float64Array | LatLonInterface, arg2: Float64Array | LatLonInterface | number, out: Float64Array): Float64Array {
    return GeoCircle._getGreatCircleNormal(arg1, arg2, out);
  }

  /**
   * Calculates a normal vector for a great circle given two points which lie on the circle, or a point and initial bearing.
   * @param arg1 A point that lies on the great circle.
   * @param arg2 A second point that lies on the great circle, or an initial bearing from the first point.
   * @param out The vector to which to write the result.
   * @returns the normal vector for the great circle.
   */
  private static _getGreatCircleNormal(arg1: Float64Array | LatLonInterface, arg2: Float64Array | LatLonInterface | number, out: Float64Array): Float64Array {
    if (typeof arg2 === 'number') {
      return GeoCircle.getGreatCircleNormalFromPointBearing(arg1, arg2, out);
    } else {
      return GeoCircle.getGreatCircleNormalFromPoints(arg1, arg2, out);
    }
  }

  /**
   * Calculates a normal vector for a great circle given two points which lie on the cirlce.
   * @param point1 The first point that lies on the great circle.
   * @param point2 The second point that lies on the great circle.
   * @param out The vector to which to write the result.
   * @returns the normal vector for the great circle.
   */
  private static getGreatCircleNormalFromPoints(point1: Float64Array | LatLonInterface, point2: Float64Array | LatLonInterface, out: Float64Array): Float64Array {
    if (!(point1 instanceof Float64Array)) {
      point1 = GeoPoint.sphericalToCartesian(point1, GeoCircle.vec3Cache[0]);
    }
    if (!(point2 instanceof Float64Array)) {
      point2 = GeoPoint.sphericalToCartesian(point2, GeoCircle.vec3Cache[1]);
    }
    return Vec3Math.normalize(Vec3Math.cross(point1, point2, out), out);
  }

  /**
   * Calculates a normal vector for a great circle given a point and initial bearing.
   * @param point A point that lies on the great circle.
   * @param bearing The initial bearing from the point.
   * @param out The vector to which to write the result.
   * @returns the normal vector for the great circle.
   */
  private static getGreatCircleNormalFromPointBearing(point: Float64Array | LatLonInterface, bearing: number, out: Float64Array): Float64Array {
    if (point instanceof Float64Array) {
      point = GeoCircle.tempGeoPoint.setFromCartesian(point);
    }

    const lat = point.lat * Avionics.Utils.DEG2RAD;
    const long = point.lon * Avionics.Utils.DEG2RAD;
    bearing *= Avionics.Utils.DEG2RAD;
    const sinLat = Math.sin(lat);
    const sinLon = Math.sin(long);
    const cosLon = Math.cos(long);
    const sinBearing = Math.sin(bearing);
    const cosBearing = Math.cos(bearing);

    const x = sinLon * cosBearing - sinLat * cosLon * sinBearing;
    const y = -cosLon * cosBearing - sinLat * sinLon * sinBearing;
    const z = Math.cos(lat) * sinBearing;

    return Vec3Math.set(x, y, z, out);
  }
}