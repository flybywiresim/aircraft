import { AbstractSubscribable } from '../sub/AbstractSubscribable';
import { Subscription } from '../sub/Subscription';
import { Consumer } from './Consumer';

/**
 * A subscribable subject which derives its value from an event consumer.
 */
export class ConsumerSubject<T> extends AbstractSubscribable<T> {
  private readonly consumerHandler = this.onEventConsumed.bind(this);

  private value: T;
  private consumerSub?: Subscription;

  private _isPaused = false;
  // eslint-disable-next-line jsdoc/require-returns
  /**
   * Whether event consumption is currently paused for this subject. While paused, this subject's value will not
   * update.
   */
  public get isPaused(): boolean {
    return this._isPaused;
  }

  private isDestroyed = false;

  /**
   * Constructor.
   * @param consumer The event consumer from which this subject obtains its value. If null, this subject's value will
   * not be updated until its consumer is set to a non-null value.
   * @param initialVal This subject's initial value.
   * @param equalityFunc The function this subject uses check for equality between values.
   * @param mutateFunc The function this subject uses to change its value. If not defined, variable assignment is used
   * instead.
   */
  private constructor(
    consumer: Consumer<T> | null,
    initialVal: T,
    private readonly equalityFunc: (a: T, b: T) => boolean,
    private readonly mutateFunc?: (oldVal: T, newVal: T) => void,
  ) {
    super();

    this.value = initialVal;
    this.consumerSub = consumer?.handle(this.consumerHandler);
  }

  /**
   * Creates a new instance of ConsumerSubject.
   * @param consumer The consumer from which the new subject obtains its value. If null, the new subject's value will
   * not be updated until the subject's consumer is set to a non-null value.
   * @param initialVal The new subject's initial value.
   * @param equalityFunc The function to use to check for equality between values. Defaults to the strict equality
   * comparison (`===`).
   */
  public static create<T>(
    consumer: Consumer<T> | null,
    initialVal: T,
    equalityFunc?: (a: T, b: T) => boolean
  ): ConsumerSubject<T>;
  /**
   * Creates a new instance of ConsumerSubject.
   * @param consumer The consumer from which the new subject obtains its value. If null, the new subject's value will
   * not be updated until the subject's consumer is set to a non-null value.
   * @param initialVal The new subject's initial value.
   * @param equalityFunc The function to use to check for equality between values.
   * @param mutateFunc The function to use to change the new subject's value.
   */
  public static create<T>(
    consumer: Consumer<T> | null,
    initialVal: T,
    equalityFunc: (a: T, b: T) => boolean,
    mutateFunc: (oldVal: T, newVal: T) => void
  ): ConsumerSubject<T>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public static create<T>(
    consumer: Consumer<T> | null,
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
  private onEventConsumed(value: T): void {
    if (!this.equalityFunc(this.value, value)) {
      if (this.mutateFunc) {
        this.mutateFunc(this.value, value);
      } else {
        this.value = value;
      }
      this.notify();
    }
  }

  /**
   * Sets the consumer from which this subject derives its value. If the consumer is null, this subject's value will
   * not be updated until a non-null consumer is set.
   * @param consumer An event consumer.
   * @returns This subject, after its consumer has been set.
   */
  public setConsumer(consumer: Consumer<T> | null): this {
    if (this.isDestroyed) {
      return this;
    }

    this.consumerSub?.destroy();
    this.consumerSub = consumer?.handle(this.consumerHandler, this._isPaused);

    return this;
  }

  /**
   * Pauses consuming events for this subject. Once paused, this subject's value will not be updated.
   * @returns This subject, after it has been paused.
   */
  public pause(): this {
    if (this._isPaused) {
      return this;
    }

    this.consumerSub?.pause();
    this._isPaused = true;

    return this;
  }

  /**
   * Resumes consuming events for this subject. Once resumed, this subject's value will be updated from consumed
   * events.
   * @returns This subject, after it has been resumed.
   */
  public resume(): this {
    if (!this._isPaused) {
      return this;
    }

    this._isPaused = false;
    this.consumerSub?.resume(true);

    return this;
  }

  /** @inheritdoc */
  public get(): T {
    return this.value;
  }

  /**
   * Destroys this subject. Once destroyed, it will no longer consume events to update its value.
   */
  public destroy(): void {
    this.consumerSub?.destroy();
    this.isDestroyed = true;
  }
}