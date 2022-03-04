import { UnitType } from '../math/NumberUnit';
import { Vec2Math } from '../math/VecMath';
import { LatLonInterface } from './GeoInterfaces';
import { GeoPoint, GeoPointReadOnly } from './GeoPoint';

/**
 * A geographic projection.
 */
export interface GeoProjection {
  /**
   * Gets the geographic center of this projection.
   * @returns the geographic center of this projection.
   */
  getCenter(): GeoPointReadOnly;

  /**
   * Gets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
   * be projected to a distance of one pixel.
   * @returns the nominal scale factor of this projection.
   */
  getScaleFactor(): number;

  /**
   * Gets the pre-projection rotation of this projection as a vector ([lambda, phi]). The rotation angles are
   * expressed in radians.
   * @returns the pre-projection rotation of this projection.
   */
  getPreRotation(): Float64Array;

  /**
   * Gets the post-projection (planar) translation of this projection, in pixels.
   * @returns the post-projection translation of this projection.
   */
  getTranslation(): Float64Array;

  /**
   * Gets the post-projection (planar) rotation angle of this projection in radians.
   * @returns the post-projection rotation angle of this projection.
   */
  getPostRotation(): number;

  /**
   * Checks whether this projection reflects the projected coordinate system across the x-axis.
   * @returns whether this projection reflects the projected coordinate system across the x-axis.
   */
  getReflectY(): boolean;

  /**
   * Projects a set of lat/lon coordinates.
   * @param point - the point to project.
   * @param out - the vector to which to write the result.
   * @returns the projected point, as a vector.
   */
  project(point: LatLonInterface | Float64Array, out: Float64Array): Float64Array;

  /**
   * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
   * is the equal to that described by a 2D position vector.
   * @param vec - the 2D position vector describing the location of the projected coordinates.
   * @param out - the point to which to write the result.
   * @returns the inverted point.
   */
  invert<T extends GeoPoint | Float64Array>(vec: Float64Array, out: T): T;
}

/**
 * A mutable geographic projection.
 */
export interface MutableGeoProjection extends GeoProjection {
  /**
   * Sets the geographic center of this projection. The center point of the projection is projected to the origin,
   * before any post-projection transformations are applied.
   * @param point - the new center point.
   * @returns this projection, after it has been changed.
   */
  setCenter(point: LatLonInterface): this;

  /**
   * Sets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
   * be projected to a distance of one pixel.
   * @param factor - the new nominal scale factor.
   * @returns this projection, after it has been changed.
   */
  setScaleFactor(factor: number): this;

  /**
   * Sets the pre-projection (spherical) rotation of this projection.
   * @param vec - the pre-projection rotation, as a vector ([lambda, phi]). The rotation angles should be expressed in
   * radians.
   * @returns this projection, after it has been changed.
   */
  setPreRotation(vec: Float64Array): this;

  /**
   * Sets the post-projection (planar) translation of this projection.
   * @param vec - the new post-projection translation, in pixels.
   * @returns this projection, after it has been changed.
   */
  setTranslation(vec: Float64Array): this;

  /**
   * Sets the post-projection (planar) rotation of this projection.
   * @param rotation - the new post-projection rotation angle, in radians.
   * @returns this projection, after it has been changed.
   */
  setPostRotation(rotation: number): this;

  /**
   * Sets whether this reflection should reflect the projected coordinate system across the x-axis. Setting this value
   * to true is useful in the situation where the projected coordinate system should use a positive-y-axis-down
   * convention.
   * @param val True if reflection is desired, false otherwise.
   * @returns this projection, after it has been changed.
   */
  setReflectY(val: boolean): this;

  /**
   * Copies all projection parameters from another projection. The parameters copied are: center, pre-projection
   * rotation angles, scale factor, post-projection translation, post-projection rotation angle, and reflectY.
   * @param other the projection from which to copy parameters.
   * @returns this projection, after it has been changed.
   */
  copyParametersFrom(other: GeoProjection): this;
}

/**
 * A partial implementation of a MutableGeoProjection. Subclasses should use the projectRaw() and invertRaw() methods
 * to define the type of projection to be implemented.
 */
abstract class AbstractGeoProjection implements MutableGeoProjection {
  private static tempVec2 = new Float64Array(2);

  protected center = new GeoPoint(0, 0);
  protected centerTranslation = new Float64Array(2);
  protected scaleFactor = UnitType.GA_RADIAN.convertTo(1, UnitType.NMILE) as number; // 1 pixel = 1 nautical mile
  protected preRotation = new Float64Array(2);
  protected translation = new Float64Array(2);
  protected postRotation = 0;
  protected rotationSin = 0;
  protected rotationCos = 1;
  protected reflectY = 1;

  /**
   * Gets the geographic center of this projection.
   * @returns the geographic center of this projection.
   */
  public getCenter(): GeoPointReadOnly {
    return this.center.readonly;
  }

  /**
   * Gets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
   * be projected to a distance of one pixel.
   * @returns the nominal scale factor of this projection.
   */
  public getScaleFactor(): number {
    return this.scaleFactor;
  }

  /**
   * Gets the pre-projection rotation of this projection as a vector ([lambda, phi]). The rotation angles are
   * expressed in radians.
   * @returns the pre-projection rotation of this projection.
   */
  public getPreRotation(): Float64Array {
    return this.preRotation;
  }

  /**
   * Gets the post-projection (planar) translation of this projection, in pixels.
   * @returns the post-projection translation of this projection.
   */
  public getTranslation(): Float64Array {
    return this.translation;
  }

  /**
   * Gets the post-projection (planar) rotation angle of this projection in radians.
   * @returns the post-projection rotation angle of this projection.
   */
  public getPostRotation(): number {
    return this.postRotation;
  }

  /**
   * Checks whether this projection reflects the projected coordinate system across the x-axis.
   * @returns whether this projection reflects the projected coordinate system across the x-axis.
   */
  public getReflectY(): boolean {
    return this.reflectY === -1;
  }

  /**
   * Sets the geographic center of this projection. The center point of the projection is projected to the origin,
   * before any post-projection transformations are applied.
   * @param point - the new center point.
   * @returns this projection, after it has been changed.
   */
  public setCenter(point: LatLonInterface): this {
    this.center.set(point);
    this.updateCenterTranslation();
    return this;
  }

  /**
   * Sets the nominal scale factor of this projection. At a scale factor of 1, a distance of one great-arc radian will
   * be projected to a distance of one pixel.
   * @param factor - the new nominal scale factor.
   * @returns this projection, after it has been changed.
   */
  public setScaleFactor(factor: number): this {
    this.scaleFactor = factor;
    return this;
  }

  /**
   * Sets the pre-projection (spherical) rotation of this projection.
   * @param vec - the pre-projection rotation, as a vector ([lambda, phi]). The rotation angles should be expressed in
   * radians.
   * @returns this projection, after it has been changed.
   */
  public setPreRotation(vec: Float64Array): this {
    this.preRotation.set(vec);
    this.updateCenterTranslation();
    return this;
  }

  /**
   * Sets the post-projection (planar) translation of this projection.
   * @param vec - the new post-projection translation, in pixels.
   * @returns this projection, after it has been changed.
   */
  public setTranslation(vec: Float64Array): this {
    this.translation.set(vec);
    return this;
  }

  /**
   * Sets the post-projection (planar) rotation of this projection.
   * @param rotation - the new post-projection rotation angle, in radians.
   * @returns this projection, after it has been changed.
   */
  public setPostRotation(rotation: number): this {
    this.postRotation = rotation;
    this.rotationCos = Math.cos(rotation);
    this.rotationSin = Math.sin(rotation);
    return this;
  }

  /**
   * Sets whether this reflection should reflect the projected coordinate system across the x-axis. Setting this value
   * to true is useful in the situation where the projected coordinate system should use a positive-y-axis-down
   * convention.
   * @param val True if reflection is desired, false otherwise.
   * @returns this projection, after it has been changed.
   */
  public setReflectY(val: boolean): this {
    this.reflectY = val ? -1 : 1;
    return this;
  }

  /**
   * Copies all projection parameters from another projection. The parameters copied are: center, pre-projection
   * rotation angles, scale factor, post-projection translation, and post-projection rotation angle.
   * @param other the projection from which to copy parameters.
   * @returns this projection, after it has been changed.
   */
  public copyParametersFrom(other: GeoProjection): this {
    return this.setCenter(other.getCenter())
      .setPreRotation(other.getPreRotation())
      .setScaleFactor(other.getScaleFactor())
      .setTranslation(other.getTranslation())
      .setPostRotation(other.getPostRotation())
      .setReflectY(other.getReflectY());
  }

  /**
   * Updates the translation vector to move the center of this projection to the origin.
   */
  protected updateCenterTranslation(): void {
    const centerArray = AbstractGeoProjection.tempVec2;
    centerArray[0] = this.center.lon;
    centerArray[1] = this.center.lat;
    this.preRotateForward(centerArray, centerArray);
    this.projectRaw(centerArray, this.centerTranslation);
  }

  /**
   * Applies a raw projection.
   * @param vec - a [lon, lat] vector describing the geographic point to project.
   * @param out - a 2D vector to which to write the result.
   * @returns the projected point.
   */
  protected abstract projectRaw(vec: Float64Array, out: Float64Array): Float64Array;

  /**
   * Inverts a raw projection.
   * @param vec - a 2D vector describing the projected point to invert.
   * @param out - a 2D vector to which to write the result.
   * @returns the inverted point.
   */
  protected abstract invertRaw(vec: Float64Array, out: Float64Array): Float64Array;

  /**
   * Applies a forward rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
   * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
   * @param out - the vector to which to write the result.
   * @returns the rotated lat/lon coordinates.
   */
  protected preRotateForward(vec: Float64Array, out: Float64Array): Float64Array {
    const phi = this.preRotation[1];
    const lambda = this.preRotation[0];

    if (phi === 0 && lambda === 0) {
      out.set(vec);
      return out;
    }

    const lat = vec[1];
    const lon = vec[0];

    const rotatedLon = ((lon + lambda * Avionics.Utils.RAD2DEG) % 360 + 540) % 360 - 180; // enforce [-180, 180)

    if (phi === 0) {
      return Vec2Math.set(rotatedLon, lat, out);
    }

    const latRad = lat * Avionics.Utils.DEG2RAD;
    const rotatedLonRad = rotatedLon * Avionics.Utils.DEG2RAD;

    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);

    const cosLat = Math.cos(latRad);
    const x = Math.cos(rotatedLonRad) * cosLat;
    const y = Math.sin(rotatedLonRad) * cosLat;
    const z = Math.sin(latRad);

    return Vec2Math.set(Math.atan2(y, x * cosPhi - z * sinPhi) * Avionics.Utils.RAD2DEG, Math.asin(z * cosPhi + x * sinPhi) * Avionics.Utils.RAD2DEG, out);
  }

  /**
   * Applies a reverse rotation to a set of lat/lon coordinates using this projection's pre-projection rotation angles.
   * @param vec - the lat/lon coordinates to rotate, as a vector ([long, lat]).
   * @param out - the vector to which to write the result.
   * @returns the rotated lat/lon coordinates.
   */
  protected preRotateReverse(vec: Float64Array, out: Float64Array): Float64Array {
    const phi = this.preRotation[1];
    const lambda = this.preRotation[0];

    if (phi === 0 && lambda === 0) {
      out.set(vec);
      return out;
    }

    const lat = vec[1];
    const lon = vec[0];

    let rotatedLat = lat;
    let rotatedLon = lon;
    if (phi !== 0) {
      const latRad = lat * Avionics.Utils.DEG2RAD;
      const lonRad = lon * Avionics.Utils.DEG2RAD;

      const cosPhi = Math.cos(phi);
      const sinPhi = Math.sin(phi);

      const cosLat = Math.cos(latRad);
      const x = Math.cos(lonRad) * cosLat;
      const y = Math.sin(lonRad) * cosLat;
      const z = Math.sin(latRad);

      rotatedLat = Math.asin(z * cosPhi - x * sinPhi) * Avionics.Utils.RAD2DEG;
      rotatedLon = Math.atan2(y, x * cosPhi + z * sinPhi) * Avionics.Utils.RAD2DEG;
    }

    rotatedLon = ((rotatedLon - lambda * Avionics.Utils.RAD2DEG) % 360 + 540) % 360 - 180; // enforce [-180, 180)

    return Vec2Math.set(rotatedLon, rotatedLat, out);
  }

  /**
   * Projects a set of lat/lon coordinates.
   * @param point - the point to project.
   * @param out - the vector to which to write the result.
   * @returns the projected point, as a vector.
   */
  public project(point: LatLonInterface | Float64Array, out: Float64Array): Float64Array {
    if (point instanceof Float64Array) {
      out.set(point);
    } else {
      out[0] = point.lon;
      out[1] = point.lat;
    }

    this.preRotateForward(out, out);
    this.projectRaw(out, out);

    // translate projected center point to origin
    out[0] -= this.centerTranslation[0];
    out[1] -= this.centerTranslation[1];

    // apply y-reflection
    out[1] *= this.reflectY;

    // apply scale factor
    out[0] *= this.scaleFactor;
    out[1] *= this.scaleFactor;

    // apply post-projection rotation
    const x = out[0];
    const y = out[1];
    out[0] = x * this.rotationCos - y * this.rotationSin;
    out[1] = x * this.rotationSin + y * this.rotationCos;

    // apply post-projection translation
    out[0] += this.translation[0];
    out[1] += this.translation[1];

    return out;
  }

  /**
   * Inverts a set of projected coordinates. This method will determine the geographic point whose projected location
   * is the equal to that described by a 2D position vector.
   * @param vec - the 2D position vector describing the location of the projected coordinates.
   * @param out - the point to which to write the result.
   * @returns the inverted point.
   */
  public invert<T extends GeoPoint | Float64Array>(vec: Float64Array, out: T): T {
    const projected = AbstractGeoProjection.tempVec2;
    projected.set(vec);

    // invert post-projection translation
    projected[0] -= this.translation[0];
    projected[1] -= this.translation[1];

    // invert post-projection rotation
    const x = projected[0];
    const y = projected[1];
    projected[0] = x * this.rotationCos + y * this.rotationSin;
    projected[1] = -x * this.rotationSin + y * this.rotationCos;

    // invert scale factor
    projected[0] /= this.scaleFactor;
    projected[1] /= this.scaleFactor;

    // invert y-reflection
    projected[1] *= this.reflectY;

    // translate projected center point to default projected position
    projected[0] += this.centerTranslation[0];
    projected[1] += this.centerTranslation[1];

    const inverted = this.invertRaw(projected, projected);
    this.preRotateReverse(inverted, inverted);

    if (out instanceof Float64Array) {
      out.set(inverted);
      return out;
    } else {
      return (out as GeoPoint).set(inverted[1], inverted[0]) as T & GeoPoint;
    }
  }
}

/**
 * A Mercator projection.
 */
export class MercatorProjection extends AbstractGeoProjection {
  /**
   * Applies a raw projection.
   * @param vec - a [lon, lat] vector describing the geographic point to project.
   * @param out - a 2D vector to which to write the result.
   * @returns the projected point.
   */
  protected projectRaw(vec: Float64Array, out: Float64Array): Float64Array {
    out[0] = vec[0] * Avionics.Utils.DEG2RAD;
    out[1] = Math.log(Math.tan((90 + vec[1]) * Avionics.Utils.DEG2RAD / 2));
    return out;
  }

  /**
   * Inverts a raw projection.
   * @param vec - a 2D vector describing the projected point to invert.
   * @param out - a 2D vector to which to write the result.
   * @returns the inverted point.
   */
  protected invertRaw(vec: Float64Array, out: Float64Array): Float64Array {
    out[0] = vec[0] * Avionics.Utils.RAD2DEG;
    out[1] = 2 * Math.atan(Math.exp(vec[1])) * Avionics.Utils.RAD2DEG - 90;
    return out;
  }
}

/**
 * An orthographic projection.
 */
export class OrthographicProjection extends AbstractGeoProjection {
  /**
   * Applies a raw projection.
   * @param vec - a [lon, lat] vector describing the geographic point to project.
   * @param out - a 2D vector to which to write the result.
   * @returns the projected point.
   */
  protected projectRaw(vec: Float64Array, out: Float64Array): Float64Array {
    const lonRad = vec[0] * Avionics.Utils.DEG2RAD;
    const latRad = vec[1] * Avionics.Utils.DEG2RAD;
    out[0] = Math.cos(latRad) * Math.sin(lonRad);
    out[1] = Math.sin(latRad);
    return out;
  }

  /**
   * Inverts a raw projection.
   * @param vec - a 2D vector describing the projected point to invert.
   * @param out - a 2D vector to which to write the result.
   * @returns the inverted point.
   */
  protected invertRaw(vec: Float64Array, out: Float64Array): Float64Array {
    const x = vec[0];
    const y = vec[1];
    const rho = Math.hypot(x, y);
    const c = Math.asin(rho);
    const sinC = Math.sin(c);
    const cosC = Math.cos(c);

    out[0] = Math.atan2(x * sinC, rho * cosC) * Avionics.Utils.RAD2DEG;
    out[1] = Math.asin(rho === 0 ? rho : y * sinC / rho) * Avionics.Utils.RAD2DEG;
    return out;
  }
}