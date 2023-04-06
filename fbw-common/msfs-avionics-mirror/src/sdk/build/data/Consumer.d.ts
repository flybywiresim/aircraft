import { EventBus, Handler } from './EventBus';
/**
 * An event bus consumer for a specific topic.
 */
export declare class Consumer<T> {
    private bus;
    private topic;
    private state;
    private currentHandler?;
    /**
     * Creates an instance of a Consumer.
     * @param bus The event bus to subscribe to.
     * @param topic The topic of the subscription.
     * @param state The state for the consumer to track.
     * @param currentHandler The current build filter handler stack, if any.
     */
    constructor(bus: EventBus, topic: string, state?: any, currentHandler?: ((data: T, state: any, next: Handler<T>) => void) | undefined);
    private handlerReference?;
    /**
     * Handles an event using the provided event handler.
     * @param handler The event handler for the event.
     */
    handle(handler: Handler<T>): void;
    /**
     * Disables handling of the event.
     * @param handler The handler to disable.
     */
    off(handler: Handler<T>): void;
    /**
     * Caps the event subscription to a specified frequency, in Hz.
     * @param frequency The frequency, in Hz, to cap to.
     * @returns A new consumer with the applied frequency filter.
     */
    atFrequency(frequency: number): Consumer<T>;
    /**
     * Quantizes the numerical event data to consume only at the specified decimal precision.
     * @param precision The decimal precision to snap to.
     * @returns A new consumer with the applied precision filter.
     */
    withPrecision(precision: number): Consumer<T>;
    /**
     * Quantizes the Arinc429 event data to consume only at the specified decimal precision.
     * @param precision The decimal precision to snap to.
     * @returns A new consumer with the applied precision filter.
     */
    withArinc429Precision(precision: number): Consumer<T>;
    /**
     * Filter the subscription to consume only when the SSM value changes.
     * @returns A new consumer with the applied ssm filter.
     */
    whenArinc429SsmChanged(): Consumer<T>;
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
    /**
     * Builds a handler stack from the current handler.
     * @param data The data to send in to the handler.
     * @param handler The handler to use for processing.
     */
    private with;
}
//# sourceMappingURL=Consumer.d.ts.map