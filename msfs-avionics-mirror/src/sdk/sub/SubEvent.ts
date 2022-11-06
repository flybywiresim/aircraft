import { HandlerSubscription } from './HandlerSubscription';
import { Subscription } from './Subscription';

/**
 * An event to which handlers can be subscribed to be notified whenever the event is emitted.
 */
export type ReadonlySubEvent<SenderType, DataType> = Omit<SubEvent<SenderType, DataType>, 'notify' | 'clear'>;

/**
 * An event which can be emitted with optional data to subscribers.
 */
export class SubEvent<SenderType, DataType> {
  private subs: HandlerSubscription<(sender: SenderType, data: DataType) => void>[] = [];
  private notifyDepth = 0;

  private readonly onSubDestroyedFunc = this.onSubDestroyed.bind(this);

  /**
   * Subscribes to this event.
   * @param handler A function to be called when an event is emitted.
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public on(handler: (sender: SenderType, data: DataType) => void, paused = false): Subscription {
    const sub = new HandlerSubscription(handler, undefined, this.onSubDestroyedFunc);
    this.subs.push(sub);

    if (paused) {
      sub.pause();
    }

    return sub;
  }

  /**
   * Unsubscribes a callback function from this event.
   * @param handler The function to unsubscribe.
   * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.on()`
   * to manage subscriptions.
   */
  public off(handler: (sender: SenderType, data: DataType) => void): void {
    const toDestroy = this.subs.find(sub => sub.handler === handler);
    toDestroy?.destroy();
  }

  /**
   * Clears all subscriptions to this event.
   */
  public clear(): void {
    this.notifyDepth++;
    for (let i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.notifyDepth--;

    if (this.notifyDepth === 0) {
      this.subs.length = 0;
    }
  }

  /**
   * Emits an event to subscribers.
   * @param sender The source of the event.
   * @param data Data associated with the event.
   */
  public notify(sender: SenderType, data: DataType): void {
    let needCleanUpSubs = false;
    this.notifyDepth++;

    const subLen = this.subs.length;
    for (let i = 0; i < subLen; i++) {
      try {
        const sub = this.subs[i];
        if (sub.isAlive && !sub.isPaused) {
          sub.handler(sender, data);
        }

        needCleanUpSubs ||= !sub.isAlive;
      } catch (error) {
        console.error(`SubEvent: error in handler: ${error}`);
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
   * Responds to when a subscription to this event is destroyed.
   * @param sub The destroyed subscription.
   */
  private onSubDestroyed(sub: HandlerSubscription<(sender: SenderType, data: DataType) => void>): void {
    // If we are not in the middle of a notify operation, remove the subscription.
    // Otherwise, do nothing and let the post-notify clean-up code handle it.
    if (this.notifyDepth === 0) {
      this.subs.splice(this.subs.indexOf(sub), 1);
    }
  }
}