import { BasePublisher } from '../instruments/BasePublishers';
/**
 * A publisher for publishing H:Events on the bus.
 */
export class HEventPublisher extends BasePublisher {
    /**
     * Dispatches an H:Event to the event bus.
     * @param hEvent The H:Event to dispatch.
     * @param sync Whether this event should be synced (optional, default false)
     */
    dispatchHEvent(hEvent, sync = false) {
        //console.log(`dispaching hevent:  ${hEvent}`);
        this.publish('hEvent', hEvent, sync, false);
    }
}
