import { HandlerSubscription } from './HandlerSubscription';
import { MappedSubscribable, MutableSubscribable, Subscribable } from './Subscribable';
import { SubscribablePipe } from './SubscribablePipe';
import { Subscription } from './Subscription';

/**
 * An abstract implementation of a subscribable which allows adding, removing, and notifying subscribers.
 */
export abstract class AbstractSubscribable<T> implements Subscribable<T> {
  public readonly isSubscribable = true;

  /**
   * Checks if two values are equal using the strict equality operator.
   * @param a The first value.
   * @param b The second value.
   * @returns whether a and b are equal.
   */
  public static readonly DEFAULT_EQUALITY_FUNC = (a: any, b: any): boolean => a === b;

  protected subs: HandlerSubscription<(v: T) => void>[] = [];
  protected notifyDepth = 0;

  /** A function which sends initial notifications to subscriptions. */
  protected readonly initialNotifyFunc = this.notifySubscription.bind(this);

  /** A function which responds to when a subscription to this subscribable is destroyed. */
  protected readonly onSubDestroyedFunc = this.onSubDestroyed.bind(this);

  /** @inheritdoc */
  public abstract get(): T;

  /** @inheritdoc */
  public sub(handler: (v: T) => void, initialNotify = false, paused = false): Subscription {
    const sub = new HandlerSubscription<(v: T) => void>(handler, this.initialNotifyFunc, this.onSubDestroyedFunc);
    this.subs.push(sub);

    if (paused) {
      sub.pause();
    } else if (initialNotify) {
      sub.initialNotify();
    }

    return sub;
  }

  /** @inheritdoc */
  public unsub(handler: (v: T) => void): void {
    const toDestroy = this.subs.find(sub => sub.handler === handler);
    toDestroy?.destroy();
  }

  /**
   * Notifies subscriptions that this subscribable's value has changed.
   */
  protected notify(): void {
    let needCleanUpSubs = false;
    this.notifyDepth++;

    const subLen = this.subs.length;
    for (let i = 0; i < subLen; i++) {
      try {
        const sub = this.subs[i];
        if (sub.isAlive && !sub.isPaused) {
          this.notifySubscription(sub);
        }

        needCleanUpSubs ||= !sub.isAlive;
      } catch (error) {
        console.error(`AbstractSubscribable: error in handler: ${error}`);
        if (error instanceof Error) {
          console.error(error.stack);
        }
      }
    }

    this.notifyDepth--;

    if (needCleanUpSubs && this.notifyDepth === 0) {
      this.subs = this.subs.filter(sub => sub.isAlive);
    }
  }

  /**
   * Notifies a subscription of this subscribable's current state.
   * @param sub The subscription to notify.
   */
  protected notifySubscription(sub: HandlerSubscription<(v: T) => void>): void {
    sub.handler(this.get());
  }

  /**
   * Responds to when a subscription to this subscribable is destroyed.
   * @param sub The destroyed subscription.
   */
  protected onSubDestroyed(sub: HandlerSubscription<(v: T) => void>): void {
    // If we are not in the middle of a notify operation, remove the subscription.
    // Otherwise, do nothing and let the post-notify clean-up code handle it.
    if (this.notifyDepth === 0) {
      this.subs.splice(this.subs.indexOf(sub), 1);
    }
  }

  /**
   * Maps this subscribable to a new subscribable.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values. Defaults to the strict
   * equality comparison (`===`).
   * @returns The mapped subscribable.
   */
  public map<M>(fn: (input: T, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubscribable<M>;
  /**
   * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
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
  ): MappedSubscribable<M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(
    fn: (input: T, previousVal?: M) => M,
    equalityFunc?: ((a: M, b: M) => boolean),
    mutateFunc?: ((oldVal: M, newVal: M) => void),
    initialVal?: M
  ): MappedSubscribable<M> {
    return new MappedSubscribableClass(this, fn, equalityFunc ?? AbstractSubscribable.DEFAULT_EQUALITY_FUNC, mutateFunc, initialVal);
  }

  /**
   * Subscribes to and pipes this subscribable's state to a mutable subscribable. Whenever an update of this
   * subscribable's state is received through the subscription, it will be used as an input to change the other
   * subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's state.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe(to: MutableSubscribable<any, T>, paused?: boolean): Subscription;
  /**
   * Subscribes to this subscribable's state and pipes a mapped version to a mutable subscribable. Whenever an update
   * of this subscribable's state is received through the subscription, it will be transformed by the specified mapping
   * function, and the transformed state will be used as an input to change the other subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's mapped state.
   * @param map The function to use to transform inputs.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe<M>(to: MutableSubscribable<any, M>, map: (input: T) => M, paused?: boolean): Subscription;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public pipe<M>(to: MutableSubscribable<any, T> | MutableSubscribable<any, M>, arg2?: ((from: T) => M) | boolean, arg3?: boolean): Subscription {
    let sub;
    let paused;
    if (typeof arg2 === 'function') {
      sub = new SubscribablePipe(this, to as MutableSubscribable<any, M>, arg2, this.onSubDestroyedFunc);
      paused = arg3 ?? false;
    } else {
      sub = new SubscribablePipe(this, to as MutableSubscribable<any, T>, this.onSubDestroyedFunc);
      paused = arg2 ?? false;
    }

    this.subs.push(sub);

    if (paused) {
      sub.pause();
    } else {
      sub.initialNotify();
    }

    return sub;
  }
}

/**
 * An implementation of {@link MappedSubscribable}.
 */
class MappedSubscribableClass<I, T> extends AbstractSubscribable<T> implements MappedSubscribable<T> {
  public readonly isSubscribable = true;

  private readonly inputSub: Subscription;

  private value: T;
  private readonly mutateFunc: (newVal: T) => void;

  private _isAlive = true;
  /** @inheritdoc */
  public get isAlive(): boolean {
    return this._isAlive;
  }

  private _isPaused = false;
  /** @inheritdoc */
  public get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Constructor.
   * @param input This subscribable's input.
   * @param mapFunc The function which maps this subject's inputs to a value.
   * @param equalityFunc The function which this subject uses to check for equality between values.
   * @param mutateFunc The function which this subject uses to change its value.
   * @param initialVal The initial value of this subject.
   */
  constructor(
    private readonly input: Subscribable<I>,
    private readonly mapFunc: (input: I, previousVal?: T) => T,
    private readonly equalityFunc: ((a: T, b: T) => boolean),
    mutateFunc?: ((oldVal: T, newVal: T) => void),
    initialVal?: T
  ) {
    super();

    if (initialVal && mutateFunc) {
      this.value = initialVal;
      mutateFunc(this.value, this.mapFunc(this.input.get()));
      this.mutateFunc = (newVal: T): void => { mutateFunc(this.value, newVal); };
    } else {
      this.value = this.mapFunc(this.input.get());
      this.mutateFunc = (newVal: T): void => { this.value = newVal; };
    }

    this.inputSub = this.input.sub(inputValue => {
      this.updateValue(inputValue);
    }, true);
  }

  /**
   * Re-maps this subject's value from its input, and notifies subscribers if this results in a change to the mapped
   * value according to this subject's equality function.
   * @param inputValue The input value.
   */
  private updateValue(inputValue: I): void {
    const value = this.mapFunc(inputValue, this.value);
    if (!this.equalityFunc(this.value, value)) {
      this.mutateFunc(value);
      this.notify();
    }
  }

  /** @inheritdoc */
  public get(): T {
    return this.value;
  }

  /** @inheritdoc */
  public pause(): void {
    if (!this._isAlive) {
      throw new Error('MappedSubscribable: cannot pause a dead subscribable');
    }

    if (this._isPaused) {
      return;
    }

    this.inputSub.pause();

    this._isPaused = true;
  }

  /** @inheritdoc */
  public resume(): void {
    if (!this._isAlive) {
      throw new Error('MappedSubscribable: cannot resume a dead subscribable');
    }

    if (!this._isPaused) {
      return;
    }

    this._isPaused = false;

    this.inputSub.resume(true);
  }

  /** @inheritdoc */
  public destroy(): void {
    this._isAlive = false;

    this.inputSub.destroy();
  }
}