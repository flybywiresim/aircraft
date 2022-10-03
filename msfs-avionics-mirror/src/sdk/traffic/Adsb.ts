import { EventBus } from '../data/EventBus';
import { EventSubscriber } from '../data/EventSubscriber';
import { Subject } from '../sub/Subject';

/**
 * ADS-B operating modes.
 */
export enum AdsbOperatingMode {
  Standby = 'Standby',
  Surface = 'Surface',
  Airborne = 'Airborne'
}

/**
 * ADS-B events.
 */
export interface AdsbEvents {
  /** The ADS-B operating mode. */
  adsb_operating_mode: AdsbOperatingMode;
}

/**
 * An ADS-B system.
 */
export class Adsb {
  protected readonly operatingMode = Subject.create(AdsbOperatingMode.Standby);

  protected readonly eventSubscriber = this.bus.getSubscriber<AdsbEvents>();

  /**
   * Constructor.
   * @param bus The event bus.
   */
  constructor(protected readonly bus: EventBus) {
  }

  /**
   * Gets this system's operating mode.
   * @returns This system's operating mode.
   */
  public getOperatingMode(): AdsbOperatingMode {
    return this.operatingMode.get();
  }

  /**
   * Sets this system's operating mode.
   * @param mode The new operating mode.
   */
  public setOperatingMode(mode: AdsbOperatingMode): void {
    this.operatingMode.set(mode);
  }

  /**
   * Gets an event bus subscriber for TCAS events.
   * @returns an event bus subscriber for TCAS events..
   */
  public getEventSubscriber(): EventSubscriber<AdsbEvents> {
    return this.eventSubscriber;
  }

  /**
   * Initializes this ADS-B system.
   */
  public init(): void {
    this.operatingMode.sub(mode => {
      this.bus.pub('adsb_operating_mode', mode, false, true);
    }, true);
  }
}