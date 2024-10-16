// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/* TODO: remove this file after proper FQMS is implemented in Rust */

import {
  EventBus,
  IndexedEventType,
  PublishPacer,
  SimVarPublisher,
  SimVarPublisherEntry,
  SimVarValueType,
} from '@microsoft/msfs-sdk';

/* eslint-disable camelcase */
export interface BaseFuelSystemEvents {
  /** The valve's switch: */
  fuel_valve_switch: boolean;
  /** The valve's actual continous position, in percent, 0 ... 1 */
  fuel_valve_open: number;
  /** The pump's switch state */
  fuel_pump_switch: boolean;
  /** The pump's active state (ex. false when pump is on but no fuel in tank) */
  fuel_pump_active: boolean;
  /** The engines's fuel pressure in psi. */
  fuel_engine_pressure: number;
  /** The pressure of a fuel line in psi. */
  fuel_line_pressure: number;
  /** The fuel flow of a fuel line in gallons per hour. */
  fuel_line_flow: number;
  /** The quantity of fuel in the selected tank (by tank index), in gallons. */
  fuel_tank_quantity: number;
  /** The state of the trigger (by index) as boolean */
  fuel_trigger_status: boolean;
  /** The setting of the junction (by index) as boolean */
  fuel_junction_setting: number;
  /** Whether refuel has been started as boolean */
  fuel_refuel_started_by_user: boolean;
}

type IndexedTopics =
  | 'fuel_valve_switch'
  | 'fuel_valve_open'
  | 'fuel_pump_switch'
  | 'fuel_pump_active'
  | 'fuel_engine_pressure'
  | 'fuel_line_pressure'
  | 'fuel_line_flow'
  | 'fuel_tank_quantity'
  | 'fuel_trigger_status'
  | 'fuel_junction_setting';

type FuelSystemIndexedEvents = {
  [P in keyof Pick<BaseFuelSystemEvents, IndexedTopics> as IndexedEventType<P>]: BaseFuelSystemEvents[P];
};

/**
 * Fuel System events.
 */
export interface FuelSystemEvents extends BaseFuelSystemEvents, FuelSystemIndexedEvents {}

export class FuelSystemPublisher extends SimVarPublisher<FuelSystemEvents> {
  constructor(bus: EventBus, pacer?: PublishPacer<FuelSystemEvents>) {
    const simvars: [keyof FuelSystemEvents, SimVarPublisherEntry<any>][] = [
      [
        'fuel_valve_switch',
        { name: 'FUELSYSTEM VALVE SWITCH:#index#', type: SimVarValueType.Bool, indexed: true, map: (v) => !!v },
      ],
      ['fuel_valve_open', { name: 'FUELSYSTEM VALVE OPEN:#index#', type: SimVarValueType.Number, indexed: true }],
      [
        'fuel_pump_switch',
        { name: 'FUELSYSTEM PUMP SWITCH:#index#', type: SimVarValueType.Bool, indexed: true, map: (v) => !!v },
      ],
      [
        'fuel_pump_active',
        { name: 'FUELSYSTEM PUMP ACTIVE:#index#', type: SimVarValueType.Bool, indexed: true, map: (v) => !!v },
      ],
      [
        'fuel_engine_pressure',
        { name: 'FUELSYSTEM ENGINE PRESSURE:#index#', type: SimVarValueType.PSI, indexed: true },
      ],
      [
        'fuel_line_pressure',
        { name: 'FUELSYSTEM LINE FUEL PRESSURE:#index#', type: SimVarValueType.PSI, indexed: true },
      ],
      ['fuel_line_flow', { name: 'FUELSYSTEM LINE FUEL FLOW:#index#', type: SimVarValueType.GPH, indexed: true }],
      ['fuel_tank_quantity', { name: 'FUELSYSTEM TANK QUANTITY:#index#', type: SimVarValueType.GAL, indexed: true }],
      [
        'fuel_trigger_status',
        { name: 'FUELSYSTEM TRIGGER STATUS:#index#', type: SimVarValueType.Bool, indexed: true, map: (v) => !!v },
      ],
      [
        'fuel_junction_setting',
        { name: 'FUELSYSTEM JUNCTION SETTING:#index#', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fuel_refuel_started_by_user',
        { name: 'L:A32NX_REFUEL_STARTED_BY_USR', type: SimVarValueType.Bool, indexed: false, map: (v) => !!v },
      ],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
