import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface MsfsRadioNavigationBaseEvents {
  /** Radar altitude in feet. */
  msfs_radio_height: number;
}

type IndexedTopics = null;

type MsfsRadioNavigationIndexedEvents = {
  [P in keyof Pick<
    MsfsRadioNavigationBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: MsfsRadioNavigationBaseEvents[P];
};

/**
 * Events for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm.
 * Event names are the same as the simvar names, with msfs_ prefix, and index as suffix for indexed simvars.
 */
export interface MsfsRadioNavigationEvents extends MsfsRadioNavigationBaseEvents, MsfsRadioNavigationIndexedEvents {}

/**
 * Publisher for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_RadioNavigation_Variables.htm.
 */
export class MsfsRadioNavigationPublisher extends SimVarPublisher<MsfsRadioNavigationEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<MsfsRadioNavigationEvents>) {
    const simvars = new Map<keyof MsfsRadioNavigationEvents, SimVarPublisherEntry<any>>([
      ['msfs_radio_height', { name: `RADIO HEIGHT`, type: SimVarValueType.Feet }],
    ]);

    super(simvars, bus, pacer);
  }
}
