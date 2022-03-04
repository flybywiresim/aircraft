/**
 * 2D vector mathematical opertaions.
 */
export class Vec2Math {
  /**
   * Gets the polar angle theta of a vector in radians.
   * @param vec - a vector.
   * @returns the polar angle theta of the vector.
   */
  public static theta(vec: Float64Array): number {
    return Math.atan2(vec[1], vec[0]);
  }

  /**
   * Sets the components of a vector.
   * @param x - the new x-component.
   * @param y - the new y-component.
   * @param vec - the vector to change.
   * @returns the vector after it has been changed.
   */
  public static set(x: number, y: number, vec: Float64Array): Float64Array {
    vec[0] = x;
    vec[1] = y;
    return vec;
  }

  /**
   * Sets the polar components of a vector.
   * @param r - the new length (magnitude).
   * @param theta - the new polar angle theta, in radians.
   * @param vec - the vector to change.
   * @returns the vector after it has been changed.
   */
  public static setFromPolar(r: number, theta: number, vec: Float64Array): Float64Array {
    vec[0] = r * Math.cos(theta);
    vec[1] = r * Math.sin(theta);
    return vec;
  }

  /**
   * Add one vector to another.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @param out The vector to write the results to.
   * @returns the vector sum.
   */
  public static add(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array {
    out[0] = v1[0] + v2[0];
    out[1] = v1[1] + v2[1];

    return out;
  }

  /**
   * Subtracts one vector from another.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @param out The vector to write the results to.
   * @returns the vector difference.
   */
  public static sub(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array {
    out[0] = v1[0] - v2[0];
    out[1] = v1[1] - v2[1];

    return out;
  }

  /**
   * Gets the dot product of two vectors.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @returns The dot product of the vectors.
   */
  public static dot(v1: Float64Array, v2: Float64Array): number {
    return v1[0] * v2[0] + v1[1] * v2[1];
  }

  /**
   * Multiplies a vector by a scalar.
   * @param v1 The vector to multiply.
   * @param scalar The scalar to apply.
   * @param out The vector to write the results to.
   * @returns The scaled vector.
   */
  public static multScalar(v1: Float64Array, scalar: number, out: Float64Array): Float64Array {
    out[0] = v1[0] * scalar;
    out[1] = v1[1] * scalar;

    return out;
  }

  /**
   * Gets the magnitude of a vector.
   * @param v1 The vector to get the magnitude for.
   * @returns the vector's magnitude.
   */
  public static abs(v1: Float64Array): number {
    return Math.hypot(v1[0], v1[1]);
  }

  /**
   * Normalizes the vector to a unit vector.
   * @param v1 The vector to normalize.
   * @param out The vector to write the results to.
   * @returns the normalized vector.
   */
  public static normalize(v1: Float64Array, out: Float64Array): Float64Array {
    const mag = Vec2Math.abs(v1);
    out[0] = v1[0] / mag;
    out[1] = v1[1] / mag;

    return out;
  }

  /**
   * Gets the normal of the supplied vector.
   * @param v1 The vector to get the normal for.
   * @param out The vector to write the results to.
   * @param counterClockwise Whether or not to get the counterclockwise normal.
   * @returns the normal vector.
   */
  public static normal(v1: Float64Array, out: Float64Array, counterClockwise = false): Float64Array {
    const x = v1[0];
    const y = v1[1];

    if (!counterClockwise) {
      out[0] = y;
      out[1] = -x;
    } else {
      out[0] = -y;
      out[1] = x;
    }

    return out;
  }

  /**
   * Gets the Euclidean distance between two vectors.
   * @param vec1 The first vector.
   * @param vec2 The second vector.
   * @returns the Euclidean distance between the two vectors.
   */
  public static distance(vec1: Float64Array, vec2: Float64Array): number {
    return Math.hypot(vec2[0] - vec1[0], vec2[1] - vec1[1]);
  }

  /**
   * Checks if two vectors are equal.
   * @param vec1 - the first vector.
   * @param vec2 - the second vector.
   * @returns whether the two vectors are equal.
   */
  public static equals(vec1: Float64Array, vec2: Float64Array): boolean {
    return vec1.length === vec2.length && vec1.every((element, index) => element === vec2[index]);
  }

  /**
   * Copies one vector to another.
   * @param from - the vector from which to copy.
   * @param to - the vector to which to copy.
   * @returns the changed vector.
   */
  public static copy(from: Float64Array, to: Float64Array): Float64Array {
    return Vec2Math.set(from[0], from[1], to);
  }
}

/**
 * 3D vector mathematical opertaions.
 */
export class Vec3Math {
  /**
   * Gets the spherical angle theta of a vector in radians.
   * @param vec - a vector.
   * @returns the spherical angle theta of the vector.
   */
  public static theta(vec: Float64Array): number {
    return Math.atan2(Math.hypot(vec[0], vec[1]), vec[2]);
  }

  /**
   * Gets the spherical angle phi of a vector in radians.
   * @param vec - a vector.
   * @returns the spherical angle phi of the vector.
   */
  public static phi(vec: Float64Array): number {
    return Math.atan2(vec[1], vec[0]);
  }

  /**
   * Sets the components of a vector.
   * @param x - the new x-component.
   * @param y - the new y-component.
   * @param z - the new z-component.
   * @param vec - the vector to change.
   * @returns the vector after it has been changed.
   */
  public static set(x: number, y: number, z: number, vec: Float64Array): Float64Array {
    vec[0] = x;
    vec[1] = y;
    vec[2] = z;
    return vec;
  }

  /**
   * Sets the spherical components of a vector.
   * @param r - the new length (magnitude).
   * @param theta - the new spherical angle theta, in radians.
   * @param phi - the new spherical angle phi, in radians.
   * @param vec - the vector to change.
   * @returns the vector after it has been changed.
   */
  public static setFromSpherical(r: number, theta: number, phi: number, vec: Float64Array): Float64Array {
    const sinTheta = Math.sin(theta);
    vec[0] = sinTheta * Math.cos(phi);
    vec[1] = sinTheta * Math.sin(phi);
    vec[2] = Math.cos(theta);
    return vec;
  }

  /**
   * Add one vector to another.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @param out The vector to write the results to.
   * @returns the vector sum.
   */
  public static add(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array {
    out[0] = v1[0] + v2[0];
    out[1] = v1[1] + v2[1];
    out[2] = v1[2] + v2[2];

    return out;
  }

  /**
   * Subtracts one vector from another.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @param out The vector to write the results to.
   * @returns the vector difference.
   */
  public static sub(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array {
    out[0] = v1[0] - v2[0];
    out[1] = v1[1] - v2[1];
    out[2] = v1[2] - v2[2];

    return out;
  }

  /**
   * Gets the dot product of two vectors.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @returns The dot product of the vectors.
   */
  public static dot(v1: Float64Array, v2: Float64Array): number {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  }

  /**
   * Gets the cross product of two vectors.
   * @param v1 - the first vector.
   * @param v2 - the second vector.
   * @param out - the vector to which to write the result.
   * @returns the cross product.
   */
  public static cross(v1: Float64Array, v2: Float64Array, out: Float64Array): Float64Array {
    const x1 = v1[0];
    const y1 = v1[1];
    const z1 = v1[2];
    const x2 = v2[0];
    const y2 = v2[1];
    const z2 = v2[2];

    out[0] = y1 * z2 - z1 * y2;
    out[1] = z1 * x2 - x1 * z2;
    out[2] = x1 * y2 - y1 * x2;
    return out;
  }

  /**
   * Multiplies a vector by a scalar.
   * @param v1 The vector to multiply.
   * @param scalar The scalar to apply.
   * @param out The vector to write the results to.
   * @returns The scaled vector.
   */
  public static multScalar(v1: Float64Array, scalar: number, out: Float64Array): Float64Array {
    out[0] = v1[0] * scalar;
    out[1] = v1[1] * scalar;
    out[2] = v1[2] * scalar;

    return out;
  }

  /**
   * Gets the magnitude of a vector.
   * @param v1 The vector to get the magnitude for.
   * @returns the vector's magnitude.
   */
  public static abs(v1: Float64Array): number {
    return Math.hypot(v1[0], v1[1], v1[2]);
  }

  /**
   * Normalizes the vector to a unit vector.
   * @param v1 The vector to normalize.
   * @param out The vector to write the results to.
   * @returns the normalized vector.
   */
  public static normalize(v1: Float64Array, out: Float64Array): Float64Array {
    const mag = Vec3Math.abs(v1);
    out[0] = v1[0] / mag;
    out[1] = v1[1] / mag;
    out[2] = v1[2] / mag;

    return out;
  }

  /**
   * Gets the Euclidean distance between two vectors.
   * @param vec1 The first vector.
   * @param vec2 The second vector.
   * @returns the Euclidean distance between the two vectors.
   */
  public static distance(vec1: Float64Array, vec2: Float64Array): number {
    return Math.hypot(vec2[0] - vec1[0], vec2[1] - vec1[0], vec2[2] - vec1[2]);
  }

  /**
   * Checks if two vectors are equal.
   * @param vec1 - the first vector.
   * @param vec2 - the second vector.
   * @returns whether the two vectors are equal.
   */
  public static equals(vec1: Float64Array, vec2: Float64Array): boolean {
    return vec1.length === vec2.length && vec1.every((element, index) => element === vec2[index]);
  }

  /**
   * Copies one vector to another.
   * @param from - the vector from which to copy.
   * @param to - the vector to which to copy.
   * @returns the changed vector.
   */
  public static copy(from: Float64Array, to: Float64Array): Float64Array {
    return Vec3Math.set(from[0], from[1], from[2], to);
  }
}