import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface MsfsElectricsBaseEvents {
  /** Gets the availability of external power */
  msfs_external_power_available: boolean;
}

type IndexedTopics = 'msfs_external_power_available';

type MsfsElectricsIndexedEvents = {
  [P in keyof Pick<MsfsElectricsBaseEvents, IndexedTopics> as IndexedEventType<P>]: MsfsElectricsBaseEvents[P];
};

/**
 * Events for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_Electrics_Variables.htm.
 * Event names are the same as the simvar names, with msfs_ prefix, and index as suffix for indexed simvars.
 */
export interface MsfsElectricsEvents extends MsfsElectricsBaseEvents, MsfsElectricsIndexedEvents {}

/**
 * Publisher for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_Electrics_Variables.htm.
 */
export class MsfsElectricsPublisher extends SimVarPublisher<MsfsElectricsEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<MsfsElectricsEvents>) {
    const simvars = new Map<keyof MsfsElectricsEvents, SimVarPublisherEntry<any>>([
      [
        'msfs_external_power_available',
        { name: `EXTERNAL POWER AVAILABLE:#index#`, type: SimVarValueType.Bool, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
