// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */

export interface ExtrasSimVarEvents {
  /** ECP TO CONF pushbutton state */
  ecp_to_config_pushbutton: boolean;
  /** FWC flight phase from 1 - 10 */
  fwc_flight_phase: number;
}

export class ExtrasSimVarPublisher extends SimVarPublisher<ExtrasSimVarEvents> {
  private static readonly simVars = new Map<keyof ExtrasSimVarEvents, SimVarDefinition>([
    ['ecp_to_config_pushbutton', { name: 'L:A32NX_BTN_TOCONFIG', type: SimVarValueType.Bool }],
    ['fwc_flight_phase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Number }],
  ]);

  constructor(bus: EventBus, pacer?: PublishPacer<ExtrasSimVarEvents>) {
    super(ExtrasSimVarPublisher.simVars, bus, pacer);
  }
}
