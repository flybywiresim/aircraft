import { MappedSubject } from './Subject';
import { Subscribable } from './Subscribable';
/**
 * A class for subjects that return a computed value.
 * @class ComputedSubject
 * @template I The type of the input value.
 * @template T The type of the computed output value.
 */
export declare class ComputedSubject<I, T> implements Subscribable<T> {
    private readonly computeFn;
    private _subs;
    private _computedValue;
    private _value;
    /**
     * Creates an instance of ComputedSubject.
     * @param value The initial value.
     * @param computeFn The computation function.
     */
    private constructor();
    /**
     * Creates and returns a new ComputedSubject.
     * @param v The initial value of the Subject.
     * @param fn A function which transforms raw values to computed values.
     * @returns A ComputedSubject instance.
     */
    static create<IT, CT>(v: IT, fn: (v: IT) => CT): ComputedSubject<IT, CT>;
    /**
     * Sets the new value and notifies the subscribers when value changed.
     * @param value The new value.
     */
    set(value: I): void;
    /**
     * Gets the computed value of the Subject.
     * @returns The computed value.
     */
    get(): T;
    /**
     * Gets the raw value of the Subject.
     * @returns The raw value.
     */
    getRaw(): I;
    /**
     * Subscribes to the subject with a callback function. The function will be called whenever the computed value of
     * this Subject changes.
     * @param fn A callback function.
     * @param initialNotify Whether to immediately notify the callback function with the current compured and raw values
     * of this Subject after it is subscribed. False by default.
     */
    sub(fn: (v: T, rv: I) => void, initialNotify?: boolean): void;
    /**
     * Unsubscribes a callback function from this Subject.
     * @param fn The callback function to unsubscribe.
     */
    unsub(fn: (v: T, rv: I) => void): void;
    /**
     * Maps this subject to a new subscribable.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
     * equality comparison (`===`).
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[T], M>;
    /**
     * Maps this subject to a new subscribable with a persistent, cached value which is mutated when it changes.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values.
     * @param mutateFunc The function to use to change the value of the mapped subscribable.
     * @param initialVal The initial value of the mapped subscribable.
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc: ((a: M, b: M) => boolean), mutateFunc: ((oldVal: M, newVal: M) => void), initialVal: M): MappedSubject<[T], M>;
}
//# sourceMappingURL=ComputedSubject.d.ts.map