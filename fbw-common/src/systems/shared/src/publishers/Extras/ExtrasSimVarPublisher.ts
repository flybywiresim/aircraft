// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */

export interface BaseExtrasSimVarEvents {
  /** ECP TO CONF pushbutton state, A380X only! */
  ecp_to_config_pushbutton: boolean;
  /** FWC flight phase from 1 - 10 */
  fwc_flight_phase: number;
}

type IndexedTopics = null;

type ExtrasIndexedSimVarEvents = {
  [P in keyof Pick<BaseExtrasSimVarEvents, IndexedTopics> as IndexedEventType<P>]: BaseExtrasSimVarEvents[P];
};
export interface ExtrasSimVarEvents extends BaseExtrasSimVarEvents, ExtrasIndexedSimVarEvents {}

// FIXME remove this publisher and use the publishers oriented around the system providing the data to avoid duplication.
export class ExtrasSimVarPublisher extends SimVarPublisher<ExtrasSimVarEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<ExtrasSimVarEvents>) {
    const simVars: [keyof ExtrasSimVarEvents, SimVarPublisherEntry<any>][] = [
      ['ecp_to_config_pushbutton', { name: 'L:A32NX_BTN_TOCONFIG', type: SimVarValueType.Bool, map: (v) => !!v }],
      ['fwc_flight_phase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Number }],
    ];

    super(new Map(simVars), bus, pacer);
  }
}
