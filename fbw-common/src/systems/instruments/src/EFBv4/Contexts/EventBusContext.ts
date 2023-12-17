import { Context, EventBus } from '@microsoft/msfs-sdk';

// eslint-disable-next-line import/no-mutable-exports
export let busContext: Context<EventBus>;

export function initializeEventBusContext(bus: EventBus): void {
    busContext = new Context<EventBus>(bus);
}
