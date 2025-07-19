// Copyright (c) 2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0
import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

interface MsfsFlightModelBaseEvents {
  /** Interactive Point current percentage of opening (if door) or deployment (if hose/cable). Percent over 100 */
  msfs_interactive_point_open: number;
  /** The Interactive Point goal percentage of opening (if it's for a door) or percentage of deployment (if it's for a hose or cable). Percent over 100 */
  msfs_interactive_point_goal: number;
}

type IndexedTopics = 'msfs_interactive_point_open' | 'msfs_interactive_point_goal';

type MsfsFlightModelIndexedEvents = {
  [P in keyof Pick<MsfsFlightModelBaseEvents, IndexedTopics> as IndexedEventType<P>]: MsfsFlightModelBaseEvents[P];
};

/**
 * Events for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_FlightModel_Variables.htm.
 * Event names are the same as the simvar names, with msfs_ prefix, and index as suffix for indexed simvars.
 */
export interface MsfsFlightModelEvents extends MsfsFlightModelBaseEvents, MsfsFlightModelIndexedEvents {}

/**
 * Publisher for simvars listed on https://docs.flightsimulator.com/html/Programming_Tools/SimVars/Aircraft_SimVars/Aircraft_FlightModel_Variables.htm.
 */
export class MsfsFlightModelPublisher extends SimVarPublisher<MsfsFlightModelEvents> {
  /**
   * Create a publisher.
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the rate of publishing
   */
  public constructor(bus: EventBus, pacer?: PublishPacer<MsfsFlightModelEvents>) {
    const simvars = new Map<keyof MsfsFlightModelEvents, SimVarPublisherEntry<any>>([
      [
        'msfs_interactive_point_open',
        { name: `INTERACTIVE POINT OPEN:#index#`, type: SimVarValueType.PercentOver100, indexed: true },
      ],
      [
        'msfs_interactive_point_goal',
        { name: `INTERACTIVE POINT GOAL:#index#`, type: SimVarValueType.PercentOver100, indexed: true },
      ],
    ]);

    super(simvars, bus, pacer);
  }
}
