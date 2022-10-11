import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { MutableSubscribable } from '../sub/Subscribable';
import { ReadonlyFloat64Array, Vec2Math, Vec3Math } from './VecMath';

/**
 * A Subject which allows a 2D vector to be observed.
 */
export class Vec2Subject extends AbstractSubscribable<ReadonlyFloat64Array>
  implements MutableSubscribable<ReadonlyFloat64Array, Readonly<ArrayLike<number>>> {

  /** @inheritdoc */
  public readonly isMutableSubscribable = true;

  /**
   * Constructor.
   * @param value The value of this subject.
   */
  private constructor(private readonly value: Float64Array) {
    super();
  }

  /**
   * Creates a Vec2Subject.
   * @param initialVal The initial value.
   * @returns A Vec2Subject.
   */
  public static create(initialVal: Float64Array): Vec2Subject {
    return new Vec2Subject(initialVal);
  }

  /**
   * Creates a Vec2Subject.
   * @param initialVal The initial value.
   * @returns A Vec2Subject.
   * @deprecated Use `Vec2Subject.create()` instead.
   */
  public static createFromVector(initialVal: Float64Array): Vec2Subject {
    return new Vec2Subject(initialVal);
  }

  /** @inheritdoc */
  public get(): ReadonlyFloat64Array {
    return this.value;
  }

  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: Readonly<ArrayLike<number>>): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param x The x component of the new value.
   * @param y The y component of the new value.
   */
  public set(x: number, y: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: Readonly<ArrayLike<number>> | number, arg2?: number): void {
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
}

/**
 * A Subject which allows a 3D vector to be observed.
 */
export class Vec3Subject extends AbstractSubscribable<ReadonlyFloat64Array>
  implements MutableSubscribable<ReadonlyFloat64Array, Readonly<ArrayLike<number>>> {

  /** @inheritdoc */
  public readonly isMutableSubscribable = true;

  /**
   * Constructor.
   * @param value The value of this subject.
   */
  private constructor(private readonly value: Float64Array) {
    super();
  }

  /**
   * Creates a Vec3Subject.
   * @param initialVal The initial value.
   * @returns A Vec3Subject.
   */
  public static create(initialVal: Float64Array): Vec3Subject {
    return new Vec3Subject(initialVal);
  }

  /**
   * Creates a Vec3Subject.
   * @param initialVal The initial value.
   * @returns A Vec3Subject.
   * @deprecated Use `Vec3Subject.create()` instead.
   */
  public static createFromVector(initialVal: Float64Array): Vec3Subject {
    return new Vec3Subject(initialVal);
  }

  /** @inheritdoc */
  public get(): ReadonlyFloat64Array {
    return this.value;
  }

  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   */
  public set(value: Readonly<ArrayLike<number>>): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param x The x component of the new value.
   * @param y The y component of the new value.
   */
  public set(x: number, y: number, z: number): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: Readonly<ArrayLike<number>> | number, arg2?: number, arg3?: number): void {
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
      Vec3Math.set(x, y, z, this.value as Float64Array);
      this.notify();
    }
  }
}

/**
 * A Subject which allows a N-D vector to be observed.
 */
export class VecNSubject extends AbstractSubscribable<ReadonlyFloat64Array>
  implements MutableSubscribable<ReadonlyFloat64Array, Readonly<ArrayLike<number>>> {

  /** @inheritdoc */
  public readonly isMutableSubscribable = true;

  /**
   * Constructor.
   * @param value The value of this subject.
   */
  private constructor(private readonly value: Float64Array) {
    super();
  }

  /**
   * Creates a VecNSubject.
   * @param initialVal The initial value.
   * @returns A VecNSubject.
   */
  public static create(initialVal: Float64Array): VecNSubject {
    return new VecNSubject(initialVal);
  }

  /**
   * Creates a VecNSubject.
   * @param initialVal The initial value.
   * @returns A VecNSubject.
   * @deprecated Use `VecNSubject.create()` instead.
   */
  public static createFromVector(initialVal: Float64Array): VecNSubject {
    return new VecNSubject(initialVal);
  }

  /** @inheritdoc */
  public get(): ReadonlyFloat64Array {
    return this.value;
  }

  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param value The new value.
   * @throws Error if the length of `value` is greater than the length of this subject's value.
   */
  public set(value: Readonly<ArrayLike<number>>): void;
  /**
   * Sets the new value and notifies the subscribers if the value changed.
   * @param args The individual components of the new value.
   * @throws Error if the number of components of the new value is greater than the length of this subject's value.
   */
  public set(...args: number[]): void;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public set(arg1: Readonly<ArrayLike<number>> | number, ...args: number[]): void {
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
      (this.value as Float64Array).set(array);
      this.notify();
    }
  }
}