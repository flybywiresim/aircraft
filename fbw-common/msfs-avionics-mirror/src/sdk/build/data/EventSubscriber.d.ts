import { Consumer } from './Consumer';
import { EventBus } from './EventBus';
/**
 * A typed container for subscribers interacting with the Event Bus.
 */
export declare class EventSubscriber<E> {
    private bus;
    /**
     * Creates an instance of an EventSubscriber.
     * @param bus The EventBus that is the parent of this instance.
     */
    constructor(bus: EventBus);
    /**
     * Subscribes to a topic on the bus.
     * @param topic The topic to subscribe to.
     * @returns A consumer to bind the event handler to.
     */
    on<K extends keyof E>(topic: K): Consumer<E[K]>;
}
//# sourceMappingURL=EventSubscriber.d.ts.map