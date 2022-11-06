import { Subscription } from '../sub/Subscription';
import { Handler } from './EventBus';

/**
 * A consumer of events which optionally filters event data before passing the consumed events to handlers.
 */
export interface Consumer<T> {
  /** Flags this object as a Consumer. */
  readonly isConsumer: true;

  /**
   * Handles an event using the provided event handler.
   * @param handler The event handler for the event.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns A new subscription for the provided handler.
   */
  handle(handler: Handler<T>, paused?: boolean): Subscription;

  /**
   * Disables handling of the event.
   * @param handler The handler to disable.
   * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by
   * `.handle()` to manage subscriptions.
   */
  off(handler: Handler<T>): void;

  /**
   * Caps the event subscription to a specified frequency, in Hz.
   * @param frequency The frequency, in Hz, to cap to.
   * @param immediateFirstPublish Whether to fire once immediately before throttling.
   * @returns A new consumer with the applied frequency filter.
   */
  atFrequency(frequency: number, immediateFirstPublish?: boolean): Consumer<T>;

  /**
   * Quantizes the numerical event data to consume only at the specified decimal precision.
   * @param precision The decimal precision to snap to.
   * @returns A new consumer with the applied precision filter.
   */
  withPrecision(precision: number): Consumer<T>;

  /**
   * Filter the subscription to consume only when the value has changed by a minimum amount.
   * @param amount The minimum amount threshold below which the consumer will not consume.
   * @returns A new consumer with the applied change threshold filter.
   */
  whenChangedBy(amount: number): Consumer<T>;

  /**
   * Filter the subscription to consume only if the value has changed. At all.  Really only
   * useful for strings or other events that don't change much.
   * @returns A new consumer with the applied change threshold filter.
   */
  whenChanged(): Consumer<T>;

  /**
   * Filters events by time such that events will not be consumed until a minimum duration
   * has passed since the previous event.
   * @param deltaTime The minimum delta time between events.
   * @returns A new consumer with the applied change threshold filter.
   */
  onlyAfter(deltaTime: number): Consumer<T>;
}