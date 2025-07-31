import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface MsfsMiscBaseEvents {
  /** Gets the speed relative to the earths surface in knots */
  msfs_ground_velocity: number;
  /** Ground truth latitude. Don't use this for navigation, use ADIRS instead. */
  msfs_latitude: number;
  /** Ground truth longitude. Don't use this for navigation, use ADIRS instead. */
  msfs_longitude: number;
}

type IndexedTopics = null;

type MsfsMiscIndexedEvents = {
  [P in keyof Pick<MsfsMiscBaseEvents, IndexedTopics> as IndexedEventType<P>]: MsfsMiscBaseEvents[P];
};

/**
 * Events for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_Misc_Variables.htm.
 * Event names are the same as the simvar names, with msfs_ prefix, and index as suffix for indexed simvars.
 */
export interface MsfsMiscEvents extends MsfsMiscBaseEvents, MsfsMiscIndexedEvents {}

/**
 * Publisher for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_Misc_Variables.htm.
 */
export class MsfsMiscPublisher extends SimVarPublisher<MsfsMiscEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<MsfsMiscEvents>) {
    const simvars = new Map<keyof MsfsMiscEvents, SimVarPublisherEntry<any>>([
      ['msfs_ground_velocity', { name: `GROUND VELOCITY`, type: SimVarValueType.Knots }],
      ['msfs_latitude', { name: `PLANE LATITUDE`, type: SimVarValueType.Degree }],
      ['msfs_longitude', { name: `PLANE LONGITUDE`, type: SimVarValueType.Degree }],
    ]);

    super(simvars, bus, pacer);
  }
}
