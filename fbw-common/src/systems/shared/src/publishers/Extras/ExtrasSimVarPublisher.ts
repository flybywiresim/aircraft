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
  /** ECP TO CONF pushbutton state */
  ecp_to_config_pushbutton: boolean;
  /** FWC flight phase from 1 - 10 */
  fwc_flight_phase: number;
  /** Interactive Point Open from 0-1 (indexed) */
  interactive_point_open: number;
  /** Whether the msfs ext power is available (indexed) */
  msfs_ext_power_available: boolean;
  /** Whether our ext power is available (indexed) */
  ext_power_available: boolean;
  /** Aircraft ground velocity relative to earth in knots */
  ground_velocity: number;
}

type IndexedTopics = 'interactive_point_open' | 'ext_power_available' | 'msfs_ext_power_available';

type ExtrasIndexedSimVarEvents = {
  [P in keyof Pick<BaseExtrasSimVarEvents, IndexedTopics> as IndexedEventType<P>]: BaseExtrasSimVarEvents[P];
};
export interface ExtrasSimVarEvents extends BaseExtrasSimVarEvents, ExtrasIndexedSimVarEvents {}

export class ExtrasSimVarPublisher extends SimVarPublisher<ExtrasSimVarEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<ExtrasSimVarEvents>) {
    const simVars: [keyof ExtrasSimVarEvents, SimVarPublisherEntry<any>][] = [
      ['ecp_to_config_pushbutton', { name: 'L:A32NX_BTN_TOCONFIG', type: SimVarValueType.Bool, map: (v) => !!v }],
      ['fwc_flight_phase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Number }],
      [
        'interactive_point_open',
        { name: 'INTERACTIVE POINT OPEN:#index#', type: SimVarValueType.PercentOver100, indexed: true },
      ],
      [
        'msfs_ext_power_available',
        { name: 'EXTERNAL POWER AVAILABLE:#index#', type: SimVarValueType.Bool, map: (v) => !!v, indexed: true },
      ],
      [
        'ext_power_available',
        { name: 'L:A32NX_EXT_PWR_AVAIL:#index#', type: SimVarValueType.Bool, map: (v) => !!v, indexed: true },
      ],
      ['ground_velocity', { name: 'GROUND VELOCITY', type: SimVarValueType.Knots }],
    ];

    super(new Map(simVars), bus, pacer);
  }
}
