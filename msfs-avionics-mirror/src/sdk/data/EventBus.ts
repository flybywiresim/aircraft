/// <reference types="msfstypes/JS/common" />
import { EventSubscriber } from './EventSubscriber';

/** A handler for handling subscription data. */
export type Handler<T> = (data: T) => void;

/** A handler for handling wildcard multiple subscription data. */
export type WildcardHandler<T> = (topic: string | number | symbol, data: T) => void;

/**
 * Used for storing events in an event cache.
 */
type CachedEvent = {
  /** The data that was sent */
  data: any,
  /** Whether or not the data should be synced */
  synced: boolean
}

/**
 * An indexed event type. Indexed events have keys of the form `event_[index]`.
 */
export type IndexedEventType<T extends string> = `${T}_${number}`;

/** A noop interface for global type guards */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface EventTypes { }

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
export class EventBus {
  private _topicHandlersMap = new Map<string | number | symbol, Handler<any>[]>();
  private _wildcardHandlers = new Array<WildcardHandler<any>>();
  private _eventCache = new Map<string, CachedEvent>();
  private _busSync: EventBusSync;
  private _busId: number;

  /**
   * Creates an instance of an EventBus.
   * @param useStorageSync Whether or not to use storage sync (optional, default false)
   */
  constructor(useStorageSync?: boolean) {
    this._busId = Math.floor(Math.random() * 2_147_483_647);
    const syncFunc = useStorageSync ? EventBusStorageSync : EventBusCoherentSync;
    this._busSync = new syncFunc(this.pub.bind(this), this._busId);
    this.syncEvent('event_bus', 'resync_request', false);
    this.on('event_bus', (data) => {
      if (data == 'resync_request') {
        this.resyncEvents();
      }
    });
  }

  /**
   * Subscribes to a topic on the bus.
   * @param topic The topic to subscribe to.
   * @param handler The handler to be called when an event happens.
   */
  public on(topic: string, handler: Handler<any>): void {
    const handlers = this._topicHandlersMap.get(topic);
    const isNew = !(handlers && handlers.push(handler));
    if (isNew) {
      this._topicHandlersMap.set(topic, [handler]);
    }
    const lastState = this._eventCache.get(topic)?.data;
    if (this._eventCache.get(topic) !== undefined) {
      handler(lastState);
    }
  }

  /**
   * Unsubscribes a handler from the topic's events.
   * @param topic The topic to unsubscribe from.
   * @param handler The handler to unsubscribe from topic.
   */
  public off(topic: string, handler: Handler<any>): void {
    const handlers = this._topicHandlersMap.get(topic);
    if (handlers) {
      handlers.splice(handlers.indexOf(handler) >>> 0, 1);
    }
  }

  /**
   * Subscribe to the handler as * to all topics.
   * @param handler The handler to subscribe to all events.
   */
  public onAll(handler: WildcardHandler<any>): void {
    this._wildcardHandlers.push(handler);
  }

  /**
   * Unsubscribe the handler from all topics.
   * @param handler The handler to unsubscribe from all events.
   */
  public offAll(handler: WildcardHandler<any>): void {
    const handlerIndex = this._wildcardHandlers.indexOf(handler);
    if (handlerIndex > -1) {
      this._wildcardHandlers.splice(handlerIndex >>> 0, 1);
    }
  }

  /**
   * Publishes an event to the topic on the bus.
   * @param topic The topic to publish to.
   * @param data The data portion of the event.
   * @param sync Whether or not this message needs to be synced on local stoage.
   * @param isCached Whether or not this message will be resync'd across the bus on load.
   */
  public pub(topic: string, data: any, sync = false, isCached = true): void {
    if (isCached) {
      this._eventCache.set(topic, { data: data, synced: sync });
    }

    const handlers = this._topicHandlersMap.get(topic);
    if (handlers !== undefined) {
      const len = handlers.length;
      for (let i = 0; i < len; i++) {
        try {
          handlers[i](data);
        } catch (error) {
          console.error(`Error in EventBus Handler: ${error}`);
          if (error instanceof Error) {
            console.error(error.stack);
          }
        }
      }
    }

    // We don't know if anything is subscribed on busses in other instruments,
    // so we'll unconditionally sync if sync is true and trust that the
    // publisher knows what it's doing.
    if (sync) {
      this.syncEvent(topic, data, isCached);
    }

    // always push to wildcard handlers
    const wcLen = this._wildcardHandlers.length;
    for (let i = 0; i < wcLen; i++) {
      this._wildcardHandlers[i](topic, data);
    }
  }

  /**
   * Re-sync all synced events
   */
  private resyncEvents(): void {
    for (const [topic, event] of this._eventCache) {
      if (event.synced) {
        this.syncEvent(topic, event.data, true);
      }
    }
  }

  /**
   * Publish an event to the sync bus.
   * @param topic The topic to publish to.
   * @param data The data to publish.
   * @param isCached Whether or not this message will be resync'd across the bus on load.
   */
  private syncEvent(topic: string, data: any, isCached: boolean): void {

    this._busSync.sendEvent(topic, data, isCached);
  }

  /**
   * Gets a typed publisher from the event bus..
   * @returns The typed publisher.
   */
  getPublisher<E>(): Publisher<E> {
    return this as Publisher<E>;
  }

  /**
   * Gets a typed subscriber from the event bus.
   * @returns The typed subscriber.
   */
  getSubscriber<E>(): EventSubscriber<E> {
    return new EventSubscriber(this);
  }
}

/**
 * A class that manages event bus synchronization via data storage.
 */
class EventBusStorageSync {
  private static readonly EMPTY_DATA = '{}';
  private static readonly EB_KEY = 'eb.evt';
  private recvEventCb: (topic: string, data: any, sync?: boolean, isCached?: boolean) => void;
  private busId: number;

  /**
   * Creates an instance of EventBusStorageSync.
   * @param recvEventCb A callback to execute when an event is received on the bus.
   * @param busId The ID of the bus.  Derp.
   */
  constructor(recvEventCb: (topic: string, data: any, sync?: boolean, isCached?: boolean) => void, busId: number) {
    this.recvEventCb = recvEventCb;
    this.busId = busId;
    window.addEventListener('storage', this.receiveEvent.bind(this));
  }

  /**
   * Sends an event via storage events.
   * @param topic The topic to send data on.
   * @param data The data to send.
   */
  sendEvent(topic: string | symbol | number, data: any): void {
    // TODO can we do the stringing more gc friendly?
    // TODO we could not stringify on simple types, but the receiver wouldn't know I guess
    // TODO add handling for busIds to avoid message loops
    localStorage.setItem(EventBusStorageSync.EB_KEY, `${topic.toString()},${data !== undefined ? JSON.stringify(data) : EventBusStorageSync.EMPTY_DATA}`);
    // TODO move removeItem to a function called at intervals instead of every time?
    localStorage.removeItem(EventBusStorageSync.EB_KEY);
  }

  /**
   * Receives an event from storage and syncs onto the bus.
   * @param e The storage event that was received.
   */
  receiveEvent(e: StorageEvent): void {
    // TODO only react on topics that have subscribers
    if (e.key === EventBusStorageSync.EB_KEY && e.newValue) {
      const val = e.newValue.split(',');
      this.recvEventCb(val[0], val.length > 1 ? JSON.parse(val[1]) : undefined, true);
    }
  }
}

/**
 * A class that manages event bus synchronization via Coherent notifications.
 */
class EventBusCoherentSync {
  private static readonly EMPTY_DATA = '{}';
  private static readonly EB_KEY = 'eb.evt';
  private static readonly EB_LISTENER_KEY = 'JS_LISTENER_SIMVARS';
  private recvEventCb: (topic: string, data: any, sync?: boolean, isCached?: boolean) => void;
  private listener: ViewListener.ViewListener;
  private busId: number;
  private evtNum = 0;
  private lastEventSynced = -1;

  /**
   * Creates an instance of EventBusCoherentSync.
   * @param recvEventCb A callback to execute when an event is received on the bus.
   * @param busId The ID of the bus.  Derp.
   */
  constructor(recvEventCb: (topic: string, data: any, sync?: boolean, isCached?: boolean) => void, busId: number) {
    this.recvEventCb = recvEventCb;
    this.busId = busId;
    this.listener = RegisterViewListener(EventBusCoherentSync.EB_LISTENER_KEY);
    this.listener.on(EventBusCoherentSync.EB_KEY, this.receiveEvent.bind(this));
  }

  /**
   * Sends an event via Coherent events.
   * @param topic The topic to send data on.
   * @param data The data to send.
   * @param isCached Whether or not this event is cached.
   */
  sendEvent(topic: string | symbol | number, data: any, isCached?: boolean): void {
    this.listener.triggerToAllSubscribers(EventBusCoherentSync.EB_KEY, { topic, data, isCached, busId: this.busId, evtNum: this.evtNum++ });
  }

  /**
   * Receives an event via Coherent and syncs onto the bus.
   * @param e The storage event that was received.
   */
  receiveEvent(e: Record<string, any>): void {
    // If we've sent this event, don't act on it.
    if (e.busId == this.busId) { return; }
    if (this.lastEventSynced !== e.evtNum) {
      // TODO only react on topics that have subscribers
      this.lastEventSynced = e.evtNum;
      this.recvEventCb(e['topic'], e['data'], undefined, e['isCached']);
    }
  }
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
export class IntervalPacer<E> {
  private interval: number;
  private lastPublished = new Map<keyof E, number>();

  /**
   * Create an IntervalPacer.
   * @param msec Time to wait between publishs in ms
   */
  constructor(msec: number) {
    this.interval = msec;
  }

  /**
   * Determine whether the data can be published based on the time since its
   * prior publish.
   * @param topic The topic data would be sent on.
   * @param data The data which would be sent.
   * @returns A bool indicating if the data should be published.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canPublish<K extends keyof E>(topic: keyof E, data: E[K]): boolean {
    const prior = this.lastPublished.get(topic);
    const now = Date.now();
    if (prior && now - prior < this.interval) {
      return false;
    }
    this.lastPublished.set(topic, now);
    return true;
  }
}

/**
 * A PublishPacer that only allows publishing when a value has changed
 * by a specifed amount from the prior publish.
 */
export class DeltaPacer<E> {
  private delta: number;
  private lastPublished = new Map<keyof E, number>();

  /**
   * Create a DeltaPacer.
   * @param delta The difference required for publishing to be allowed.
   */
  constructor(delta: number) {
    this.delta = delta;
  }

  /**
   * Determine whether the data can be published based on its delta from the
   * pror publish.
   * @param topic The topic data would be sent on.
   * @param data The data which would be sent.
   * @returns A bool indicating if the data should be published.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public canPublish<K extends keyof E>(topic: keyof E, data: number): boolean {
    const prior = this.lastPublished.get(topic);
    if (prior && Math.abs(data - prior) < this.delta) {
      return false;
    }
    this.lastPublished.set(topic, data);
    return true;
  }
}
