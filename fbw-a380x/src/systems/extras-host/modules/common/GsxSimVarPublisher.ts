// Copyright (c) 2023 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, PublishPacer, SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */

export interface GsxSimVarEvents {
  /** FWD Cargo Door Toggle - true => non-zero*/
  gsx_aircraft_cargo_1_toggle: number;
  /** AFT Cargo Door Toggle - true => non-zero*/
  gsx_aircraft_cargo_2_toggle: number;
  /** GSX Fuelhose Connected - true => non-zero*/
  gsx_fuelhose_connected: number;
}

export class GsxSimVarPublisher extends SimVarPublisher<GsxSimVarEvents> {
  private static readonly simVars = new Map<keyof GsxSimVarEvents, SimVarDefinition>([
    ['gsx_aircraft_cargo_1_toggle', { name: 'L:FSDT_GSX_AIRCRAFT_CARGO_1_TOGGLE', type: SimVarValueType.Number }],
    ['gsx_aircraft_cargo_2_toggle', { name: 'L:FSDT_GSX_AIRCRAFT_CARGO_2_TOGGLE', type: SimVarValueType.Number }],
    ['gsx_fuelhose_connected', { name: 'L:FSDT_GSX_FUELHOSE_CONNECTED', type: SimVarValueType.Number }],
  ]);

  constructor(bus: EventBus, pacer?: PublishPacer<GsxSimVarEvents>) {
    super(GsxSimVarPublisher.simVars, bus, pacer);
  }
}
