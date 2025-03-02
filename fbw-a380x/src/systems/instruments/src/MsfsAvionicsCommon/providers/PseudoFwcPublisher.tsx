// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  EventBus,
  SimVarValueType,
  SimVarPublisher,
  IndexedEventType,
  PublishPacer,
  SimVarPublisherEntry,
} from '@microsoft/msfs-sdk';

type BasePseudoFwcSimvars = {
  engine_master: number;
  engine_state: number;

  // auto THS trim simvars
  // FIXME delete when auto THS trim implemented in PRIMs
  left_blg_compressed: boolean;
  right_blg_compressed: boolean;
  flaps_handle: number;
  adr_cas_word: number;
  fcdc_discrete_word_4: number;
  hyd_green_sys_pressurized: boolean;
  hyd_yellow_sys_pressurized: boolean;
  throttle_position: number;
  ths_position: number;
  gw_cg_percent: number;
};

type IndexedTopics = 'engine_master' | 'engine_state' | 'adr_cas_word' | 'fcdc_discrete_word_4' | 'throttle_position';
type PseudoFwcIndexedEvents = {
  [P in keyof Pick<BasePseudoFwcSimvars, IndexedTopics> as IndexedEventType<P>]: BasePseudoFwcSimvars[P];
};

export interface PseudoFwcSimvars extends BasePseudoFwcSimvars, PseudoFwcIndexedEvents {}

export class PseudoFwcSimvarPublisher extends SimVarPublisher<PseudoFwcSimvars> {
  constructor(bus: EventBus, pacer?: PublishPacer<PseudoFwcSimvars>) {
    const simvars: [keyof PseudoFwcSimvars, SimVarPublisherEntry<any>][] = [
      ['engine_master', { name: 'A:FUELSYSTEM VALVE SWITCH:#index#', type: SimVarValueType.Bool, indexed: true }],
      ['engine_state', { name: 'L:A32NX_ENGINE_STATE:#index#', type: SimVarValueType.Number, indexed: true }],
      ['left_blg_compressed', { name: 'L:A32NX_LGCIU_1_LEFT_GEAR_COMPRESSED', type: SimVarValueType.Bool }],
      ['right_blg_compressed', { name: 'L:A32NX_LGCIU_1_RIGHT_GEAR_COMPRESSED', type: SimVarValueType.Bool }],
      ['flaps_handle', { name: 'L:A32NX_FLAPS_HANDLE_INDEX', type: SimVarValueType.Number }],
      [
        'adr_cas_word',
        { name: 'L:A32NX_ADIRS_ADR_#index#_COMPUTED_AIRSPEED', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'fcdc_discrete_word_4',
        { name: 'L:A32NX_FCDC_#index#_DISCRETE_WORD_4', type: SimVarValueType.Number, indexed: true },
      ],
      [
        'hyd_green_sys_pressurized',
        { name: 'L:A32NX_HYD_GREEN_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool },
      ],
      [
        'hyd_yellow_sys_pressurized',
        { name: 'L:A32NX_HYD_YELLOW_SYSTEM_1_SECTION_PRESSURE_SWITCH', type: SimVarValueType.Bool },
      ],
      ['throttle_position', { name: 'L:A32NX_AUTOTHRUST_TLA:#index#', type: SimVarValueType.Number, indexed: true }],
      ['ths_position', { name: 'ELEVATOR TRIM POSITION', type: SimVarValueType.Radians }],
      ['gw_cg_percent', { name: 'L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', type: SimVarValueType.Number }],
    ];

    super(new Map(simvars), bus, pacer);
  }
}
