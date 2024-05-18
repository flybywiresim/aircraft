import { Context, EventBus } from '@microsoft/msfs-sdk';

export let busContext: Context<EventBus>;

export function initializeEventBusContext(bus: EventBus): void {
  busContext = new Context<EventBus>(bus);
}
