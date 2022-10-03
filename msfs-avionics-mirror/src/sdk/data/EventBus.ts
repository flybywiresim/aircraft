/// <reference types="msfstypes/JS/common" />
import { HandlerSubscription } from '../sub/HandlerSubscription';
import { Subscription } from '../sub/Subscription';
import { EventSubscriber } from './EventSubscriber';

/** A handler for handling subscription data. */
export type Handler<T> = (data: T) => void;

/** A handler for handling wildcard multiple subscription data. */
export type WildcardHandler = (topic: string, data: any) => void;

/**
 * Meta-events published for event bus happenings.
 */
export interface EventBusMetaEvents {
  /** General event bus topic, currently only used for resync requests. */
  event_bus: string,
  /** Notification that a topic has had a subscripiton.  */
  event_bus_topic_first_sub: string
}

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
  private _topicSubsMap = new Map<string, HandlerSubscription<Handler<any>>[]>();
  private _wildcardSubs = new Array<HandlerSubscription<WildcardHandler>>();

  private _notifyDepthMap = new Map<string, number>();
  private _wildcardNotifyDepth = 0;

  private _eventCache = new Map<string, CachedEvent>();

  private _busSync: EventBusSyncBase;
  private _busId: number;

  protected readonly onWildcardSubDestroyedFunc = this.onWildcardSubDestroyed.bind(this);

  /**
   * Creates an instance of an EventBus.
   * @param useAlternativeEventSync Whether or not to use coherent event sync (optional, default false). 
   * If true, FlowEventSync will only work for gauges.
   */
  constructor(useAlternativeEventSync = false) {
    this._busId = Math.floor(Math.random() * 2_147_483_647);
    // fallback to flowevent when genericdatalistener not avail (su9)
    useAlternativeEventSync = (typeof RegisterGenericDataListener === 'undefined');
    const syncFunc = useAlternativeEventSync ? EventBusFlowEventSync : EventBusListenerSync;
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
   * @param paused Whether the new subscription should be initialized as paused. Defaults to `false`.
   * @returns The new subscription.
   */
  public on(topic: string, handler: Handler<any>, paused = false): Subscription {
    let subs = this._topicSubsMap.get(topic);

    if (subs === undefined) {
      this._topicSubsMap.set(topic, subs = []);
      this.pub('event_bus_topic_first_sub', topic, false);
    }

    const initialNotifyFunc = (sub: HandlerSubscription<Handler<any>>): void => {
      const lastState = this._eventCache.get(topic);
      if (lastState !== undefined) {
        sub.handler(lastState.data);
      }
    };
    const onDestroyFunc = (sub: HandlerSubscription<Handler<any>>): void => {
      // If we are not in the middle of a notify operation, remove the subscription.
      // Otherwise, do nothing and let the post-notify clean-up code handle it.
      if ((this._notifyDepthMap.get(topic) ?? 0) === 0) {
        const subsToSplice = this._topicSubsMap.get(topic);
        if (subsToSplice) {
          subsToSplice.splice(subsToSplice.indexOf(sub), 1);
        }
      }
    };

    const sub = new HandlerSubscription<Handler<any>>(handler, initialNotifyFunc, onDestroyFunc);
    subs.push(sub);

    if (paused) {
      sub.pause();
    } else {
      sub.initialNotify();
    }

    return sub;
  }

  /**
   * Unsubscribes a handler from the topic's events.
   * @param topic The topic to unsubscribe from.
   * @param handler The handler to unsubscribe from topic.
   * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by `.on()`
   * to manage subscriptions.
   */
  public off(topic: string, handler: Handler<any>): void {
    const handlers = this._topicSubsMap.get(topic);
    const toDestroy = handlers?.find(sub => sub.handler === handler);
    toDestroy?.destroy();
  }

  /**
   * Subscribes to all topics.
   * @param handler The handler to subscribe to all events.
   * @returns The new subscription.
   */
  public onAll(handler: WildcardHandler): Subscription {
    const sub = new HandlerSubscription<WildcardHandler>(handler, undefined, this.onWildcardSubDestroyedFunc);
    this._wildcardSubs.push(sub);
    return sub;
  }

  /**
   * Unsubscribe the handler from all topics.
   * @param handler The handler to unsubscribe from all events.
   * @deprecated This method has been deprecated in favor of using the {@link Subscription} object returned by
   * `.onAll()` to manage subscriptions.
   */
  public offAll(handler: WildcardHandler): void {
    const toDestroy = this._wildcardSubs.find(sub => sub.handler === handler);
    toDestroy?.destroy();
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

    const subs = this._topicSubsMap.get(topic);
    if (subs !== undefined) {

      let needCleanUpSubs = false;

      const notifyDepth = this._notifyDepthMap.get(topic) ?? 0;
      this._notifyDepthMap.set(topic, notifyDepth + 1);

      const len = subs.length;
      for (let i = 0; i < len; i++) {
        try {
          const sub = subs[i];
          if (sub.isAlive && !sub.isPaused) {
            sub.handler(data);
          }

          needCleanUpSubs ||= !sub.isAlive;
        } catch (error) {
          console.error(`EventBus: error in handler: ${error}`);
          if (error instanceof Error) {
            console.error(error.stack);
          }
        }
      }

      this._notifyDepthMap.set(topic, notifyDepth);

      if (needCleanUpSubs && notifyDepth === 0) {
        const filteredSubs = subs.filter(sub => sub.isAlive);
        this._topicSubsMap.set(topic, filteredSubs);
      }
    }

    // We don't know if anything is subscribed on busses in other instruments,
    // so we'll unconditionally sync if sync is true and trust that the
    // publisher knows what it's doing.
    if (sync) {
      this.syncEvent(topic, data, isCached);
    }

    // always push to wildcard handlers
    let needCleanUpSubs = false;
    this._wildcardNotifyDepth++;

    const wcLen = this._wildcardSubs.length;
    for (let i = 0; i < wcLen; i++) {
      const sub = this._wildcardSubs[i];
      if (sub.isAlive && !sub.isPaused) {
        sub.handler(topic, data);
      }

      needCleanUpSubs ||= !sub.isAlive;
    }

    this._wildcardNotifyDepth--;

    if (needCleanUpSubs && this._wildcardNotifyDepth === 0) {
      this._wildcardSubs = this._wildcardSubs.filter(sub => sub.isAlive);
    }
  }

  /**
   * Responds to when a wildcard subscription is destroyed.
   * @param sub The destroyed subscription.
   */
  private onWildcardSubDestroyed(sub: HandlerSubscription<WildcardHandler>): void {
    // If we are not in the middle of a notify operation, remove the subscription.
    // Otherwise, do nothing and let the post-notify clean-up code handle it.
    if (this._wildcardNotifyDepth === 0) {
      this._wildcardSubs.splice(this._wildcardSubs.indexOf(sub), 1);
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
  public getPublisher<E>(): Publisher<E> {
    return this as Publisher<E>;
  }

  /**
   * Gets a typed subscriber from the event bus.
   * @returns The typed subscriber.
   */
  public getSubscriber<E>(): EventSubscriber<E> {
    return new EventSubscriber(this);
  }

  /**
   * Get the number of subscribes for a given topic.
   * @param topic The name of the topic.
   * @returns The number of subscribers.
   **/
  public getTopicSubscriberCount(topic: string): number {
    return this._topicSubsMap.get(topic)?.length ?? 0;
  }
}

/** A data package for syncing events between instruments. */
interface SyncDataPackage {
  /** The bus id */
  busId: number;
  /** The package id */
  packagedId: number;
  /** Array of data packages */
  data: TopicDataPackage[];
}

/** A package representing one bus event. */
interface TopicDataPackage {
  /** The bus topic. */
  topic: string;
  /** The data object */
  data: any;
  /** Indicating if this event should be cached on the bus */
  isCached?: boolean | undefined;
}

/**
 * An abstract class for bus sync implementations.
 */
abstract class EventBusSyncBase {
  protected isPaused = false;
  private recvEventCb: (topic: string, data: any, sync?: boolean, isCached?: boolean) => void;
  private lastEventSynced = -1;
  protected busId: number;

  private dataPackageQueue: TopicDataPackage[] = [];

  /**
   * Creates an instance of EventBusFlowEventSync.
   * @param recvEventCb A callback to execute when an event is received on the bus.
   * @param busId The ID of the bus.
   */
  constructor(recvEventCb: (topic: string, data: any, sync?: boolean, isCached?: boolean) => void, busId: number) {
    this.recvEventCb = recvEventCb;
    this.busId = busId;
    this.hookReceiveEvent();

    /** Sends the queued up data packages */
    const sendFn = (): void => {
      if (!this.isPaused && this.dataPackageQueue.length > 0) {
        // console.log(`Sending ${this.dataPackageQueue.length} packages`);
        const syncDataPackage: SyncDataPackage = {
          busId: this.busId,
          packagedId: Math.floor(Math.random() * 1000000000),
          data: this.dataPackageQueue
        };
        if (this.executeSync(syncDataPackage)) {
          this.dataPackageQueue.length = 0;
        } else {
          console.warn('Failed to send sync data package');
        }
      }
      requestAnimationFrame(sendFn);
    };

    requestAnimationFrame(sendFn);
  }

  /**
   * Sends this frame's events.
   * @param syncDataPackage The data package to send.
   * @returns Whether or not the data package was sent successfully.
   */
  protected abstract executeSync(syncDataPackage: SyncDataPackage): boolean;

  /**
   * Hooks up the method being used to received events.
   * Will unwrap the data and should call processEventsReceived.
   */
  protected abstract hookReceiveEvent(): void;

  /**
   * Processes events received and sends them onto the local bus.
   * @param syncData The data package to process.
   */
  protected processEventsReceived(syncData: SyncDataPackage): void {
    if (this.busId !== syncData.busId) {
      // HINT: coherent events are still received twice, so check for this
      if (this.lastEventSynced !== syncData.packagedId) {
        this.lastEventSynced = syncData.packagedId;
        syncData.data.forEach((data: TopicDataPackage): void => {
          try {
            this.recvEventCb(data.topic, data.data !== undefined ? JSON.parse(data.data) : undefined, false, data.isCached);
          } catch (e) {
            console.error(e);
            if (e instanceof Error) {
              console.error(e.stack);
            }
          }
        });
      } else {
        //console.warn('Same event package received twice: ' + syncData.packagedId);
      }
    }
  }

  /**
   * Sends an event via flow events.
   * @param topic The topic to send data on.
   * @param data The data to send.
   * @param isCached Whether or not this event is cached.
   */
  public sendEvent(topic: string, data: any, isCached?: boolean): void {
    // stringify data
    const dataObj = JSON.stringify(data);
    // build a data package
    const dataPackage: TopicDataPackage = {
      topic: topic,
      data: dataObj,
      isCached: isCached
    };
    // queue data package
    this.dataPackageQueue.push(dataPackage);
  }
}

/**
 * A class that manages event bus synchronization via Flow Event Triggers.
 * DON'T USE this, it has bad performance implications.
 * @deprecated
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class EventBusCoherentSync extends EventBusSyncBase {
  private static readonly EB_KEY = 'eb.evt';
  private static readonly EB_LISTENER_KEY = 'JS_LISTENER_SIMVARS';
  private listener!: ViewListener.ViewListener;

  /** @inheritdoc */
  protected executeSync(syncDataPackage: SyncDataPackage): boolean {
    // HINT: Stringifying the data again to circumvent the bad perf on Coherent interop
    try {
      this.listener.triggerToAllSubscribers(EventBusCoherentSync.EB_KEY, JSON.stringify(syncDataPackage));
      return true;
    } catch (error) {
      return false;
    }
  }

  /** @inheritdoc */
  protected hookReceiveEvent(): void {
    this.listener = RegisterViewListener(EventBusCoherentSync.EB_LISTENER_KEY, undefined, true);
    this.listener.on(EventBusCoherentSync.EB_KEY, (e: string) => {
      try {
        const evt = JSON.parse(e) as SyncDataPackage;
        this.processEventsReceived(evt);
      } catch (error) {
        console.error(error);
      }
    });
  }
}

/**
 * A class that manages event bus synchronization via Flow Event Triggers.
 */
class EventBusFlowEventSync extends EventBusSyncBase {
  private static readonly EB_LISTENER_KEY = 'EB_EVENTS';

  /** @inheritdoc */
  protected executeSync(syncDataPackage: SyncDataPackage): boolean {
    // console.log('Sending sync package: ' + syncDataPackage.packagedId);
    try {
      LaunchFlowEvent('ON_MOUSERECT_HTMLEVENT', EventBusFlowEventSync.EB_LISTENER_KEY, this.busId.toString(), JSON.stringify(syncDataPackage));
      return true;
    } catch (error) {
      return false;
    }
  }

  /** @inheritdoc */
  protected hookReceiveEvent(): void {
    Coherent.on('OnInteractionEvent', (target: string, args: string[]): void => {
      // identify if its a busevent
      if (args.length === 0 || args[0] !== EventBusFlowEventSync.EB_LISTENER_KEY || !args[2]) { return; }
      this.processEventsReceived(JSON.parse(args[2]) as SyncDataPackage);
    });
  }
}


//// DECLARING THESE GLOBALS UNTIL WE EXPORTED SU10 TYPES
/**
 * The Generic Data Listener
 */
interface GenericDataListener extends ViewListener.ViewListener {
  onDataReceived(key: string, callback: (data: any) => void): void;
  send(key: string, data: any): void;
}

declare function RegisterGenericDataListener(callback?: () => void): GenericDataListener;
//// END GLOBALS DECLARATION

/**
 * A class that manages event bus synchronization via the Generic Data Listener.
 */
class EventBusListenerSync extends EventBusSyncBase {
  private static readonly EB_KEY = 'wt.eb.evt';
  private static readonly EB_LISTENER_KEY = 'JS_LISTENER_GENERICDATA';
  private listener!: GenericDataListener;

  /** @inheritdoc */
  protected executeSync(syncDataPackage: SyncDataPackage): boolean {
    try {
      this.listener.send(EventBusListenerSync.EB_KEY, syncDataPackage);
      return true;
    } catch (error) {
      return false;
    }
  }

  /** @inheritdoc */
  protected hookReceiveEvent(): void {
    // pause the sync until the listener is ready
    this.isPaused = true;
    this.listener = RegisterGenericDataListener(() => {
      this.listener.onDataReceived(EventBusListenerSync.EB_KEY, (data: SyncDataPackage) => {
        try {
          this.processEventsReceived(data);
        } catch (error) {
          console.error(error);
        }
      });
      this.isPaused = false;
    });
  }
}
