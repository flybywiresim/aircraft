import { BasePublisher } from '../instruments/BasePublishers';
/**
 * H:Event events from the EventBus.
 */
export declare type HEvent = {
    /** An H:Event event. */
    hEvent: string;
};
/**
 * A publisher for publishing H:Events on the bus.
 */
export declare class HEventPublisher extends BasePublisher<HEvent> {
    /**
     * Dispatches an H:Event to the event bus.
     * @param hEvent The H:Event to dispatch.
     * @param sync Whether this event should be synced (optional, default false)
     */
    dispatchHEvent(hEvent: string, sync?: boolean): void;
}
//# sourceMappingURL=HEventPublisher.d.ts.map