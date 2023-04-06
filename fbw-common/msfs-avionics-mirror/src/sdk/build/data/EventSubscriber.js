import { Consumer } from './Consumer';
/**
 * A typed container for subscribers interacting with the Event Bus.
 */
export class EventSubscriber {
    /**
     * Creates an instance of an EventSubscriber.
     * @param bus The EventBus that is the parent of this instance.
     */
    constructor(bus) {
        this.bus = bus;
    }
    /**
     * Subscribes to a topic on the bus.
     * @param topic The topic to subscribe to.
     * @returns A consumer to bind the event handler to.
     */
    on(topic) {
        return new Consumer(this.bus, topic);
    }
}
