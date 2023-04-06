import { EventBus, MockEventTypes, PublishPacer } from '../data/EventBus';
import { SimVarDefinition, SimVarEventTypes } from '../data/SimVars';
/**
 * A basic event-bus publisher.
 */
export declare class BasePublisher<E> {
    private bus;
    private publisher;
    private publishActive;
    private pacer;
    /**
     * Creates an instance of BasePublisher.
     * @param bus The common event bus.
     * @param pacer An optional pacer to control the rate of publishing.
     */
    constructor(bus: EventBus, pacer?: PublishPacer<E> | undefined);
    /**
     * Start publishing.
     */
    startPublish(): void;
    /**
     * Stop publishing.
     */
    stopPublish(): void;
    /**
     * Tells whether or not the publisher is currently active.
     * @returns True if the publisher is active, false otherwise.
     */
    isPublishing(): boolean;
    /**
     * A callback called when the publisher receives an update cycle.
     */
    onUpdate(): void;
    /**
     * Publish a message if publishing is acpive
     * @param topic The topic key to publish to.
     * @param data The data type for chosen topic.
     * @param sync Whether or not the event should be synced via local storage.
     * @param isCached Whether or not the event should be cached.
     */
    protected publish<K extends keyof E>(topic: K, data: E[K], sync?: boolean, isCached?: boolean): void;
}
/**
 * A publisher that sends a constant stream of random numbers.
 */
export declare class RandomNumberPublisher extends BasePublisher<MockEventTypes> {
    /**
     * Start publishing random numbers.
     */
    startPublish(): void;
    /**
     * Async thread that publishes random numbers
     * @param ms - Milliseconds to sleep between publishes
     */
    private publishRandomNumbers;
}
/**
 * A base class for publishers that need to handle simvars with built-in
 * support for pacing callbacks.
 */
export declare class SimVarPublisher<E extends SimVarEventTypes> extends BasePublisher<E> {
    private simvars;
    protected subscribed: Set<keyof E>;
    /**
     * Create a SimVarPublisher
     * @param simVarMap A map of simvar event type keys to a SimVarDefinition.
     * @param bus The EventBus to use for publishing.
     * @param pacer An optional pacer to control the rate of publishing.
     */
    constructor(simVarMap: Map<keyof E, SimVarDefinition>, bus: EventBus, pacer?: PublishPacer<E> | undefined);
    /**
     * Subscribe to an event type to begin publishing.
     * @param data Key of the event type in the simVarMap
     */
    subscribe(data: keyof E): void;
    /**
     * Unsubscribe to an event to stop publishing.
     * @param data Key of the event type in the simVarMap
     */
    unsubscribe(data: keyof E): void;
    /**
     * Read the value of a given simvar by its key.
     * @param key The key of the simvar in simVarMap
     * @returns The value returned by SimVar.GetSimVarValue()
     */
    getValue(key: keyof E): any;
    /**
     * Publish all subscribed data points to the bus.
     */
    onUpdate(): void;
    /**
     * Change the simvar read for a given key.
     * @param key The key of the simvar in simVarMap
     * @param value The new value to set the simvar to.
     */
    updateSimVarSource(key: keyof E, value: SimVarDefinition): void;
}
//# sourceMappingURL=BasePublishers.d.ts.map