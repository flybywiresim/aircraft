import { AbstractSubscribable, MappedSubject } from '..';
import { MappedSubscribable } from '../utils/Subscribable';
import { Consumer } from './Consumer';

/**
 * A subscribable subject which derives its value from an event consumer.
 */
export class ConsumerSubject<T> extends AbstractSubscribable<T> {
  private readonly consumerHandler = this.onEventConsumed.bind(this);

  protected value: T;

  /**
   * Constructor.
   * @param consumer The event consumer from which this subject obtains its value.
   * @param initialVal This subject's initial value.
   * @param equalityFunc The function this subject uses check for equality between values.
   * @param mutateFunc The function this subject uses to change its value. If not defined, variable assignment is used
   * instead.
   */
  protected constructor(
    protected readonly consumer: Consumer<T>,
    initialVal: T,
    protected readonly equalityFunc: (a: T, b: T) => boolean,
    protected readonly mutateFunc?: (oldVal: T, newVal: T) => void,
  ) {
    super();

    this.value = initialVal;
    consumer.handle(this.consumerHandler);
  }

  /**
   * Creates a new instance of ConsumerSubject.
   * @param consumer The consumer from which the new subject obtains its value.
   * @param initialVal The new subject's initial value.
   * @param equalityFunc The function to use to check for equality between values. Defaults to the strict equality
   * comparison (`===`).
   */
  public static create<T>(
    consumer: Consumer<T>,
    initialVal: T,
    equalityFunc?: (a: T, b: T) => boolean
  ): ConsumerSubject<T>;
  /**
   * Creates a new instance of ConsumerSubject.
   * @param consumer The consumer from which the new subject obtains its value.
   * @param initialVal The new subject's initial value.
   * @param equalityFunc The function to use to check for equality between values.
   * @param mutateFunc The function to use to change the new subject's value.
   */
  public static create<T>(
    consumer: Consumer<T>,
    initialVal: T,
    equalityFunc: (a: T, b: T) => boolean,
    mutateFunc: (oldVal: T, newVal: T) => void
  ): ConsumerSubject<T>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create<T>(
    consumer: Consumer<T>,
    initialVal: T,
    equalityFunc?: (a: T, b: T) => boolean,
    mutateFunc?: (oldVal: T, newVal: T) => void
  ): ConsumerSubject<T> {
    return new ConsumerSubject(consumer, initialVal, equalityFunc ?? AbstractSubscribable.DEFAULT_EQUALITY_FUNC, mutateFunc);
  }

  /**
   * Consumes an event.
   * @param value The value of the event.
   */
  protected onEventConsumed(value: T): void {
    if (!this.equalityFunc(this.value, value)) {
      if (this.mutateFunc) {
        this.mutateFunc(this.value, value);
      } else {
        this.value = value;
      }
      this.notify();
    }
  }

  /** @inheritdoc */
  public get(): T {
    return this.value;
  }

  /**
   * Maps this subscribable to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: (a: M, b: M) => boolean): MappedSubscribable<M>;
  /**
   * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values.
   * @param mutateFunc The function to use to change the value of the mapped subscribable.
   * @param initialVal The initial value of the mapped subscribable.
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc: (a: M, b: M) => boolean, mutateFunc: (oldVal: M, newVal: M) => void, initialVal: M): MappedSubscribable<M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(fn: any, equalityFunc?: any, mutateFunc?: any, initialVal?: any): MappedSubscribable<M> {
    const mapFunc = (inputs: readonly [T], previousVal?: M): M => fn(inputs[0], previousVal);
    return mutateFunc
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? MappedSubject.create(mapFunc, equalityFunc!, mutateFunc, initialVal!, this)
      : MappedSubject.create(mapFunc, equalityFunc ?? AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
  }

  /**
   * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
   */
  public destroy(): void {
    this.consumer.off(this.consumerHandler);
  }
}