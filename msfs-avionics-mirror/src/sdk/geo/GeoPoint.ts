import { ReadonlyFloat64Array, Vec3Math } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';

/**
 * A representation of a point on Earth's surface.
 */
export interface GeoPointInterface {
  /** The latitude of the point. */
  lat: number;

  /** The longitude of the point. */
  lon: number;

  /**
   * Calculates the great-circle distance between this point and another point.
   * @param other The point to which to calculate the distance.
   * @returns The great-circle distance to the other point, in great-arc radians.
   */
  distance(other: LatLonInterface): number;
  /**
   * Calculates the great-circle distance between this point and another point.
   * @param lat The latitude of the point to which to calculate the distance.
   * @param lon The longitude of the point to which to calculate the distance.
   * @returns The great-circle distance to the other point, in great-arc radians.
   */
  distance(lat: number, lon: number): number;

  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param other The other point.
   * @returns The rhumb-line distance to the other point, in great-arc radians.
   */
  distanceRhumb(other: LatLonInterface): number;
  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param lat The latitude of the other point, in degrees.
   * @param lon The longitude of the other point, in degrees.
   * @returns The rhumb-line distance to the other point, in great-arc radians.
   */
  distanceRhumb(lat: number, lon: number): number;

  /**
   * Calculates the initial true bearing (forward azimuth) from this point to another point along the great circle
   * connecting the two.
   * @param other The other point.
   * @returns The initial true bearing to the other point, in degrees.
   */
  bearingTo(other: LatLonInterface): number;
  /**
   * Calculates the initial true bearing (forward azimuth) from this point to another point along the great circle
   * connecting the two.
   * @param lat The latitude of the other point, in degrees.
   * @param lon The longitude of the other point, in degrees.
   * @returns The initial true bearing to the other point, in degrees.
   */
  bearingTo(lat: number, lon: number): number;

  /**
   * Calculates the final true bearing from another point to this point (i.e. the back azimuth from this point to the
   * other point) along the great circle connecting the two.
   * @param other The other point.
   * @returns The final true bearing from the other point, in degrees.
   */
  bearingFrom(other: LatLonInterface): number;
  /**
   * Calculates the final true bearing from another point to this point (i.e. the back azimuth from this point to the
   * other point) along the great circle connecting the two.
   * @param lat The latitude of the other point, in degrees.
   * @param lon The longitude of the other point, in degrees.
   * @returns The final true bearing from the other point, in degrees.
   */
  bearingFrom(lat: number, lon: number): number;

  /**
   * Calculates the constant true bearing from this point to another point along the rhumb line connecting the two.
   * @param other The other point.
   * @returns The constant true bearing to the other point, in degrees.
   */
  bearingRhumb(other: LatLonInterface): number;
  /**
   * Calculates the constant true bearing from this point to another point along the rhumb line connecting the two.
   * @param lat The latitude of the other point, in degrees.
   * @param lon The longitude of the other point, in degrees.
   * @returns The constant true bearing to the other point, in degrees.
   */
  bearingRhumb(lat: number, lon: number): number;

  /**
   * Offsets this point by an initial bearing and distance along a great circle.
   * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
   * @param distance The distance, in great-arc radians, by which to offset.
   * @param out The GeoPoint to which to write the results.
   * @returns The offset point.
   */
  offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint;

  /**
   * Offsets this point by a constant bearing and distance along a rhumb line.
   * @param bearing The true bearing, in degrees, by which to offset.
   * @param distance The distance, in great-arc radians, by which to offset.
   * @param out The GeoPoint to which to write the results.
   * @returns The offset point.
   */
  offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint;

  /**
   * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param out The vector array to which to write the result.
   * @returns The cartesian representation of this point.
   */
  toCartesian(out: Float64Array): Float64Array;

  /**
   * Checks whether this point is equal to another point.
   * @param other The other point.
   * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians.
   * @returns Whether this point is equal to the other point.
   */
  equals(other: LatLonInterface, tolerance?: number): boolean;
  /**
   * Checks whether this point is equal to another point.
   * @param lat The latitude of the other point, in degrees.
   * @param lon The longitude of the other point, in degrees.
   * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians.
   * @returns Whether this point is equal to the other point.
   */
  equals(lat: number, lon: number, tolerance?: number): boolean;

  /**
   * Copies this point.
   * @param to An optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
   * will be created.
   * @returns A copy of this point.
   */
  copy(to?: GeoPoint): GeoPoint;
}

/**
 * A read-only wrapper for a GeoPoint.
 */
export class GeoPointReadOnly implements GeoPointInterface, LatLonInterface {
  /**
   * Constructor.
   * @param source - the source of the new read-only point.
   */
  constructor(private readonly source: GeoPoint) {
  }

  /**
   * The latitude of this point, in degrees.
   * @returns the latitude of this point.
   */
  public get lat(): number {
    return this.source.lat;
  }

  /**
   * The longitude of this point, in degrees.
   * @returns the longitude of this point.
   */
  public get lon(): number {
    return this.source.lon;
  }

  /** @inheritdoc */
  public distance(other: LatLonInterface): number;
  /** @inheritdoc */
  public distance(lat: number, lon: number): number
  // eslint-disable-next-line jsdoc/require-jsdoc
  public distance(arg1: LatLonInterface | number, arg2?: number): number {
    if (typeof arg1 === 'number') {
      return this.source.distance(arg1, arg2 as number);
    } else {
      return this.source.distance(arg1);
    }
  }

  /** @inheritdoc */
  public distanceRhumb(other: LatLonInterface): number;
  /** @inheritdoc */
  public distanceRhumb(lat: number, lon: number): number
  // eslint-disable-next-line jsdoc/require-jsdoc
  public distanceRhumb(arg1: LatLonInterface | number, arg2?: number): number {
    if (typeof arg1 === 'number') {
      return this.source.distanceRhumb(arg1, arg2 as number);
    } else {
      return this.source.distanceRhumb(arg1);
    }
  }

  /** @inheritdoc */
  public bearingTo(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingTo(lat: number, lon: number): number
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingTo(arg1: LatLonInterface | number, arg2?: number): number {
    if (typeof arg1 === 'number') {
      return this.source.bearingTo(arg1, arg2 as number);
    } else {
      return this.source.bearingTo(arg1);
    }
  }

  /** @inheritdoc */
  public bearingFrom(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingFrom(lat: number, lon: number): number
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingFrom(arg1: LatLonInterface | number, arg2?: number): number {
    if (typeof arg1 === 'number') {
      return this.source.bearingFrom(arg1, arg2 as number);
    } else {
      return this.source.bearingFrom(arg1);
    }
  }

  /** @inheritdoc */
  public bearingRhumb(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingRhumb(lat: number, lon: number): number
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingRhumb(arg1: LatLonInterface | number, arg2?: number): number {
    if (typeof arg1 === 'number') {
      return this.source.bearingRhumb(arg1, arg2 as number);
    } else {
      return this.source.bearingRhumb(arg1);
    }
  }

  /**
   * Offsets this point by an initial bearing and distance along a great circle.
   * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
   * @param distance The distance, in great-arc radians, by which to offset.
   * @param out The GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
   * @returns The offset point.
   * @throws {Error} if argument `out` is undefined.
   */
  public offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint {
    if (!out) {
      throw new Error('Cannot mutate a read-only GeoPoint.');
    }
    return this.source.offset(bearing, distance, out);
  }

  /**
   * Offsets this point by a constant bearing and distance along a rhumb line.
   * @param bearing The true bearing, in degrees, by which to offset.
   * @param distance The distance, in great-arc radians, by which to offset.
   * @param out The GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
   * @returns The offset point.
   * @throws {Error} If argument `out` is undefined.
   */
  public offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint {
    if (!out) {
      throw new Error('Cannot mutate a read-only GeoPoint.');
    }
    return this.source.offsetRhumb(bearing, distance, out);
  }

  /**
   * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param out The vector array to which to write the result.
   * @returns The cartesian representation of this point.
   */
  public toCartesian(out: Float64Array): Float64Array {
    return this.source.toCartesian(out);
  }

  /** @inheritdoc */
  public equals(other: LatLonInterface, tolerance?: number): boolean;
  /** @inheritdoc */
  public equals(lat: number, lon: number, tolerance?: number): boolean;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public equals(arg1: LatLonInterface | number, arg2?: number, arg3?: number): boolean {
    if (typeof arg1 === 'number') {
      return this.source.equals(arg1, arg2 as number, arg3);
    } else {
      return this.source.equals(arg1, arg2);
    }
  }

  /** @inheritdoc */
  public copy(to?: GeoPoint): GeoPoint {
    return this.source.copy(to);
  }
}

/**
 * A point on Earth's surface. This class uses a spherical Earth model.
 */
export class GeoPoint implements GeoPointInterface, LatLonInterface {
  /**
   * The default equality tolerance, defined as the maximum allowed distance between two equal points in great-arc
   * radians.
   */
  public static readonly EQUALITY_TOLERANCE = 1e-7; // ~61 cm

  private static readonly tempVec3 = new Float64Array(3);
  private static readonly tempGeoPoint = new GeoPoint(0, 0);

  private _lat = 0;
  private _lon = 0;
  public readonly readonly: GeoPointReadOnly;

  /**
   * Constructor.
   * @param lat The latitude, in degrees.
   * @param lon The longitude, in degrees.
   */
  constructor(lat: number, lon: number) {
    this.set(lat, lon);
    this.readonly = new GeoPointReadOnly(this);
  }

  /**
   * The latitude of this point, in degrees.
   * @returns the latitude of this point.
   */
  public get lat(): number {
    return this._lat;
  }

  /**
   * The longitude of this point, in degrees.
   * @returns the longitude of this point.
   */
  public get lon(): number {
    return this._lon;
  }

  /**
   * Converts an argument list consisting of either a LatLonInterface or lat/lon coordinates into an equivalent
   * LatLonInterface.
   * @param arg1 Argument 1.
   * @param arg2 Argument 2.
   * @returns A LatLonInterface.
   */
  private static asLatLonInterface(arg1: LatLonInterface | number, arg2: any): LatLonInterface {
    if (typeof arg1 === 'number') {
      return GeoPoint.tempGeoPoint.set(arg1, arg2 as number);
    } else {
      return arg1;
    }
  }

  /**
   * Converts an argument list consisting of either a 3D vector or x, y, z components into an equivalent 3D vector.
   * @param arg1 Argument 1.
   * @param arg2 Argument 2.
   * @param arg3 Argument 3.
   * @returns A 3D vector.
   */
  private static asVec3(arg1: ReadonlyFloat64Array | number, arg2: any, arg3: any): ReadonlyFloat64Array {
    if (typeof arg1 === 'number') {
      return Vec3Math.set(arg1, arg2 as number, arg3 as number, GeoPoint.tempVec3);
    } else {
      return arg1;
    }
  }

  /**
   * Sets this point's latitude/longitude values.
   * @param other The point from which to take the new latitude/longitude values.
   * @returns This point, after it has been changed.
   */
  public set(other: LatLonInterface): this;
  /**
   * Sets this point's latitude/longitude values.
   * @param lat The new latitude, in degrees.
   * @param lon The new longitude, in degrees.
   * @returns This point, after it has been changed.
   */
  public set(lat: number, lon: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: LatLonInterface | number, arg2?: number): this {
    let lat, lon;
    if (typeof arg1 === 'number') {
      lat = arg1;
      lon = arg2 as number;
    } else {
      lat = arg1.lat;
      lon = arg1.lon;
    }

    lat = GeoPoint.toPlusMinus180(lat);
    lon = GeoPoint.toPlusMinus180(lon);
    if (Math.abs(lat) > 90) {
      lat = 180 - lat;
      lat = GeoPoint.toPlusMinus180(lat);
      lon += 180;
      lon = GeoPoint.toPlusMinus180(lon);
    }
    this._lat = lat;
    this._lon = lon;
    return this;
  }

  /**
   * Sets this point's coordinate values from a cartesian position vector. By convention, in the cartesian coordinate
   * system the origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E, and
   * the positive z-axis passes through the north pole.
   * @param vec A position vector defining the new coordinates.
   * @returns This point, after it has been changed.
   */
  public setFromCartesian(vec: ReadonlyFloat64Array): this;
  /**
   * Sets this point's coordinate values from a cartesian position vector. By convention, in the cartesian coordinate
   * system the origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E, and
   * the positive z-axis passes through the north pole.
   * @param x The x component of a position vector defining the new coordinates.
   * @param y The y component of a position vector defining the new coordinates.
   * @param z The z component of a position vector defining the new coordinates.
   * @returns This point, after it has been changed.
   */
  public setFromCartesian(x: number, y: number, z: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public setFromCartesian(arg1: ReadonlyFloat64Array | number, arg2?: number, arg3?: number): this {
    const vec = GeoPoint.asVec3(arg1, arg2, arg3);

    const theta = Vec3Math.theta(vec);
    const phi = Vec3Math.phi(vec);
    return this.set(90 - theta * Avionics.Utils.RAD2DEG, phi * Avionics.Utils.RAD2DEG);
  }

  /** @inheritdoc */
  public distance(other: LatLonInterface): number;
  /** @inheritdoc */
  public distance(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public distance(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return GeoPoint.distance(this.lat, this.lon, other.lat, other.lon);
  }

  /** @inheritdoc */
  public distanceRhumb(other: LatLonInterface): number;
  /** @inheritdoc */
  public distanceRhumb(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public distanceRhumb(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return GeoPoint.distanceRhumb(this.lat, this.lon, other.lat, other.lon);
  }

  /** @inheritdoc */
  public bearingTo(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingTo(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingTo(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return GeoPoint.initialBearing(this.lat, this.lon, other.lat, other.lon);
  }

  /** @inheritdoc */
  public bearingFrom(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingFrom(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingFrom(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return GeoPoint.finalBearing(other.lat, other.lon, this.lat, this.lon);
  }

  /** @inheritdoc */
  public bearingRhumb(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingRhumb(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingRhumb(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return GeoPoint.bearingRhumb(this.lat, this.lon, other.lat, other.lon);
  }

  /**
   * Offsets this point by an initial bearing and distance along a great circle.
   * @param bearing The initial true bearing (forward azimuth), in degrees, by which to offset.
   * @param distance The distance, in great-arc radians, by which to offset.
   * @param out The GeoPoint to which to write the results. By default this point.
   * @returns The offset point.
   */
  public offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint {
    const latRad = this.lat * Avionics.Utils.DEG2RAD;
    const lonRad = this.lon * Avionics.Utils.DEG2RAD;
    const sinLat = Math.sin(latRad);
    const cosLat = Math.cos(latRad);
    const sinBearing = Math.sin(bearing * Avionics.Utils.DEG2RAD);
    const cosBearing = Math.cos(bearing * Avionics.Utils.DEG2RAD);
    const angularDistance = distance;
    const sinAngularDistance = Math.sin(angularDistance);
    const cosAngularDistance = Math.cos(angularDistance);

    const offsetLatRad = Math.asin(sinLat * cosAngularDistance + cosLat * sinAngularDistance * cosBearing);
    const offsetLonDeltaRad = Math.atan2(sinBearing * sinAngularDistance * cosLat, cosAngularDistance - sinLat * Math.sin(offsetLatRad));

    const offsetLat = offsetLatRad * Avionics.Utils.RAD2DEG;
    const offsetLon = (lonRad + offsetLonDeltaRad) * Avionics.Utils.RAD2DEG;

    return (out ?? this).set(offsetLat, offsetLon);
  }

  /**
   * Offsets this point by a constant bearing and distance along a rhumb line.
   * @param bearing The true bearing, in degrees, by which to offset.
   * @param distance The distance, in great-arc radians, by which to offset.
   * @param out The GeoPoint to which to write the results. By default this point.
   * @returns The offset point.
   */
  public offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint {
    const latRad = this.lat * Avionics.Utils.DEG2RAD;
    const lonRad = this.lon * Avionics.Utils.DEG2RAD;
    const bearingRad = bearing * Avionics.Utils.DEG2RAD;

    const deltaLat = distance * Math.cos(bearingRad);
    let offsetLat = latRad + deltaLat;
    let offsetLon;

    if (Math.abs(offsetLat) >= Math.PI / 2) {
      // you can't technically go past the poles along a rhumb line, so we will simply terminate the path at the pole
      offsetLat = Math.sign(offsetLat) * 90;
      offsetLon = 0; // since longitude is meaningless at the poles, we'll arbitrarily pick a longitude of 0 degrees.
    } else {
      const deltaPsi = GeoPoint.deltaPsi(latRad, offsetLat);
      const correction = GeoPoint.rhumbCorrection(deltaPsi, latRad, offsetLat);
      const deltaLon = distance * Math.sin(bearingRad) / correction;
      offsetLon = lonRad + deltaLon;

      offsetLat *= Avionics.Utils.RAD2DEG;
      offsetLon *= Avionics.Utils.RAD2DEG;
    }

    return (out ?? this).set(offsetLat, offsetLon);
  }

  /** @inheritdoc */
  public toCartesian(out: Float64Array): Float64Array {
    return GeoPoint.sphericalToCartesian(this, out);
  }

  /** @inheritdoc */
  public equals(other: LatLonInterface, tolerance?: number): boolean;
  /** @inheritdoc */
  public equals(lat: number, lon: number, tolerance?: number): boolean;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public equals(arg1: LatLonInterface | number, arg2?: number, arg3?: number): boolean {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    const tolerance = typeof arg1 === 'number' ? arg3 : arg2;
    if (other) {
      return this.distance(other) <= (tolerance ?? GeoPoint.EQUALITY_TOLERANCE);
    } else {
      return false;
    }
  }

  /** @inheritdoc */
  public copy(to?: GeoPoint): GeoPoint {
    return to ? to.set(this.lat, this.lon) : new GeoPoint(this.lat, this.lon);
  }

  /**
   * Calculates the cartesian (x, y, z) representation of a point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param point The point to convert.
   * @param out The vector array to which to write the result.
   * @returns the cartesian representation of the point.
   */
  public static sphericalToCartesian(point: LatLonInterface, out: Float64Array): Float64Array;
  /**
   * Calculates the cartesian (x, y, z) representation of a point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param lat The latitude of the point to convert, in degrees.
   * @param lon The longitude of the point to convert, in degrees.
   * @param out The vector array to which to write the result.
   * @returns the cartesian representation of the point.
   */
  public static sphericalToCartesian(lat: number, lon: number, out: Float64Array): Float64Array;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static sphericalToCartesian(arg1: LatLonInterface | number, arg2: number | Float64Array, arg3?: Float64Array): Float64Array {
    const point = GeoPoint.asLatLonInterface(arg1, arg2);
    const theta = (90 - point.lat) * Avionics.Utils.DEG2RAD;
    const phi = point.lon * Avionics.Utils.DEG2RAD;
    return Vec3Math.setFromSpherical(1, theta, phi, arg3 ?? arg2 as Float64Array);
  }

  /**
   * Checks whether two points are equal.
   * @param lat1 The latitude of the first point, in degrees.
   * @param lon1 The longitude of the first point, in degrees.
   * @param lat2 The latitude of the second point, in degrees.
   * @param lon2 The longitude of the second point, in degrees.
   * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians. Defaults to `GeoPoint.EQUALITY_TOLERANCE`.
   * @returns Whether the two points are equal.
   */
  public static equals(lat1: number, lon1: number, lat2: number, lon2: number, tolerance?: number): boolean;
  /**
   * Checks whether two points are equal.
   * @param point1 The first point.
   * @param point2 The second point.
   * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians. Defaults to `GeoPoint.EQUALITY_TOLERANCE`.
   * @returns Whether the two points are equal.
   */
  public static equals(point1: LatLonInterface, point2: LatLonInterface, tolerance?: number): boolean;
  /**
   * Checks whether two points are equal.
   * @param point1 The first point, in cartesian form.
   * @param point2 The second point, in cartesian form.
   * @param tolerance The tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians. Defaults to `GeoPoint.EQUALITY_TOLERANCE`.
   * @returns Whether the two points are equal.
   */
  public static equals(point1: ReadonlyFloat64Array, point2: ReadonlyFloat64Array, tolerance?: number): boolean;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static equals(
    arg1: LatLonInterface | ReadonlyFloat64Array | number,
    arg2: LatLonInterface | ReadonlyFloat64Array | number,
    arg3?: number,
    arg4?: number,
    arg5?: number
  ): boolean {
    if (arg1 instanceof Float64Array) {
      return GeoPoint.distance(arg1, arg2 as Float64Array) <= (arg3 ?? GeoPoint.EQUALITY_TOLERANCE);
    } else if (typeof arg1 === 'number') {
      return GeoPoint.distance(arg1, arg2 as number, arg3 as number, arg4 as number) <= (arg5 ?? GeoPoint.EQUALITY_TOLERANCE);
    } else {
      return GeoPoint.distance(arg1 as LatLonInterface, arg2 as LatLonInterface) <= (arg3 ?? GeoPoint.EQUALITY_TOLERANCE);
    }
  }

  /**
   * Calculates the great-circle distance between two points.
   * @param lat1 The latitude of the first point, in degrees.
   * @param lon1 The longitude of the first point, in degrees.
   * @param lat2 The latitude of the second point, in degrees.
   * @param lon2 The longitude of the second point, in degrees.
   * @returns The great-circle distance between the two points, in great-arc radians.
   */
  public static distance(lat1: number, lon1: number, lat2: number, lon2: number): number;
  /**
   * Calculates the great-circle distance between two points.
   * @param point1 The first point.
   * @param point2 The second point.
   * @returns The great-circle distance between the two points, in great-arc radians.
   */
  public static distance(point1: LatLonInterface, point2: LatLonInterface): number;
  /**
   * Calculates the great-circle distance between two points.
   * @param point1 The first point, in cartesian form.
   * @param point2 The second point, in cartesian form.
   * @returns The great-circle distance between the two points, in great-arc radians.
   */
  public static distance(point1: ReadonlyFloat64Array, point2: ReadonlyFloat64Array): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static distance(arg1: LatLonInterface | ReadonlyFloat64Array | number, arg2: LatLonInterface | ReadonlyFloat64Array | number, arg3?: number, arg4?: number): number {
    if (arg1 instanceof Float64Array) {
      return Math.acos(Utils.Clamp(Vec3Math.dot(arg1, arg2 as Float64Array), -1, 1));
    } else {
      let lat1, lon1, lat2, lon2;

      if (typeof arg1 === 'number') {
        lat1 = arg1 * Avionics.Utils.DEG2RAD;
        lon1 = arg2 as number * Avionics.Utils.DEG2RAD;
        lat2 = arg3 as number * Avionics.Utils.DEG2RAD;
        lon2 = arg4 as number * Avionics.Utils.DEG2RAD;
      } else {
        lat1 = (arg1 as LatLonInterface).lat;
        lon1 = (arg1 as LatLonInterface).lon;
        lat2 = (arg2 as LatLonInterface).lat;
        lon2 = (arg2 as LatLonInterface).lon;
      }

      // haversine formula
      const sinHalfDeltaLat = Math.sin((lat2 - lat1) / 2);
      const sinHalfDeltaLon = Math.sin((lon2 - lon1) / 2);
      const a = sinHalfDeltaLat * sinHalfDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLon * sinHalfDeltaLon;
      return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
  }

  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param lat1 The latitude of the first point, in degrees.
   * @param lon1 The longitude of the first point, in degrees.
   * @param lat2 The latitude of the second point, in degrees.
   * @param lon2 The longitude of the second point, in degrees.
   * @returns The distance along the rhumb line connecting the two points, in great-arc radians.
   */
  public static distanceRhumb(lat1: number, lon1: number, lat2: number, lon2: number): number;
  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param point1 The first point.
   * @param point2 The second point.
   * @returns The distance along the rhumb line connecting the two points, in great-arc radians.
   */
  public static distanceRhumb(point1: LatLonInterface, point2: LatLonInterface): number;
  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param point1 The first point, in cartesian form.
   * @param point2 The second point, in cartesian form.
   * @returns The distance along the rhumb line connecting the two points, in great-arc radians.
   */
  public static distanceRhumb(point1: ReadonlyFloat64Array, point2: ReadonlyFloat64Array): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static distanceRhumb(arg1: LatLonInterface | ReadonlyFloat64Array | number, arg2: LatLonInterface | ReadonlyFloat64Array | number, arg3?: number, arg4?: number): number {
    let lat1, lon1, lat2, lon2;

    if (typeof arg1 === 'number') {
      lat1 = arg1 * Avionics.Utils.DEG2RAD;
      lon1 = arg2 as number * Avionics.Utils.DEG2RAD;
      lat2 = arg3 as number * Avionics.Utils.DEG2RAD;
      lon2 = arg4 as number * Avionics.Utils.DEG2RAD;
    } else if (arg1 instanceof Float64Array) {
      const point1 = GeoPoint.tempGeoPoint.setFromCartesian(arg1);
      lat1 = point1.lat;
      lon1 = point1.lon;

      const point2 = GeoPoint.tempGeoPoint.setFromCartesian(arg2 as Float64Array);
      lat2 = point2.lat;
      lon2 = point2.lon;
    } else {
      lat1 = (arg1 as LatLonInterface).lat;
      lon1 = (arg1 as LatLonInterface).lon;
      lat2 = (arg2 as LatLonInterface).lat;
      lon2 = (arg2 as LatLonInterface).lon;
    }

    const deltaLat = lat2 - lat1;
    let deltaLon = lon2 - lon1;

    const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
    const correction = GeoPoint.rhumbCorrection(deltaPsi, lat1, lat2);
    if (Math.abs(deltaLon) > Math.PI) {
      deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
    }
    return Math.sqrt(deltaLat * deltaLat + correction * correction * deltaLon * deltaLon);
  }

  /**
   * Calculates the initial true bearing (forward azimuth) from one point to another along the great circle connecting
   * the two.
   * @param lat1 The latitude of the initial point, in degrees.
   * @param lon1 The longitude of the initial point, in degrees.
   * @param lat2 The latitude of the final point, in degrees.
   * @param lon2 The longitude of the final point, in degrees.
   * @returns The initial true bearing, in degrees, from the initial point to the final point along the great circle
   * connecting the two.
   */
  public static initialBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    lat1 *= Avionics.Utils.DEG2RAD;
    lat2 *= Avionics.Utils.DEG2RAD;
    lon1 *= Avionics.Utils.DEG2RAD;
    lon2 *= Avionics.Utils.DEG2RAD;

    const cosLat2 = Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * cosLat2 * Math.cos(lon2 - lon1);
    const y = Math.sin(lon2 - lon1) * cosLat2;
    const bearing = Math.atan2(y, x) * Avionics.Utils.RAD2DEG;
    return (bearing + 360) % 360; // enforce range [0, 360)
  }

  /**
   * Calculates the final true bearing from one point to another along the great circle connecting the two.
   * @param lat1 The latitude of the initial point, in degrees.
   * @param lon1 The longitude of the initial point, in degrees.
   * @param lat2 The latitude of the final point, in degrees.
   * @param lon2 The longitude of the final point, in degrees.
   * @returns The final true bearing, in degrees, from the initial point to the final point along the great circle
   * connecting the two.
   */
  public static finalBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    return (GeoPoint.initialBearing(lat2, lon2, lat1, lon1) + 180) % 360;
  }

  /**
   * Calculates the constant true bearing from one point to another along the rhumb line connecting the two.
   * @param lat1 The latitude of the initial point, in degrees.
   * @param lon1 The longitude of the initial point, in degrees.
   * @param lat2 The latitude of the final point, in degrees.
   * @param lon2 The longitude of the final point, in degrees.
   * @returns The constant true bearing, in degrees, from the initial point to the final point along the rhumb line
   * connecting the two.
   */
  public static bearingRhumb(lat1: number, lon1: number, lat2: number, lon2: number): number {
    lat1 *= Avionics.Utils.DEG2RAD;
    lat2 *= Avionics.Utils.DEG2RAD;
    lon1 *= Avionics.Utils.DEG2RAD;
    lon2 *= Avionics.Utils.DEG2RAD;

    let deltaLon = lon2 - lon1;
    const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
    if (Math.abs(deltaLon) > Math.PI) {
      deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
    }
    return Math.atan2(deltaLon, deltaPsi) * Avionics.Utils.RAD2DEG;
  }

  /**
   * Converts an angle, in degrees, to an equivalent value in the range [-180, 180).
   * @param angle An angle in degrees.
   * @returns The angle's equivalent in the range [-180, 180).
   */
  private static toPlusMinus180(angle: number): number {
    return ((angle % 360) + 540) % 360 - 180;
  }

  /**
   * Calculates the difference in isometric latitude from a pair of geodetic (geocentric) latitudes.
   * @param latRad1 Geodetic latitude 1, in radians.
   * @param latRad2 Geodetic latitude 2, in radians.
   * @returns The difference in isometric latitude from latitude 1 to latitude 2, in radians.
   */
  private static deltaPsi(latRad1: number, latRad2: number): number {
    return Math.log(Math.tan(latRad2 / 2 + Math.PI / 4) / Math.tan(latRad1 / 2 + Math.PI / 4));
  }

  /**
   * Calculates the rhumb correction factor between two latitudes.
   * @param deltaPsi The difference in isometric latitude beween the two latitudes.
   * @param latRad1 Geodetic latitude 1, in radians.
   * @param latRad2 Geodetic latitude 2, in radians.
   * @returns The rhumb correction factor between the two latitudes.
   */
  private static rhumbCorrection(deltaPsi: number, latRad1: number, latRad2: number): number {
    return Math.abs(deltaPsi) > 1e-12 ? ((latRad2 - latRad1) / deltaPsi) : Math.cos(latRad1);
  }
}