import { EventBus } from '../../data';
import { BasePublisher } from '../../instruments';

/**
 * VNav Control Events.
 */
export interface VNavControlEvents {


  /** Event to set the FPA of the current VNAV path segment. */
  vnav_set_current_fpa: number,

  /** Event to set vnav master state. */
  vnav_set_state: boolean,
}


/** A publisher for VNav Control Events */
export class VNavControlEventPublisher extends BasePublisher<VNavControlEvents> {
  /**
   * Create a publisher for VNAV-related data.
   * @param bus The EventBus to publish to.
   */
  public constructor(bus: EventBus) {
    super(bus);
  }

  /**
   * Publish a VNav Control event.
   * @param event The event from ControlEvents.
   * @param value The value of the event.
   */
  public publishEvent<K extends keyof VNavControlEvents>(event: K, value: VNavControlEvents[K]): void {
    this.publish(event, value, true);
  }
}