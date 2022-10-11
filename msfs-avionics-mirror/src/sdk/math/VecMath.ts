/**
 * A readonly version of a {@link Float64Array}.
 */
export type ReadonlyFloat64Array = Readonly<Omit<Float64Array, 'set' | 'copyWithin' | 'sort'>>;

/**
 * 2D vector mathematical operations.
 */
export class Vec2Math {
  /**
   * Creates a 2D vector initialized to `[0, 0]`.
   * @returns A new 2D vector initialized to `[0, 0]`.
   */
  public static create(): Float64Array
  /**
   * Creates a 2D vector with specified x- and y- components.
   * @param x The x-component of the new vector.
   * @param y The y-component of the new vector.
   * @returns A new 2D vector with the specified components.
   */
  public static create(x: number, y: number): Float64Array
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create(x?: number, y?: number): Float64Array {
    const vec = new Float64Array(2);
    if (x !== undefined && y !== undefined) {
      vec[0] = x;
      vec[1] = y;
    }
    return vec;
  }

  /**
   * Gets the polar angle theta of a vector in radians.
   * @param vec - a vector.
   * @returns the polar angle theta of the vector.
   */
  public static theta(vec: ReadonlyFloat64Array): number {
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
  public static add(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static sub(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static dot(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array): number {
    return v1[0] * v2[0] + v1[1] * v2[1];
  }

  /**
   * Multiplies a vector by a scalar.
   * @param v1 The vector to multiply.
   * @param scalar The scalar to apply.
   * @param out The vector to write the results to.
   * @returns The scaled vector.
   */
  public static multScalar(v1: ReadonlyFloat64Array, scalar: number, out: Float64Array): Float64Array {
    out[0] = v1[0] * scalar;
    out[1] = v1[1] * scalar;

    return out;
  }

  /**
   * Gets the magnitude of a vector.
   * @param v1 The vector to get the magnitude for.
   * @returns the vector's magnitude.
   */
  public static abs(v1: ReadonlyFloat64Array): number {
    return Math.hypot(v1[0], v1[1]);
  }

  /**
   * Normalizes the vector to a unit vector.
   * @param v1 The vector to normalize.
   * @param out The vector to write the results to.
   * @returns the normalized vector.
   */
  public static normalize(v1: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static normal(v1: ReadonlyFloat64Array, out: Float64Array, counterClockwise = false): Float64Array {
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
  public static distance(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): number {
    return Math.hypot(vec2[0] - vec1[0], vec2[1] - vec1[1]);
  }

  /**
   * Checks if two vectors are equal.
   * @param vec1 The first vector.
   * @param vec2 The second vector.
   * @returns Whether the two vectors are equal.
   */
  public static equals(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): boolean {
    return vec1[0] === vec2[0] && vec1[1] === vec2[1];
  }

  /**
   * Copies one vector to another.
   * @param from The vector from which to copy.
   * @param to The vector to which to copy.
   * @returns The changed vector.
   */
  public static copy(from: ReadonlyFloat64Array, to: Float64Array): Float64Array {
    return Vec2Math.set(from[0], from[1], to);
  }
}

/**
 * 3D vector mathematical operations.
 */
export class Vec3Math {
  /**
   * Creates a 3D vector initialized to `[0, 0, 0]`.
   * @returns A new 3D vector initialized to `[0, 0, 0]`.
   */
  public static create(): Float64Array
  /**
   * Creates a 3D vector with specified x-, y-, and z- components.
   * @param x The x-component of the new vector.
   * @param y The y-component of the new vector.
   * @param z The z-component of the new vector.
   * @returns A new 3D vector with the specified components.
   */
  public static create(x: number, y: number, z: number): Float64Array
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create(x?: number, y?: number, z?: number): Float64Array {
    const vec = new Float64Array(3);
    if (x !== undefined && y !== undefined && z !== undefined) {
      vec[0] = x;
      vec[1] = y;
      vec[2] = z;
    }
    return vec;
  }

  /**
   * Gets the spherical angle theta of a vector in radians.
   * @param vec - a vector.
   * @returns the spherical angle theta of the vector.
   */
  public static theta(vec: ReadonlyFloat64Array): number {
    return Math.atan2(Math.hypot(vec[0], vec[1]), vec[2]);
  }

  /**
   * Gets the spherical angle phi of a vector in radians.
   * @param vec - a vector.
   * @returns the spherical angle phi of the vector.
   */
  public static phi(vec: ReadonlyFloat64Array): number {
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
  public static add(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static sub(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static dot(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array): number {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  }

  /**
   * Gets the cross product of two vectors.
   * @param v1 - the first vector.
   * @param v2 - the second vector.
   * @param out - the vector to which to write the result.
   * @returns the cross product.
   */
  public static cross(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static multScalar(v1: ReadonlyFloat64Array, scalar: number, out: Float64Array): Float64Array {
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
  public static abs(v1: ReadonlyFloat64Array): number {
    return Math.hypot(v1[0], v1[1], v1[2]);
  }

  /**
   * Normalizes the vector to a unit vector.
   * @param v1 The vector to normalize.
   * @param out The vector to write the results to.
   * @returns the normalized vector.
   */
  public static normalize(v1: ReadonlyFloat64Array, out: Float64Array): Float64Array {
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
  public static distance(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): number {
    return Math.hypot(vec2[0] - vec1[0], vec2[1] - vec1[0], vec2[2] - vec1[2]);
  }

  /**
   * Checks if two vectors are equal.
   * @param vec1 The first vector.
   * @param vec2 The second vector.
   * @returns Whether the two vectors are equal.
   */
  public static equals(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): boolean {
    return vec1[0] === vec2[0] && vec1[1] === vec2[1] && vec1[2] === vec2[2];
  }

  /**
   * Copies one vector to another.
   * @param from The vector from which to copy.
   * @param to The vector to which to copy.
   * @returns the changed vector.
   */
  public static copy(from: ReadonlyFloat64Array, to: Float64Array): Float64Array {
    return Vec3Math.set(from[0], from[1], from[2], to);
  }
}

/**
 * N-dimensional vector mathematical operations.
 */
export class VecNMath {
  /**
   * Creates an N-dimensional vector with all components initialized to `0`.
   * @param length The length of the new vector.
   * @returns A new N-dimensional vector with the specified length and all components initialized to `0`.
   */
  public static create(length: number): Float64Array
  /**
   * Creates an N-dimensional vector with specified components.
   * @param length The length of the new vector.
   * @param components The components of the new vector.
   * @returns A new N-dimensional vector with the specified length and components.
   */
  public static create(length: number, ...components: number[]): Float64Array
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create(length: number, ...components: number[]): Float64Array {
    const vec = new Float64Array(length);
    for (let i = 0; i < length && components.length; i++) {
      vec[i] = components[i];
    }
    return vec;
  }

  /**
   * Sets the components of a vector.
   * @param vec The vector to change.
   * @param components The new components.
   * @returns The vector after it has been changed.
   */
  public static set(vec: Float64Array, ...components: number[]): Float64Array {
    for (let i = 0; i < vec.length && components.length; i++) {
      vec[i] = components[i];
    }
    return vec;
  }

  /**
   * Gets the magnitude of a vector.
   * @param vec The vector to get the magnitude for.
   * @returns The vector's magnitude.
   */
  public static abs(vec: ReadonlyFloat64Array): number {
    return Math.hypot(...vec);
  }

  /**
   * Gets the dot product of two vectors.
   * @param v1 The first vector.
   * @param v2 The second vector.
   * @returns The dot product of the vectors.
   * @throws Error if the two vectors are of unequal lengths.
   */
  public static dot(v1: ReadonlyFloat64Array, v2: ReadonlyFloat64Array): number {
    if (v1.length !== v2.length) {
      throw new Error(`VecNMath: cannot compute dot product of two vectors of unequal length (${v1.length} and ${v2.length})`);
    }

    let dot = 0;
    const len = v1.length;
    for (let i = 0; i < len; i++) {
      dot += v1[i] * v2[i];
    }

    return dot;
  }

  /**
   * Normalizes a vector to a unit vector.
   * @param v1 The vector to normalize.
   * @param out The vector to write the results to.
   * @returns The normalized vector.
   */
  public static normalize(v1: ReadonlyFloat64Array, out: Float64Array): Float64Array {
    const mag = Vec3Math.abs(v1);

    const len = v1.length;
    for (let i = 0; i < len; i++) {
      out[i] = v1[i] / mag;
    }

    return out;
  }

  /**
   * Checks if two vectors are equal.
   * @param vec1 The first vector.
   * @param vec2 The second vector.
   * @returns Whether the two vectors are equal.
   */
  public static equals(vec1: ReadonlyFloat64Array, vec2: ReadonlyFloat64Array): boolean {
    return vec1.length === vec2.length && vec1.every((element, index) => element === vec2[index]);
  }

  /**
   * Copies one vector to another.
   * @param from The vector from which to copy.
   * @param to The vector to which to copy.
   * @returns The changed vector.
   * @throws Error if the vectors are of unequal lengths.
   */
  public static copy(from: ReadonlyFloat64Array, to: Float64Array): Float64Array {
    if (from.length !== to.length) {
      throw new Error(`VecNMath: cannot copy a vector of length ${from.length} to a vector of length ${to.length}`);
    }

    to.set(from);

    return to;
  }
}