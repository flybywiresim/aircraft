import { AbstractSubscribable } from './AbstractSubscribable';
import { HandlerSubscription } from './HandlerSubscription';
import { MappedSubject } from './MappedSubject';
import { MutableSubscribable } from './Subscribable';
import { SubscribablePipe } from './SubscribablePipe';
import { Subscription } from './Subscription';

/**
 * A class for subjects that return a computed value.
 * @class ComputedSubject
 * @template I The type of the input value.
 * @template T The type of the computed output value.
 */
export class ComputedSubject<I, T> implements MutableSubscribable<T, I> {
  public readonly isSubscribable = true;
  public readonly isMutableSubscribable = true;

  private value: T;
  private rawValue: I;

  private subs: HandlerSubscription<(v: T, rv: I) => void>[] = [];
  private notifyDepth = 0;

  private readonly initialNotifyFunc = this.notifySubscription.bind(this);
  private readonly onSubDestroyedFunc = this.onSubDestroyed.bind(this);

  /**
   * Creates an instance of ComputedSubject.
   * @param value The initial value.
   * @param computeFn The computation function.
   */
  private constructor(value: I, private readonly computeFn: (v: I) => T) {
    this.rawValue = value;
    this.value = computeFn(value);
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
    this.rawValue = value;
    const compValue = this.computeFn(value);
    if (compValue !== this.value) {
      this.value = compValue;
      this.notify();
    }
  }

  /**
   * Gets the computed value of the Subject.
   * @returns The computed value.
   */
  public get(): T {
    return this.value;
  }

  /**
   * Gets the raw value of the Subject.
   * @returns The raw value.
   */
  public getRaw(): I {
    return this.rawValue;
  }

  /** @inheritdoc */
  public sub(handler: (v: T, rv: I) => void, initialNotify = false, paused = false): Subscription {
    const sub = new HandlerSubscription<(v: T, rv: I) => void>(handler, this.initialNotifyFunc, this.onSubDestroyedFunc);
    this.subs.push(sub);

    if (paused) {
      sub.pause();
    } else if (initialNotify) {
      sub.initialNotify();
    }

    return sub;

  }

  /** @inheritdoc */
  public unsub(handler: (v: T, rv: I) => void): void {
    const toDestroy = this.subs.find(sub => sub.handler === handler);
    toDestroy?.destroy();
  }

  /**
   * Notifies subscriptions that this subject's value has changed.
   */
  private notify(): void {
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
        console.error(`ComputedSubject: error in handler: ${error}`);
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
   * Notifies a subscription of this subject's current state.
   * @param sub The subscription to notify.
   */
  private notifySubscription(sub: HandlerSubscription<(v: T, rv: I) => void>): void {
    sub.handler(this.value, this.rawValue);
  }

  /**
   * Responds to when a subscription to this subject is destroyed.
   * @param sub The destroyed subscription.
   */
  private onSubDestroyed(sub: HandlerSubscription<(v: T, rv: I) => void>): void {
    // If we are not in the middle of a notify operation, remove the subscription.
    // Otherwise, do nothing and let the post-notify clean-up code handle it.
    if (this.notifyDepth === 0) {
      this.subs.splice(this.subs.indexOf(sub), 1);
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