import { EventBus } from '../../data';
import { BasePublisher } from '../../instruments';

/**
 * Events related to VNAV data.
 */
export interface VNavDataEvents {


  /** Whether or not an RNAV-based glidepath is available for vertical guidance. */
  gp_available: boolean,

  /** Whether VNAV path details should be displayed. */
  vnav_path_display: boolean,

  /** The active leg vnav calculated target altitude in meters. */
  vnav_active_leg_alt: number,

  /** The full scale deflection of the vertical GSI due to GPS glidepath deviation, in meters. */
  gp_gsi_scaling: number
}


/** A publisher for VNAV-related data events */
export class VNavDataEventPublisher extends BasePublisher<VNavDataEvents> {
  /**
   * Create a publisher for VNAV-related data.
   * @param bus The EventBus to publish to.
   */
  public constructor(bus: EventBus) {
    super(bus);
  }

  /**
   * Publish a control event.
   * @param event The event from ControlEvents.
   * @param value The value of the event.
   */
  public publishEvent<K extends keyof VNavDataEvents>(event: K, value: VNavDataEvents[K]): void {
    this.publish(event, value, true);
  }
}