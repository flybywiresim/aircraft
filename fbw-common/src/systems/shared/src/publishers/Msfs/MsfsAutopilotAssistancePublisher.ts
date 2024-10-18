import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface MsfsAutopilotAssistanceBaseEvents {
  /** Get the slot index which the altitude hold mode will track when captured, in feet. */
  msfs_autopilot_altitude_lock_var: number;
}

type IndexedTopics = 'msfs_autopilot_altitude_lock_var';

type MsfsAutopilotAssitanceIndexedEvents = {
  [P in keyof Pick<
    MsfsAutopilotAssistanceBaseEvents,
    IndexedTopics
  > as IndexedEventType<P>]: MsfsAutopilotAssistanceBaseEvents[P];
};

/**
 * Events for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_AutopilotAssistant_Variables.htm.
 * Event names are the same as the simvar names, with msfs_ prefix, and index as suffix for indexed simvars.
 */
export interface MsfsAutopilotAssistanceEvents
  extends MsfsAutopilotAssistanceBaseEvents,
    MsfsAutopilotAssitanceIndexedEvents {}

/**
 * Publisher for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_AutopilotAssistant_Variables.htm.
 */
export class MsfsAutopilotAssitancePublisher extends SimVarPublisher<MsfsAutopilotAssistanceEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<MsfsAutopilotAssistanceEvents>) {
    const simvars = new Map<keyof MsfsAutopilotAssistanceEvents, SimVarPublisherEntry<any>>([
      [
        'msfs_autopilot_altitude_lock_var',
        { name: `AUTOPILOT ALTITUDE LOCK VAR:#index#`, type: SimVarValueType.Feet, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
