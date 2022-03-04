import { Vec3Math } from '../math/VecMath';
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
   * @param other - the point to which to calculate the distance.
   * @returns the great-circle distance to the other point, in great-arc radians.
   */
  distance(other: LatLonInterface): number;
  /**
   * Calculates the great-circle distance between this point and another point.
   * @param lat - the latitude of the point to which to calculate the distance.
   * @param lon - the longitude of the point to which to calculate the distance.
   * @returns the great-circle distance to the other point, in great-arc radians.
   */
  distance(lat: number, lon: number): number;

  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param other - the other point.
   * @returns the rhumb-line distance to the other point, in great-arc radians.
   */
  distanceRhumb(other: LatLonInterface): number;
  /**
   * Calculates the distance along the rhumb line connecting this point with another point.
   * @param lat - the latitude of the other point.
   * @param lon - the longitude of the other point.
   * @returns the rhumb-line distance to the other point, in great-arc radians.
   */
  distanceRhumb(lat: number, lon: number): number;

  /**
   * Calculates the initial bearing (forward azimuth) from this point to another point along the great circle
   * connecting the two.
   * @param other - the other point.
   * @returns the initial bearing to the other point, in degrees.
   */
  bearingTo(other: LatLonInterface): number;
  /**
   * Calculates the initial bearing (forward azimuth) from this point to another point along the great circle
   * connecting the two.
   * @param lat - the latitude of the other point.
   * @param lon - the longitude of the other point.
   * @returns the initial bearing to the other point, in degrees.
   */
  bearingTo(lat: number, lon: number): number;

  /**
   * Calculates the final bearing from another point to this point (i.e. the back azimuth from this point to the
   * other point) along the great circle connecting the two.
   * @param other - the other point.
   * @returns the final bearing from the other point, in degrees.
   */
  bearingFrom(other: LatLonInterface): number;
  /**
   * Calculates the final bearing from another point to this point (i.e. the back azimuth from this point to the
   * other point) along the great circle connecting the two.
   * @param lat - the latitude of the other point.
   * @param lon - the longitude of the other point.
   * @returns the final bearing from the other point, in degrees.
   */
  bearingFrom(lat: number, lon: number): number;

  /**
   * Calculates the constant bearing to another point to this point along the rhumb line connecting the two.
   * @param other - the other point.
   * @returns the constant bearing to the other point, in degrees.
   */
  bearingRhumb(other: LatLonInterface): number;
  /**
   * Calculates the constant bearing to another point to this point along the rhumb line connecting the two.
   * @param lat - the latitude of the other point.
   * @param lon - the longitude of the other point.
   * @returns the constant bearing to the other point, in degrees.
   */
  bearingRhumb(lat: number, lon: number): number;

  /**
   * Offsets this point by an initial bearing and distance along a great circle.
   * @param bearing - the initial bearing (forward azimuth) by which to offset.
   * @param distance - the distance, in great-arc radians, by which to offset.
   * @param out - the GeoPoint to which to write the results.
   * @returns the offset point.
   */
  offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint;

  /**
   * Offsets this point by a constant bearing and distance along a rhumb line.
   * @param bearing - the bearing by which to offset.
   * @param distance - the distance, in great-arc radians, by which to offset.
   * @param out - the GeoPoint to which to write the results.
   * @returns the offset point.
   */
  offsetRhumb(bearing: number, distance: number, out?: GeoPoint): GeoPoint;

  /**
   * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param out - the vector array to which to write the result.
   * @returns the cartesian representation of this point.
   */
  toCartesian(out: Float64Array): Float64Array;

  /**
   * Checks whether this point is equal to another point.
   * @param other - the other point.
   * @param tolerance - the tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians.
   * @returns whether this point is equal to the other point.
   */
  equals(other: LatLonInterface, tolerance?: number): boolean;
  /**
   * Checks whether this point is equal to another point.
   * @param lat - the latitude of the other point.
   * @param lon - the longitude of the other point.
   * @param tolerance - the tolerance of the equality check, defined as the maximum allowed distance between two equal
   * points in great-arc radians.
   * @returns  whether this point is equal to the other point.
   */
  equals(lat: number, lon: number, tolerance?: number): boolean;

  /**
   * Copies this point.
   * @param to - an optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
   * will be created.
   * @returns a copy of this point.
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
   * @param bearing - the initial bearing (forward azimuth) by which to offset.
   * @param distance - the distance, in great-arc radians, by which to offset.
   * @param out - the GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
   * @returns the offset point.
   * @throws {Error} argument out cannot be undefined.
   */
  public offset(bearing: number, distance: number, out?: GeoPoint): GeoPoint {
    if (!out) {
      throw new Error('Cannot mutate a read-only GeoPoint.');
    }
    return this.source.offset(bearing, distance, out);
  }

  /**
   * Offsets this point by a constant bearing and distance along a rhumb line.
   * @param bearing - the bearing by which to offset.
   * @param distance - the distance, in great-arc radians, by which to offset.
   * @param out - the GeoPoint to which to write the results. If not supplied, a new GeoPoint object is created.
   * @returns the offset point.
   * @throws {Error} argument out cannot be undefined.
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
   * @param out - the vector array to which to write the result.
   * @returns the cartesian representation of this point.
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

  /**
   * Copies this point.
   * @param to - an optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
   * will be created.
   * @returns a copy of this point.
   */
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
   * @param lat - the latitude, in degrees.
   * @param lon - the longitude, in degrees.
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
   * @returns a LatLonInterface.
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
   * @returns a 3D vector.
   */
  private static asVec3(arg1: Float64Array | number, arg2: any, arg3: any): Float64Array {
    if (typeof arg1 === 'number') {
      return Vec3Math.set(arg1, arg2 as number, arg3 as number, GeoPoint.tempVec3);
    } else {
      return arg1;
    }
  }

  /**
   * Sets this point's latitude/longitude values.
   * @param other The point from which to take the new latitude/longitude values.
   * @returns this point, after it has been changed.
   */
  public set(other: LatLonInterface): this;
  /**
   * Sets this point's latitude/longitude values.
   * @param lat The new latitude.
   * @param lon The new longitude.
   * @returns this point, after it has been changed.
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
  public setFromCartesian(vec: Float64Array): this;
  /**
   * Sets this point's coordinate values from a cartesian position vector. By convention, in the cartesian coordinate
   * system the origin is at the center of the Earth, the positive x-axis passes through 0 degrees N, 0 degrees E, and
   * the positive z-axis passes through the north pole.
   * @param x - The x component of a position vector defining the new coordinates.
   * @param y - The y component of a position vector defining the new coordinates.
   * @param z - The z component of a position vector defining the new coordinates.
   * @returns This point, after it has been changed.
   */
  public setFromCartesian(x: number, y: number, z: number): this;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public setFromCartesian(arg1: Float64Array | number, arg2?: number, arg3?: number): this {
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

    const lat1 = this.lat * Avionics.Utils.DEG2RAD;
    const lat2 = other.lat * Avionics.Utils.DEG2RAD;
    const lon1 = this.lon * Avionics.Utils.DEG2RAD;
    const lon2 = other.lon * Avionics.Utils.DEG2RAD;

    // haversine formula
    const sinHalfDeltaLat = Math.sin((lat2 - lat1) / 2);
    const sinHalfDeltaLon = Math.sin((lon2 - lon1) / 2);
    const a = sinHalfDeltaLat * sinHalfDeltaLat + Math.cos(lat1) * Math.cos(lat2) * sinHalfDeltaLon * sinHalfDeltaLon;
    return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  /** @inheritdoc */
  public distanceRhumb(other: LatLonInterface): number;
  /** @inheritdoc */
  public distanceRhumb(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public distanceRhumb(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);


    const lat1 = this.lat * Avionics.Utils.DEG2RAD;
    const lat2 = other.lat * Avionics.Utils.DEG2RAD;
    const lon1 = this.lon * Avionics.Utils.DEG2RAD;
    const lon2 = other.lon * Avionics.Utils.DEG2RAD;
    const deltaLat = lat2 - lat1;
    let deltaLon = lon2 - lon1;

    const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
    const correction = GeoPoint.rhumbCorrection(deltaPsi, lat1, lat2);
    if (Math.abs(deltaLon) > Math.PI) {
      deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
    }
    return Math.sqrt(deltaLat * deltaLat + correction * correction * deltaLon * deltaLon);
  }

  /** @inheritdoc */
  public bearingTo(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingTo(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingTo(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return GeoPoint.calculateInitialBearing(this, other);
  }

  /** @inheritdoc */
  public bearingFrom(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingFrom(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingFrom(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);
    return (GeoPoint.calculateInitialBearing(this, other) + 180) % 360;
  }

  /** @inheritdoc */
  public bearingRhumb(other: LatLonInterface): number;
  /** @inheritdoc */
  public bearingRhumb(lat: number, lon: number): number;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public bearingRhumb(arg1: LatLonInterface | number, arg2?: number): number {
    const other = GeoPoint.asLatLonInterface(arg1, arg2);

    const lat1 = this.lat * Avionics.Utils.DEG2RAD;
    const lon1 = this.lon * Avionics.Utils.DEG2RAD;
    const lat2 = other.lat * Avionics.Utils.DEG2RAD;
    const lon2 = other.lon * Avionics.Utils.DEG2RAD;

    let deltaLon = lon2 - lon1;
    const deltaPsi = GeoPoint.deltaPsi(lat1, lat2);
    if (Math.abs(deltaLon) > Math.PI) {
      deltaLon += -Math.sign(deltaLon) * 2 * Math.PI;
    }
    return Math.atan2(deltaLon, deltaPsi) * Avionics.Utils.RAD2DEG;
  }

  /**
   * Offsets this point by an initial bearing and distance along a great circle.
   * @param bearing - the initial bearing (forward azimuth) by which to offset.
   * @param distance - the distance, in great-arc radians, by which to offset.
   * @param out - the GeoPoint to which to write the results. By default this point.
   * @returns the offset point.
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
   * @param bearing - the bearing by which to offset.
   * @param distance - the distance, in great-arc radians, by which to offset.
   * @param out - the GeoPoint to which to write the results. By default this point.
   * @returns the offset point.
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

  /**
   * Calculates the cartesian (x, y, z) representation of this point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param out - the vector array to which to write the result.
   * @returns the cartesian representation of this point.
   */
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

  /**
   * Copies this point.
   * @param to - an optional point to which to copy this point. If this argument is not supplied, a new GeoPoint object
   * will be created.
   * @returns a copy of this point.
   */
  public copy(to?: GeoPoint): GeoPoint {
    return to ? to.set(this.lat, this.lon) : new GeoPoint(this.lat, this.lon);
  }

  /**
   * Calculates the cartesian (x, y, z) representation of a point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param point - the point to convert.
   * @param out - the vector array to which to write the result.
   * @returns the cartesian representation of the point.
   */
  public static sphericalToCartesian(point: LatLonInterface, out: Float64Array): Float64Array;
  /**
   * Calculates the cartesian (x, y, z) representation of a point, in units of great-arc radians. By convention,
   * in the cartesian coordinate system the origin is at the center of the Earth, the positive x-axis passes through
   * 0 degrees N, 0 degrees E, and the positive z-axis passes through the north pole.
   * @param lat - the latitude of the point to convert.
   * @param lon - the longitude of the point to convert.
   * @param out - the vector array to which to write the result.
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
   * Converts an angle, in degrees, to an equivalent value in the range [-180, 180).
   * @param angle - an angle in degrees.
   * @returns the angle's equivalent in the range [-180, 180).
   */
  private static toPlusMinus180(angle: number): number {
    return ((angle % 360) + 540) % 360 - 180;
  }

  /**
   * Calculates the initial bearing (forward azimuth) from an origin point to a destination point.
   * @param origin - the origin point.
   * @param destination - the destination point.
   * @returns the initial bearing from the origin to destination.
   */
  private static calculateInitialBearing(origin: LatLonInterface, destination: LatLonInterface): number {
    const lat1 = origin.lat * Avionics.Utils.DEG2RAD;
    const lat2 = destination.lat * Avionics.Utils.DEG2RAD;
    const lon1 = origin.lon * Avionics.Utils.DEG2RAD;
    const lon2 = destination.lon * Avionics.Utils.DEG2RAD;
    const cosLat2 = Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * cosLat2 * Math.cos(lon2 - lon1);
    const y = Math.sin(lon2 - lon1) * cosLat2;
    const bearing = Math.atan2(y, x) * Avionics.Utils.RAD2DEG;
    return (bearing + 360) % 360; // enforce range [0, 360)
  }

  /**
   * Calculates the difference in isometric latitude from a pair of geodetic (geocentric) latitudes.
   * @param latRad1 - geodetic latitude 1, in radians.
   * @param latRad2 - geodetic latitude 2, in radians.
   * @returns the difference in isometric latitude from latitude 1 to latitude 2, in radians.
   */
  private static deltaPsi(latRad1: number, latRad2: number): number {
    return Math.log(Math.tan(latRad2 / 2 + Math.PI / 4) / Math.tan(latRad1 / 2 + Math.PI / 4));
  }

  /**
   * Calculates the rhumb correction factor between two latitudes.
   * @param deltaPsi - the difference in isometric latitude beween the two latitudes.
   * @param latRad1 - geodetic latitude 1, in radians.
   * @param latRad2 - geodetic latitude 2, in radians.
   * @returns the rhumb correction factor between the two latitudes.
   */
  private static rhumbCorrection(deltaPsi: number, latRad1: number, latRad2: number): number {
    return Math.abs(deltaPsi) > 1e-12 ? ((latRad2 - latRad1) / deltaPsi) : Math.cos(latRad1);
  }
}