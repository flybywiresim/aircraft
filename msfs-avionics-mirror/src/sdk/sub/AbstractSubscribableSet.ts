import { AbstractSubscribable } from './AbstractSubscribable';
import { HandlerSubscription } from './HandlerSubscription';
import { MappedSubject } from './MappedSubject';
import { MutableSubscribable, Subscribable } from './Subscribable';
import { SubscribablePipe } from './SubscribablePipe';
import { MutableSubscribableSet, SubscribableSet, SubscribableSetEventType, SubscribableSetHandler } from './SubscribableSet';
import { SubscribableSetPipe } from './SubscribableSetPipe';
import { Subscription } from './Subscription';

/**
 * An abstract implementation of a subscribable set which allows adding, removing, and notifying subscribers.
 */
export abstract class AbstractSubscribableSet<T> implements SubscribableSet<T>, Subscribable<ReadonlySet<T>> {
  public readonly isSubscribable = true;
  public readonly isSubscribableSet = true;

  /** @inheritdoc */
  public get size(): number {
    return this.get().size;
  }

  protected subs: HandlerSubscription<SubscribableSetHandler<T>>[] = [];
  protected notifyDepth = 0;

  /** A function which sends initial notifications to subscriptions. */
  protected readonly initialNotifyFunc = this.initialNotify.bind(this);

  /** A function which responds to when a subscription to this subscribable is destroyed. */
  protected readonly onSubDestroyedFunc = this.onSubDestroyed.bind(this);

  /** @inheritdoc */
  public abstract get(): ReadonlySet<T>;

  /** @inheritdoc */
  public has(key: T): boolean {
    return this.get().has(key);
  }

  /** @inheritdoc */
  public sub(handler: SubscribableSetHandler<T>, initialNotify = false, paused = false): Subscription {
    const sub = new HandlerSubscription(handler, this.initialNotifyFunc, this.onSubDestroyedFunc);
    this.subs.push(sub);

    if (paused) {
      sub.pause();
    } else if (initialNotify) {
      sub.initialNotify();
    }

    return sub;
  }

  /** @inheritdoc */
  public unsub(handler: SubscribableSetHandler<T>): void {
    const toDestroy = this.subs.find(sub => sub.handler === handler);
    toDestroy?.destroy();
  }

  /**
   * Notifies subscriptions of a change in this set.
   * @param type The type of change.
   * @param key The key related to the change.
   */
  protected notify(type: SubscribableSetEventType, key: T): void {
    const set = this.get();

    let needCleanUpSubs = false;
    this.notifyDepth++;

    const subLen = this.subs.length;
    for (let i = 0; i < subLen; i++) {
      try {
        const sub = this.subs[i];
        if (sub.isAlive && !sub.isPaused) {
          sub.handler(set, type, key);
        }

        needCleanUpSubs ||= !sub.isAlive;
      } catch (error) {
        console.error(`AbstractSubscribableSet: error in handler: ${error}`);
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
   * Notifies a subscription of this set's current state.
   * @param sub The subscription to notify.
   */
  protected initialNotify(sub: HandlerSubscription<SubscribableSetHandler<T>>): void {
    const set = this.get();
    for (const key of set) {
      sub.handler(set, SubscribableSetEventType.Added, key);
    }
  }

  /**
   * Responds to when a subscription to this set is destroyed.
   * @param sub The destroyed subscription.
   */
  protected onSubDestroyed(sub: HandlerSubscription<SubscribableSetHandler<T>>): void {
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
  public map<M>(fn: (input: ReadonlySet<T>, previousVal?: M) => M, equalityFunc?: ((a: M, b: M) => boolean)): MappedSubject<[ReadonlySet<T>], M>;
  /**
   * Maps this subscribable to a new subscribable with a persistent, cached value which is mutated when it changes.
   * @param fn The function to use to map to the new subscribable.
   * @param equalityFunc The function to use to check for equality between mapped values.
   * @param mutateFunc The function to use to change the value of the mapped subscribable.
   * @param initialVal The initial value of the mapped subscribable.
   * @returns The mapped subscribable.
   */
  public map<M>(
    fn: (input: ReadonlySet<T>, previousVal?: M) => M,
    equalityFunc: ((a: M, b: M) => boolean),
    mutateFunc: ((oldVal: M, newVal: M) => void),
    initialVal: M
  ): MappedSubject<[ReadonlySet<T>], M>;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public map<M>(
    fn: (input: ReadonlySet<T>, previousVal?: M) => M,
    equalityFunc?: ((a: M, b: M) => boolean),
    mutateFunc?: ((oldVal: M, newVal: M) => void),
    initialVal?: M
  ): MappedSubject<[ReadonlySet<T>], M> {
    const mapFunc = (inputs: readonly [ReadonlySet<T>], previousVal?: M): M => fn(inputs[0], previousVal);
    return mutateFunc
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      ? MappedSubject.create<[ReadonlySet<T>], M>(mapFunc, equalityFunc!, mutateFunc, initialVal!, this)
      : MappedSubject.create<[ReadonlySet<T>], M>(mapFunc, equalityFunc ?? AbstractSubscribable.DEFAULT_EQUALITY_FUNC, this);
  }

  /**
   * Subscribes to and pipes this subscribable's state to a mutable subscribable. Whenever an update of this
   * subscribable's state is received through the subscription, it will be used as an input to change the other
   * subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's state.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe(to: MutableSubscribable<any, ReadonlySet<T>>, paused?: boolean): Subscription;
  /**
   * Subscribes to and pipes mapped inputs from another subscribable. Whenever an update of the other subscribable's
   * state is received through the subscription, it will be transformed by the specified mapping function, and the
   * transformed state will be used as an input to change this subscribable's state.
   * @param to The mutable subscribable to which to pipe this subscribable's mapped state.
   * @param map The function to use to transform inputs.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe<M>(to: MutableSubscribable<any, M>, map: (input: ReadonlySet<T>) => M, paused?: boolean): Subscription;
  /**
   * Subscribes to and pipes this set's state to a mutable subscribable set. Whenever a key added or removed event is
   * received through the subscription, the same key will be added to or removed from the other set.
   * @param to The mutable subscribable set to which to pipe this set's state.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe(to: MutableSubscribableSet<T>, paused?: boolean): Subscription;
  /**
   * Subscribes to this set's state and pipes a mapped version to a mutable subscribable set. Whenever a key added
   * event is received through the subscription, the key will be transformed by the specified mapping
   * function, and the transformed key will be added to the other set. Whenever a key removed event is received, the
   * transformed key is removed from the other set if and only if no remaining key in this set maps to the same
   * transformed key.
   * @param to The mutable subscribable to which to pipe this set's mapped state.
   * @param map The function to use to transform keys.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public pipe<M>(to: MutableSubscribableSet<M>, map: (input: T) => M, paused?: boolean): Subscription;
  // eslint-disable-next-line jsdoc/require-jsdoc
  public pipe<M>(
    to: MutableSubscribable<any, ReadonlySet<T>> | MutableSubscribable<any, M> | MutableSubscribableSet<T> | MutableSubscribableSet<M>,
    arg2?: ((from: ReadonlySet<T>) => M) | ((input: T) => M) | boolean,
    arg3?: boolean
  ): Subscription {
    let sub;
    let paused;
    if (typeof arg2 === 'function') {
      if ('isSubscribableSet' in to) {
        sub = new SubscribableSetPipe(this, to as MutableSubscribableSet<M>, arg2 as (input: T) => M, this.onSubDestroyedFunc);
      } else {
        sub = new SubscribablePipe(this, to as MutableSubscribable<any, M>, arg2 as (from: ReadonlySet<T>) => M, this.onSubDestroyedFunc);
      }

      paused = arg3 ?? false;
    } else {
      if ('isSubscribableSet' in to) {
        sub = new SubscribableSetPipe(this, to as MutableSubscribableSet<T>, this.onSubDestroyedFunc);
      } else {
        sub = new SubscribablePipe(this, to as MutableSubscribable<any, ReadonlySet<T>>, this.onSubDestroyedFunc);
      }

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