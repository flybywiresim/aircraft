/**
 * Can be used in classes to provide support for custom events.
 * @class SubEvent
 */
export class SubEvent<T> {
  private handlers: { (sender: any, data: T): void; }[] = [];

  /**
   * Subscribe to this event.
   * @param handler The handler to be called when the event is emitted.
   */
  public on(handler: { (sender: any, data: T): void }): void {
    this.handlers.push(handler);
  }

  /**
   * Unsubscribe from this event.
   * @param handler The handler to be called when the event is emitted.
   */
  public off(handler: { (sender: any, data: T): void }): void {
    this.handlers = this.handlers.filter(h => h !== handler);
  }

  /**
   * Clears all subscriptions to this event.
   */
  public clear(): void {
    this.handlers.length = 0;
  }

  /**
   * Emit event to subscribers.
   * @param sender The object emitting the event.
   * @param [data] The event arguments.
   */
  public notify(sender: any, data: T): void {
    const handlers = [...this.handlers];
    for (let i = 0; i < handlers.length; i++) {
      handlers[i](sender, data);
    }
  }
}