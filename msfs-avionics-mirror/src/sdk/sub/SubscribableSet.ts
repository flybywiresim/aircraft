import { Subscription } from './Subscription';

/**
 * Types of changes made to {@link SubscribableSet}.
 */
export enum SubscribableSetEventType {
  /** A key was added. */
  Added = 'Added',

  /** A key was deleted. */
  Deleted = 'Deleted'
}

/**
 * A function which handles changes in a {@link SubscribableSet}'s state.
 */
export type SubscribableSetHandler<T> = (set: ReadonlySet<T>, type: SubscribableSetEventType, key: T) => void;

/**
 * A set which allows others to subscribe to be notified of changes in its state.
 */
export interface SubscribableSet<T> {
  /** Flags this object as a SubscribableSet. */
  readonly isSubscribableSet: true;

  /** The number of elements contained in this set. */
  readonly size: number;

  /**
   * Gets a read-only version of this set.
   * @returns A read-only version of this set.
   */
  get(): ReadonlySet<T>;

  /**
   * Checks whether this set contains a key.
   * @param key The key to check.
   * @returns Whether this set contains the specified key.
   */
  has(key: T): boolean;

  /**
   * Subscribes to changes in this set's state.
   * @param handler A function which is called when this set's state changes.
   * @param initialNotify Whether to immediately invoke the callback function with this set's current state.
   * Defaults to `false`. This argument is ignored if the subscription is initialized as paused.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  sub(handler: SubscribableSetHandler<T>, initialNotify?: boolean, paused?: boolean): Subscription;

  /**
   * Subscribes to and pipes this set's state to a mutable subscribable set. Whenever a key added or removed event is
   * received through the subscription, the same key will be added to or removed from the other set.
   * @param to The mutable subscribable set to which to pipe this set's state.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  pipe(to: MutableSubscribableSet<T>, paused?: boolean): Subscription;
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
  pipe<M>(to: MutableSubscribableSet<M>, map: (input: T) => M, paused?: boolean): Subscription;
}

/**
 * A subscribable set which can accept inputs to add or remove keys.
 */
export interface MutableSubscribableSet<T> extends SubscribableSet<T> {
  /** Flags this object as a MutableSubscribableSet. */
  readonly isMutableSubscribableSet: true;

  /**
   * Adds a key to this set.
   * @param key The key to add.
   * @returns This set, after the key has been added.
   */
  add(key: T): this;

  /**
   * Removes a key from this set.
   * @param key The key to remove.
   * @returns Whether the key was removed.
   */
  delete(key: T): boolean;

  /**
   * Removes all keys from this set.
   */
  clear(): void;
}