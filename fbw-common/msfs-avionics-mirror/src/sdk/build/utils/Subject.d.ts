import { AbstractSubscribable, MappedSubscribable, Subscribable } from './Subscribable';
/**
 * A subscribable subject whose value can be freely manipulated.
 */
export declare class Subject<T> extends AbstractSubscribable<T> {
    protected value: T;
    protected readonly equalityFunc: (a: T, b: T) => boolean;
    protected readonly mutateFunc?: ((oldVal: T, newVal: T) => void) | undefined;
    /**
     * Constructs an observable Subject.
     * @param value The initial value.
     * @param equalityFunc The function to use to check for equality.
     * @param mutateFunc The function to use to mutate the subject's value.
     */
    protected constructor(value: T, equalityFunc: (a: T, b: T) => boolean, mutateFunc?: ((oldVal: T, newVal: T) => void) | undefined);
    /**
     * Creates and returns a new Subject.
     * @param v The initial value of the subject.
     * @param equalityFunc The function to use to check for equality between subject values. Defaults to the strict
     * equality comparison (`===`).
     * @param mutateFunc The function to use to change the subject's value. If not defined, new values will replace
     * old values by variable assignment.
     * @returns A Subject instance.
     */
    static create<IT>(v: IT, equalityFunc?: (a: IT, b: IT) => boolean, mutateFunc?: (oldVal: IT, newVal: IT) => void): Subject<IT>;
    /**
     * Sets the value of this subject and notifies subscribers if the value changed.
     * @param value The new value.
     */
    set(value: T): void;
    /**
     * Applies a partial set of properties to this subject's value and notifies subscribers if the value changed as a
     * result.
     * @param value The properties to apply.
     */
    apply(value: Partial<T>): void;
    /** @inheritdoc */
    notify(): void;
    /**
     * Gets the value of this subject.
     * @returns The value of this subject.
     */
    get(): T;
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
/**
 * A type which contains the `length` property of a tuple.
 */
declare type TupleLength<T extends [...any[]]> = {
    length: T['length'];
};
/**
 * A type which maps a tuple of input types to a tuple of subscribables that provide the input types.
 */
export declare type MappedSubscribableInputs<Types extends [...any[]]> = {
    [Index in keyof Types]: Subscribable<Types[Index]>;
} & TupleLength<Types>;
/**
 * A subscribable subject that is a mapped stream from one or more input subscribables.
 */
export declare class MappedSubject<I extends [...any[]], T> extends AbstractSubscribable<T> implements MappedSubscribable<T> {
    protected readonly mapFunc: (inputs: Readonly<I>, previousVal?: T) => T;
    protected readonly equalityFunc: ((a: T, b: T) => boolean);
    protected readonly inputs: MappedSubscribableInputs<I>;
    protected readonly inputValues: I;
    protected value: T;
    protected readonly mutateFunc: (newVal: T) => void;
    protected readonly inputHandlers: (() => void)[];
    /**
     * Creates a new MappedSubject.
     * @param mapFunc The function which maps this subject's inputs to a value.
     * @param equalityFunc The function which this subject uses to check for equality between values.
     * @param mutateFunc The function which this subject uses to change its value.
     * @param initialVal The initial value of this subject.
     * @param inputs The subscribables which provide the inputs to this subject.
     */
    private constructor();
    /**
     * Creates a new mapped subject. Values are compared for equality using the strict equality comparison (`===`).
     * @param mapFunc The function to use to map inputs to the new subject value.
     * @param inputs The subscribables which provide the inputs to the new subject.
     */
    static create<I extends [...any[]], T>(mapFunc: (inputs: Readonly<I>, previousVal?: T) => T, ...inputs: MappedSubscribableInputs<I>): MappedSubject<I, T>;
    /**
     * Creates a new mapped subject. Values are compared for equality using a custom function.
     * @param mapFunc The function to use to map inputs to the new subject value.
     * @param equalityFunc The function which the new subject uses to check for equality between values.
     * @param inputs The subscribables which provide the inputs to the new subject.
     */
    static create<I extends [...any[]], T>(mapFunc: (inputs: Readonly<I>, previousVal?: T) => T, equalityFunc: (a: T, b: T) => boolean, ...inputs: MappedSubscribableInputs<I>): MappedSubject<I, T>;
    /**
     * Creates a new mapped subject with a persistent, cached value which is mutated when it changes. Values are
     * compared for equality using a custom function.
     * @param mapFunc The function to use to map inputs to the new subject value.
     * @param equalityFunc The function which the new subject uses to check for equality between values.
     * @param mutateFunc The function to use to change the value of the new subject.
     * @param initialVal The initial value of the new subject.
     * @param inputs The subscribables which provide the inputs to the new subject.
     */
    static create<I extends [...any[]], T>(mapFunc: (inputs: Readonly<I>, previousVal?: T) => T, equalityFunc: (a: T, b: T) => boolean, mutateFunc: (oldVal: T, newVal: T) => void, initialVal: T, ...inputs: MappedSubscribableInputs<I>): MappedSubject<I, T>;
    /**
     * Updates an input value, then re-maps this subject's value, and notifies subscribers if this results in a change to
     * the mapped value according to this subject's equality function.
     * @param index The index of the input value to update.
     */
    protected updateValue(index: number): void;
    /**
     * Gets the current value of the subject.
     * @returns The current value.
     */
    get(): T;
    /**
     * Destroys the subscription to the parent subscribable.
     */
    destroy(): void;
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
export {};
//# sourceMappingURL=Subject.d.ts.map