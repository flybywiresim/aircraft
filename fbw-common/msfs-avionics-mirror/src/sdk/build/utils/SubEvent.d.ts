/**
 * Can be used in classes to provide support for custom events.
 * @class SubEvent
 */
export declare class SubEvent<T> {
    private handlers;
    /**
     * Subscribe to this event.
     * @param handler The handler to be called when the event is emitted.
     */
    on(handler: {
        (sender: any, data: T): void;
    }): void;
    /**
     * Unsubscribe from this event.
     * @param handler The handler to be called when the event is emitted.
     */
    off(handler: {
        (sender: any, data: T): void;
    }): void;
    /**
     * Clears all subscriptions to this event.
     */
    clear(): void;
    /**
     * Emit event to subscribers.
     * @param sender The object emitting the event.
     * @param [data] The event arguments.
     */
    notify(sender: any, data: T): void;
}
//# sourceMappingURL=SubEvent.d.ts.map