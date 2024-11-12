// Copyright (c) 2021-2024 FlyByWire Simulations
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
  /** Jetway State as reported by GSX - 5 => connected */
  gsx_jetway_state: number;
  /** GSX Board Service - 4 => requested, 5 => active */
  gsx_boarding_state: number;
  /** GSX Deboard Service - 4 => requested, 5 => active */
  gsx_deboarding_state: number;
  /** GSX Departure/Pushback Service - 4 => requested, 5 => active */
  gsx_departure_state: number;
  /** GSX GPU Service - 4 => requested, 5 => active */
  gsx_gpu_state: number;
  /** GSX Boarding Cargo loaded 0-100% */
  gsx_boarding_cargo_percent: number;
  /** GSX Deboarding Cargo loaded 0-100% */
  gsx_deboarding_cargo_percent: number;

  a32nx_refuel_started_by_user: boolean;

  a38nx_cargo_door_target: number;
}

export class GsxSimVarPublisher extends SimVarPublisher<GsxSimVarEvents> {
  private static readonly simVars = new Map<keyof GsxSimVarEvents, SimVarDefinition>([
    ['gsx_aircraft_cargo_1_toggle', { name: 'L:FSDT_GSX_AIRCRAFT_CARGO_1_TOGGLE', type: SimVarValueType.Number }],
    ['gsx_aircraft_cargo_2_toggle', { name: 'L:FSDT_GSX_AIRCRAFT_CARGO_2_TOGGLE', type: SimVarValueType.Number }],
    ['gsx_jetway_state', { name: 'L:FSDT_GSX_JETWAY', type: SimVarValueType.Number }],
    ['gsx_boarding_state', { name: 'L:FSDT_GSX_BOARDING_STATE', type: SimVarValueType.Number }],
    ['gsx_deboarding_state', { name: 'L:FSDT_GSX_DEBOARDING_STATE', type: SimVarValueType.Number }],
    ['gsx_departure_state', { name: 'L:FSDT_GSX_DEPARTURE_STATE', type: SimVarValueType.Number }],
    ['gsx_gpu_state', { name: 'L:FSDT_GSX_GPU_STATE', type: SimVarValueType.Number }],
    ['gsx_boarding_cargo_percent', { name: 'L:FSDT_GSX_BOARDING_CARGO_PERCENT', type: SimVarValueType.Number }],
    ['gsx_deboarding_cargo_percent', { name: 'L:FSDT_GSX_DEBOARDING_CARGO_PERCENT', type: SimVarValueType.Number }],
    ['gsx_fuelhose_connected', { name: 'L:FSDT_GSX_FUELHOSE_CONNECTED', type: SimVarValueType.Number }],
    ['a32nx_refuel_started_by_user', { name: 'L:A32NX_REFUEL_STARTED_BY_USR', type: SimVarValueType.Bool }],
    ['a38nx_cargo_door_target', { name: 'A:INTERACTIVE POINT GOAL:16', type: SimVarValueType.PercentOver100 }],
  ]);

  constructor(bus: EventBus, pacer?: PublishPacer<GsxSimVarEvents>) {
    super(GsxSimVarPublisher.simVars, bus, pacer);
  }
}
