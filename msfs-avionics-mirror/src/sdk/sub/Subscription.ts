/**
 * A subscription to a source of notifications.
 *
 * Subscriptions can be freely paused and resumed. Paused subscriptions do not receive notifications from its source.
 *
 * Subscriptions that have reached the end of their useful life can be destroyed, after which they will no longer
 * receive notifications and cannot be paused or resumed.
 */
export interface Subscription {
  /**
   * Whether this subscription is alive. Live subscriptions can be freely paused and resumed. Dead subscriptions no
   * longer receive notifications from their sources and will throw an error when attempting to pause or resume them.
   */
  readonly isAlive: boolean;

  /**
   * Whether this subscription is paused. Paused subscriptions do not receive notifications from their sources until
   * they are resumed.
   */
  readonly isPaused: boolean;

  /**
   * Whether this subscription supports initial notifications on resume.
   */
  readonly canInitialNotify: boolean;

  /**
   * Pauses this subscription. Once paused, this subscription will not receive notifications from its source until it
   * is resumed.
   * @throws Error if this subscription is not alive.
   */
  pause(): void;

  /**
   * Resumes this subscription. Once resumed, this subscription will receive notifications from its source.
   * @param initialNotify Whether to immediately send a notification to this subscription's handler when it is resumed
   * if this subscription supports initial notifications. Defaults to `false`.
   * @throws Error if this subscription is not alive.
   */
  resume(initialNotify?: boolean): void;

  /**
   * Destroys this subscription. Once destroyed, this subscription will no longer receive notifications from its
   * source and will throw an error when attempting to pause or resume it.
   */
  destroy(): void;
}