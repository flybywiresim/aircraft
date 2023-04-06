import { AbstractSubscribable } from '..';
import { MappedSubscribable } from '../utils/Subscribable';
import { Consumer } from './Consumer';
/**
 * A subscribable subject which derives its value from an event consumer.
 */
export declare class ConsumerSubject<T> extends AbstractSubscribable<T> {
    protected readonly consumer: Consumer<T>;
    protected readonly equalityFunc: (a: T, b: T) => boolean;
    protected readonly mutateFunc?: ((oldVal: T, newVal: T) => void) | undefined;
    private readonly consumerHandler;
    protected value: T;
    /**
     * Constructor.
     * @param consumer The event consumer from which this subject obtains its value.
     * @param initialVal This subject's initial value.
     * @param equalityFunc The function this subject uses check for equality between values.
     * @param mutateFunc The function this subject uses to change its value. If not defined, variable assignment is used
     * instead.
     */
    protected constructor(consumer: Consumer<T>, initialVal: T, equalityFunc: (a: T, b: T) => boolean, mutateFunc?: ((oldVal: T, newVal: T) => void) | undefined);
    /**
     * Creates a new instance of ConsumerSubject.
     * @param consumer The consumer from which the new subject obtains its value.
     * @param initialVal The new subject's initial value.
     * @param equalityFunc The function to use to check for equality between values. Defaults to the strict equality
     * comparison (`===`).
     */
    static create<T>(consumer: Consumer<T>, initialVal: T, equalityFunc?: (a: T, b: T) => boolean): ConsumerSubject<T>;
    /**
     * Creates a new instance of ConsumerSubject.
     * @param consumer The consumer from which the new subject obtains its value.
     * @param initialVal The new subject's initial value.
     * @param equalityFunc The function to use to check for equality between values.
     * @param mutateFunc The function to use to change the new subject's value.
     */
    static create<T>(consumer: Consumer<T>, initialVal: T, equalityFunc: (a: T, b: T) => boolean, mutateFunc: (oldVal: T, newVal: T) => void): ConsumerSubject<T>;
    /**
     * Consumes an event.
     * @param value The value of the event.
     */
    protected onEventConsumed(value: T): void;
    /** @inheritdoc */
    get(): T;
    /**
     * Maps this subscribable to a new subscribable.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
     * equality comparison (`===`).
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: (a: M, b: M) => boolean): MappedSubscribable<M>;
    /**
     * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
     * @param fn The function to use to map to the new subscribable.
     * @param equalityFunc The function to use to check for equality between mapped values.
     * @param mutateFunc The function to use to change the value of the mapped subscribable.
     * @param initialVal The initial value of the mapped subscribable.
     * @returns The mapped subscribable.
     */
    map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc: (a: M, b: M) => boolean, mutateFunc: (oldVal: M, newVal: M) => void, initialVal: M): MappedSubscribable<M>;
    /**
     * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
     */
    destroy(): void;
}
//# sourceMappingURL=ConsumerSubject.d.ts.map