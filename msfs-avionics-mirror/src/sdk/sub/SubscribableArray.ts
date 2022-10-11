import { Subscription } from './Subscription';

/**
 * Types of subscribable array change event.
 */
export enum SubscribableArrayEventType {
  /** An element was added. */
  Added = 'Added',

  /** An element was removed. */
  Removed = 'Removed',

  /** The array was cleared. */
  Cleared = 'Cleared'
}

/**
 * A function which handles changes in a {@link SubscribableArray}'s state.
 */
export type SubscribableArrayHandler<T> = (index: number, type: SubscribableArrayEventType, item: T | readonly T[] | undefined, array: readonly T[]) => void;

/**
 * An array which allows others to subscribe to be notified of changes in its state.
 */
export interface SubscribableArray<T> {
  /** The length of this array. */
  readonly length: number;

  /**
   * Retrieves an element from this array.
   * @param index The index of the element.
   * @returns the element at the specified index.
   * @throws Error if index is out of bounds.
   */
  get(index: number): T;

  /**
   * Attempts to retrieve an element from this array.
   * @param index The index of the element.
   * @returns the element at the specified index, or undefined if index is out of bounds.
   */
  tryGet(index: number): T | undefined;

  /**
   * Gets a read-only version of this array.
   * @returns a read-only version of this array.
   */
  getArray(): readonly T[];

  /**
   * Subscribes to changes in this array's state.
   * @param handler A function which is called when this array's state changes.
   * @param initialNotify Whether to immediately invoke the callback function with this array's current state.
   * Defaults to `false`. This argument is ignored if the subscription is initialized as paused.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  sub(handler: SubscribableArrayHandler<T>, initialNotify?: boolean, paused?: boolean): Subscription;

  /**
   * Unsubscribes a callback function from this array.
   * @param handler The function to unsubscribe.
   * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.sub()`
   * to manage subscriptions.
   */
  unsub(handler: SubscribableArrayHandler<T>): void;
}