import { Subject } from '../Subject';
import { Vec2Math, Vec3Math } from './VecMath';

/**
 * A Subject which allows a 2D vector to be observed.
 */
export class Vec2Subject extends Subject<Float64Array> {
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: Float64Array): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param x The x component of the new value.
   * @param y The y component of the new value.
   */
  public set(x: number, y: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: Float64Array | number, arg2?: number): void {
    let x, y;
    if (typeof arg1 === 'number') {
      x = arg1;
      y = arg2 as number;
    } else {
      x = arg1[0];
      y = arg1[1];
    }

    const equals = x === this.value[0] && y === this.value[1];
    if (!equals) {
      Vec2Math.set(x, y, this.value);
      this.notify();
    }
  }

  /**
   * Creates a Vec2Subject.
   * @param initialVal The initial value.
   * @returns A Vec2Subject.
   */
  public static createFromVector(initialVal: Float64Array): Vec2Subject {
    return new Vec2Subject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
  }
}

/**
 * A Subject which allows a 3D vector to be observed.
 */
export class Vec3Subject extends Subject<Float64Array> {
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: Float64Array): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param x The x component of the new value.
   * @param y The y component of the new value.
   */
  public set(x: number, y: number, z: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: Float64Array | number, arg2?: number, arg3?: number): void {
    let x, y, z;
    if (typeof arg1 === 'number') {
      x = arg1;
      y = arg2 as number;
      z = arg3 as number;
    } else {
      x = arg1[0];
      y = arg1[1];
      z = arg1[2];
    }

    const equals = x === this.value[0] && y === this.value[1] && z === this.value[2];
    if (!equals) {
      Vec3Math.set(x, y, z, this.value);
      this.notify();
    }
  }

  /**
   * Creates a Vec3Subject.
   * @param initialVal The initial value.
   * @returns A Vec3Subject.
   */
  public static createFromVector(initialVal: Float64Array): Vec3Subject {
    return new Vec3Subject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
  }
}

/**
 * A Subject which allows a N-D vector to be observed.
 */
export class VecNSubject extends Subject<Float64Array> {
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: Float64Array): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param args The individual components of the new value.
   */
  public set(...args: number[]): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: Float64Array | number, ...args: number[]): void {
    let array;
    if (typeof arg1 === 'number') {
      array = args;
      args.unshift(arg1);
    } else {
      array = arg1;
    }

    if (array.length > this.value.length) {
      throw new RangeError(`VecNSubject: Cannot set ${array.length} components on a vector of length ${this.value.length}`);
    }

    let equals = true;
    const len = array.length;
    for (let i = 0; i < len; i++) {
      if (array[i] !== this.value[i]) {
        equals = false;
        break;
      }
    }

    if (!equals) {
      this.value.set(array);
      this.notify();
    }
  }

  /**
   * Creates a VecNSubject.
   * @param initialVal The initial value.
   * @returns A VecNSubject.
   */
  public static createFromVector(initialVal: Float64Array): VecNSubject {
    return new VecNSubject(initialVal, Subject.DEFAULT_EQUALITY_FUNC);
  }
}