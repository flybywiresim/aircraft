import { NumberUnitSubject, UnitType } from '../../..';
import { Consumer, EventBus } from '../../../data';
import { APEvents } from '../../../instruments';

/**
 * A module describing the state of the autopilot.
 */
export class MapAutopilotModule {
  /** The altitude preselector setting. */
  public readonly selectedAltitude = NumberUnitSubject.createFromNumberUnit(UnitType.FOOT.createNumber(0));

  private readonly apSelectedAltitudeHandler = (alt: number): void => {
    this.selectedAltitude.set(alt);
  };

  private isSyncing = false;

  private selectedAltitudeConsumer: Consumer<number> | null = null;

  /**
   * Begins syncing this module with the event bus. While syncing is active, this module's properties will be
   * automatically updated with the latest information provided by the event bus.
   * @param bus The event bus.
   * @param updateFreq The frequency at which to sync with the event bus.
   */
  public beginSync(bus: EventBus, updateFreq: number): void {
    this.stopSync();

    const subscriber = bus.getSubscriber<APEvents>();

    this.selectedAltitudeConsumer = subscriber.on('alt_select').atFrequency(updateFreq);
    this.selectedAltitudeConsumer.handle(this.apSelectedAltitudeHandler);

    this.isSyncing = true;
  }

  /**
   * Stops syncing this module with the event bus.
   */
  public stopSync(): void {
    if (!this.isSyncing) {
      return;
    }

    this.selectedAltitudeConsumer?.off(this.apSelectedAltitudeHandler);

    this.isSyncing = false;
  }
}