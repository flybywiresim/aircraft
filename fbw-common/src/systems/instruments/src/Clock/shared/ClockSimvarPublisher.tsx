// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export interface ClockSimvars {
  ltsTest: number;
  dcEssIsPowered: boolean;
  dcHot1IsPowered: boolean;
  absTime: number;
  timeOfDay: number;
  currentUTC: number;
  dayOfMonth: number;
  monthOfYear: number;
  year: number;
  elapsedKnobPos: number;
  dc2IsPowered: boolean;
}

export enum ClockVars {
  ltsTest = 'L:A32NX_OVHD_INTLT_ANN',
  dcEssIsPowered = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED',
  dcHot1IsPowered = 'L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED',
  absTime = 'E:ABSOLUTE TIME',
  timeOfDay = 'E:TIME OF DAY',
  currentUTC = 'E:ZULU TIME',
  dayOfMonth = 'E:ZULU DAY OF MONTH',
  monthOfYear = 'E:ZULU MONTH OF YEAR',
  year = 'E:ZULU YEAR',
  elapsedKnobPos = 'L:A32NX_CHRONO_ET_SWITCH_POS',
  dc2IsPowered = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
}

export class ClockSimvarPublisher extends SimVarPublisher<ClockSimvars> {
  private static simvars = new Map<keyof ClockSimvars, SimVarDefinition>([
    ['ltsTest', { name: ClockVars.ltsTest, type: SimVarValueType.Number }],
    ['dcEssIsPowered', { name: ClockVars.dcEssIsPowered, type: SimVarValueType.Bool }],
    ['dcHot1IsPowered', { name: ClockVars.dcHot1IsPowered, type: SimVarValueType.Bool }],
    ['absTime', { name: ClockVars.absTime, type: SimVarValueType.Number }],
    ['timeOfDay', { name: ClockVars.timeOfDay, type: SimVarValueType.Enum }],
    ['currentUTC', { name: ClockVars.currentUTC, type: SimVarValueType.Number }],
    ['dayOfMonth', { name: ClockVars.dayOfMonth, type: SimVarValueType.Number }],
    ['monthOfYear', { name: ClockVars.monthOfYear, type: SimVarValueType.Number }],
    ['year', { name: ClockVars.year, type: SimVarValueType.Number }],
    ['elapsedKnobPos', { name: ClockVars.elapsedKnobPos, type: SimVarValueType.Number }],
    ['dc2IsPowered', { name: ClockVars.dc2IsPowered, type: SimVarValueType.Bool }],
  ]);

  public constructor(bus: EventBus) {
    super(ClockSimvarPublisher.simvars, bus);
  }
}
