import { EventBus } from './EventBus';
/**
 * Key intercept event data.
 */
export declare type KeyEventData = {
    /** The key. */
    key: string;
    /** The index of the key event. */
    index?: number;
    /** The value of the key event. */
    value?: number;
};
/**
 * Key events.
 */
export declare type KeyEvents = {
    /** A key intercept event. */
    key_intercept: KeyEventData;
};
/**
 * A manager for key intercepts. Allows key events to be intercepted and publishes intercepted key events on the event
 * bus.
 */
export declare class KeyInterceptManager {
    private readonly keyListener;
    private readonly bus;
    private static INSTANCE?;
    private static isCreatingInstance;
    private static readonly pendingPromiseResolves;
    /**
     * Constructor.
     * @param keyListener The Coherent key intercept view listener.
     * @param bus The event bus.
     */
    private constructor();
    /**
     * Responds to key intercept events.
     * @param key The key that was intercepted.
     * @param index The index of the key event.
     * @param value The value of the key event.
     */
    private onKeyIntercepted;
    /**
     * Enables interception for a key.
     * @param key The key to intercept.
     * @param passThrough Whether to pass the event through to the sim after it has been intercepted.
     */
    interceptKey(key: string, passThrough: boolean): void;
    /**
     * Gets an instance of KeyInterceptManager. If an instance does not already exist, a new one will be created.
     * @param bus The event bus.
     * @returns A Promise which will be fulfilled with an instance of KeyInterceptManager.
     */
    static getManager(bus: EventBus): Promise<KeyInterceptManager>;
    /**
     * Creates an instance of KeyInterceptManager and fulfills all pending Promises to get the manager instance once
     * the instance is created.
     * @param bus The event bus.
     */
    private static createInstance;
    /**
     * Creates an instance of KeyInterceptManager.
     * @param bus The event bus.
     * @returns A Promise which is fulfilled with a new instance of KeyInterceptManager after it has been created.
     */
    private static create;
}
//# sourceMappingURL=KeyInterceptManager.d.ts.map