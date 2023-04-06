/**
 * Can be used in classes to provide support for custom events.
 * @class SubEvent
 */
export class SubEvent {
    constructor() {
        this.handlers = [];
    }
    /**
     * Subscribe to this event.
     * @param handler The handler to be called when the event is emitted.
     */
    on(handler) {
        this.handlers.push(handler);
    }
    /**
     * Unsubscribe from this event.
     * @param handler The handler to be called when the event is emitted.
     */
    off(handler) {
        this.handlers = this.handlers.filter(h => h !== handler);
    }
    /**
     * Clears all subscriptions to this event.
     */
    clear() {
        this.handlers.length = 0;
    }
    /**
     * Emit event to subscribers.
     * @param sender The object emitting the event.
     * @param [data] The event arguments.
     */
    notify(sender, data) {
        const handlers = [...this.handlers];
        for (let i = 0; i < handlers.length; i++) {
            handlers[i](sender, data);
        }
    }
}
