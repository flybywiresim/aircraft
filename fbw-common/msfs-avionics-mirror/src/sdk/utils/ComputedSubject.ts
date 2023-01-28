import { MappedSubject } from './Subject';
import { AbstractSubscribable, Subscribable } from './Subscribable';

/**
 * A class for subjects that return a computed value.
 * @class ComputedSubject
 * @template I The type of the input value.
 * @template T The type of the computed output value.
 */
export class ComputedSubject<I, T> implements Subscribable<T> {
  private _subs: { (v: T, rv: I): void }[] = [];
  private _computedValue: T;
  private _value: I;


  /**
   * Creates an instance of ComputedSubject.
   * @param value The initial value.
   * @param computeFn The computation function.
   */
  private constructor(value: I, private readonly computeFn: (v: I) => T) {
    this._value = value;
    this._computedValue = computeFn(value);
  }

  /**
   * Creates and returns a new ComputedSubject.
   * @param v The initial value of the Subject.
   * @param fn A function which transforms raw values to computed values.
   * @returns A ComputedSubject instance.
   */
  public static create<IT, CT>(v: IT, fn: (v: IT) => CT): ComputedSubject<IT, CT> {
    return new ComputedSubject(v, fn);
  }

  /**
   * Sets the new value and notifies the subscribers when value changed.
   * @param value The new value.
   */
  public set(value: I): void {
    this._value = value;
    const compValue = this.computeFn(value);
    if (compValue !== this._computedValue) {
      this._computedValue = compValue;
      const subLen = this._subs.length;
      for (let i = 0; i < subLen; i++) {
        this._subs[i](this._computedValue, this._value);
      }
    }
  }

  /**
   * Gets the computed value of the Subject.
   * @returns The computed value.
   */
  public get(): T {
    return this._computedValue;
  }

  /**
   * Gets the raw value of the Subject.
   * @returns The raw value.
   */
  public getRaw(): I {
    return this._value;
  }

  /**
   * Subscribes to the subject with a callback function. The function will be called whenever the computed value of
   * this Subject changes.
   * @param fn A callback function.
   * @param initialNotify Whether to immediately notify the callback function with the current compured and raw values
   * of this Subject after it is subscribed. False by default.
   */
  public sub(fn: (v: T, rv: I) => void, initialNotify?: boolean): void {
    this._subs.push(fn);
    if (initialNotify) {
      fn(this._computedValue, this._value);
    }
  }

  /**
   * Unsubscribes a callback function from this Subject.
   * @param fn The callback function to unsubscribe.
   */
  public unsub(fn: (v: T, rv: I) => void): void {
    const index = this._subs.indexOf(fn);
    if (index >= 0) {
      this._subs.splice(index, 1);
    }
  }

  /**
   * Maps this subject to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[T], M>;
  /**
   * Maps this subject to a new subscribable with a persistent, cached value which is mutated when it changes.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values.
   * @param mutateFunc The function to use to change the value of the mapped subscribable.
   * @param initialVal The initial value of the mapped subscribable.
   * @returns The mapped subscribable.
   */
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc: ((a: M, b: M) => boolean),
    mutateFunc: ((oldVal: M, newVal: M) => void),
    initialVal: M
  ): MappedSubject<[T], M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc?: ((a: M, b: M) => boolean),
    mutateFunc?: ((oldVal: M, newVal: M) => void),
    initialVal?: M
  ): MappedSubject<[T], M> {
    const mapFunc = (inputs: readonly [T], previousVal?: M): M => fn(inputs[0], previousVal);
    return mutateFunc
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? MappedSubject.create(mapFunc, equalityFunc!, mutateFunc, initialVal!, this)
      : MappedSubject.create(mapFunc, equalityFunc ?? AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
  }
}