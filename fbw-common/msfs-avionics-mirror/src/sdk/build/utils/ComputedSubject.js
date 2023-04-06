import { MappedSubject } from './Subject';
import { AbstractSubscribable } from './Subscribable';
/**
 * A class for subjects that return a computed value.
 * @class ComputedSubject
 * @template I The type of the input value.
 * @template T The type of the computed output value.
 */
export class ComputedSubject {
    /**
     * Creates an instance of ComputedSubject.
     * @param value The initial value.
     * @param computeFn The computation function.
     */
    constructor(value, computeFn) {
        this.computeFn = computeFn;
        this._subs = [];
        this._value = value;
        this._computedValue = computeFn(value);
    }
    /**
     * Creates and returns a new ComputedSubject.
     * @param v The initial value of the Subject.
     * @param fn A function which transforms raw values to computed values.
     * @returns A ComputedSubject instance.
     */
    static create(v, fn) {
        return new ComputedSubject(v, fn);
    }
    /**
     * Sets the new value and notifies the subscribers when value changed.
     * @param value The new value.
     */
    set(value) {
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
    get() {
        return this._computedValue;
    }
    /**
     * Gets the raw value of the Subject.
     * @returns The raw value.
     */
    getRaw() {
        return this._value;
    }
    /**
     * Subscribes to the subject with a callback function. The function will be called whenever the computed value of
     * this Subject changes.
     * @param fn A callback function.
     * @param initialNotify Whether to immediately notify the callback function with the current compured and raw values
     * of this Subject after it is subscribed. False by default.
     */
    sub(fn, initialNotify) {
        this._subs.push(fn);
        if (initialNotify) {
            fn(this._computedValue, this._value);
        }
    }
    /**
     * Unsubscribes a callback function from this Subject.
     * @param fn The callback function to unsubscribe.
     */
    unsub(fn) {
        const index = this._subs.indexOf(fn);
        if (index >= 0) {
            this._subs.splice(index, 1);
        }
    }
    // eslint-disable-next-line jsdoc/require-jsdoc
    map(fn, equalityFunc, mutateFunc, initialVal) {
        const mapFunc = (inputs, previousVal) => fn(inputs[0], previousVal);
        return mutateFunc
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ? MappedSubject.create(mapFunc, equalityFunc, mutateFunc, initialVal, this)
            : MappedSubject.create(mapFunc, equalityFunc !== null && equalityFunc !== void 0 ? equalityFunc : AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
    }
}
