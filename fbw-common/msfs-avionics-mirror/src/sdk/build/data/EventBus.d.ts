import { EventSubscriber } from './EventSubscriber';
/** A handler for handling subscription data. */
export declare type Handler<T> = (data: T) => void;
/** A handler for handling wildcard multiple subscription data. */
export declare type WildcardHandler<T> = (topic: string | number | symbol, data: T) => void;
/**
 * An indexed event type. Indexed events have keys of the form `event_[index]`.
 */
export declare type IndexedEventType<T extends string> = `${T}_${number}`;
/** A noop interface for global type guards */
export interface EventTypes {
}
/** Interface for a utility that synchronizes events across devices */
export interface EventBusSync {
    sendEvent(topic: string | symbol | number, data: any, isCached?: boolean): void;
    receiveEvent(event: any): void;
}
/**
 * Mock event types.
 */
export interface MockEventTypes {
    /** A random number event. */
    randomNumber: number;
}
/**
 * An interface that describes an event publisher.
 */
export interface Publisher<E> {
    /**
     * Publishes an event with data to a topic.
     * @param topic The topic to publish to.
     * @param data The data to publish.
     * @param sync Whether or not to sync the data on the bus.
     * @param isCached Whether or not this event should be cached for retrieval.
     */
    pub<K extends keyof E>(topic: K, data: E[K], sync?: boolean, isCached?: boolean): void;
}
/**
 * An event bus that can be used to publish data from backend
 * components and devices to consumers.
 */
export declare class EventBus {
    private _topicHandlersMap;
    private _wildcardHandlers;
    private _eventCache;
    private _busSync;
    private _busId;
    /**
     * Creates an instance of an EventBus.
     * @param useStorageSync Whether or not to use storage sync (optional, default false)
     */
    constructor(useStorageSync?: boolean);
    /**
     * Subscribes to a topic on the bus.
     * @param topic The topic to subscribe to.
     * @param handler The handler to be called when an event happens.
     */
    on(topic: string, handler: Handler<any>): void;
    /**
     * Unsubscribes a handler from the topic's events.
     * @param topic The topic to unsubscribe from.
     * @param handler The handler to unsubscribe from topic.
     */
    off(topic: string, handler: Handler<any>): void;
    /**
     * Subscribe to the handler as * to all topics.
     * @param handler The handler to subscribe to all events.
     */
    onAll(handler: WildcardHandler<any>): void;
    /**
     * Unsubscribe the handler from all topics.
     * @param handler The handler to unsubscribe from all events.
     */
    offAll(handler: WildcardHandler<any>): void;
    /**
     * Publishes an event to the topic on the bus.
     * @param topic The topic to publish to.
     * @param data The data portion of the event.
     * @param sync Whether or not this message needs to be synced on local stoage.
     * @param isCached Whether or not this message will be resync'd across the bus on load.
     */
    pub(topic: string, data: any, sync?: boolean, isCached?: boolean): void;
    /**
     * Re-sync all synced events
     */
    private resyncEvents;
    /**
     * Publish an event to the sync bus.
     * @param topic The topic to publish to.
     * @param data The data to publish.
     * @param isCached Whether or not this message will be resync'd across the bus on load.
     */
    private syncEvent;
    /**
     * Gets a typed publisher from the event bus..
     * @returns The typed publisher.
     */
    getPublisher<E>(): Publisher<E>;
    /**
     * Gets a typed subscriber from the event bus.
     * @returns The typed subscriber.
     */
    getSubscriber<E>(): EventSubscriber<E>;
}
/**
 * A generic class for injecting pacing logic into a publisher.
 */
export interface PublishPacer<E extends EventTypes> {
    canPublish<K extends keyof E>(topic: K, data: E[K]): boolean;
}
/**
 * A PublishPacer that only allows publishing on an interval.
 */
export declare class IntervalPacer<E> {
    private interval;
    private lastPublished;
    /**
     * Create an IntervalPacer.
     * @param msec Time to wait between publishs in ms
     */
    constructor(msec: number);
    /**
     * Determine whether the data can be published based on the time since its
     * prior publish.
     * @param topic The topic data would be sent on.
     * @param data The data which would be sent.
     * @returns A bool indicating if the data should be published.
     */
    canPublish<K extends keyof E>(topic: keyof E, data: E[K]): boolean;
}
/**
 * A PublishPacer that only allows publishing when a value has changed
 * by a specifed amount from the prior publish.
 */
export declare class DeltaPacer<E> {
    private delta;
    private lastPublished;
    /**
     * Create a DeltaPacer.
     * @param delta The difference required for publishing to be allowed.
     */
    constructor(delta: number);
    /**
     * Determine whether the data can be published based on its delta from the
     * pror publish.
     * @param topic The topic data would be sent on.
     * @param data The data which would be sent.
     * @returns A bool indicating if the data should be published.
     */
    canPublish<K extends keyof E>(topic: keyof E, data: number): boolean;
}
//# sourceMappingURL=EventBus.d.ts.map