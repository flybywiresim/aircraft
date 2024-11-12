import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface GroundSupportBaseEvents {
  /** Gets the availability of external power */
  ext_pwr_avail: boolean;
}

type IndexedTopics = 'ext_pwr_avail';

type GroundSupportIndexedEvents = {
  [P in keyof Pick<GroundSupportBaseEvents, IndexedTopics> as IndexedEventType<P>]: GroundSupportBaseEvents[P];
};

/**
 * Events for Ground Suppport FBW simvars.
 * Event names are the same as the simvar names with index as suffix for indexed simvars.
 */
export interface GroundSupportEvents extends GroundSupportBaseEvents, GroundSupportIndexedEvents {}

/**
 * Publisher for Ground Suppport FBW simvars.
 */
export class GroundSupportPublisher extends SimVarPublisher<GroundSupportEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<GroundSupportEvents>) {
    const simvars = new Map<keyof GroundSupportEvents, SimVarPublisherEntry<any>>([
      ['ext_pwr_avail', { name: `L:A32NX_EXT_PWR_AVAIL:#index#`, type: SimVarValueType.Bool, indexed: true }],
    ]);

    super(simvars, bus, pacer);
  }
}
