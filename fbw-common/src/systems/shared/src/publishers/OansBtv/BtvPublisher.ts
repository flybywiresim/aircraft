// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { SimVarDefinition, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { ArincEventBus } from '@flybywiresim/fbw-sdk';

export interface BtvData {
  /** (BTV -> OANS) Arinc429: Estimated runway occupancy time (ROT), in seconds. */
  btvRot: number;
  /** (BTV -> OANS) Arinc429: Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
  btvTurnAroundIdleReverse: number;
  /** (BTV -> OANS) Arinc429: Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
  btvTurnAroundMaxReverse: number;
  /** (BTV -> OANS) Dry stopping distance */
  dryStoppingDistance: number;
  /** (BTV -> OANS) Wet stopping distance */
  wetStoppingDistance: number;
  /** (BTV -> OANS) Remaining stop distance on ground, used for ROP */
  stopBarDistance: number;

  radioAltitude_1: number;
  radioAltitude_2: number;
  radioAltitude_3: number;

  groundSpeed_1: number;
  groundSpeed_2: number;
  groundSpeed_3: number;

  lgciuDiscreteWord2_1: number;
  lgciuDiscreteWord2_2: number;

  verticalSpeed_1: number;
  verticalSpeed_2: number;
  verticalSpeed_3: number;

  fwcFlightPhase: number;
}

export enum BtvSimVars {
  btvRot = 'L:A32NX_BTV_ROT',
  btvTurnAroundIdleReverse = 'L:A32NX_BTV_TURNAROUND_IDLE_REVERSE',
  btvTurnAroundMaxReverse = 'L:A32NX_BTV_TURNAROUND_MAX_REVERSE',
  dryStoppingDistance = 'L:A32NX_OANS_BTV_DRY_DISTANCE_ESTIMATED',
  wetStoppingDistance = 'L:A32NX_OANS_BTV_WET_DISTANCE_ESTIMATED',
  stopBarDistance = 'L:A32NX_OANS_BTV_STOP_BAR_DISTANCE_ESTIMATED',
  radioAltitude_1 = 'L:A32NX_RA_1_RADIO_ALTITUDE',
  radioAltitude_2 = 'L:A32NX_RA_2_RADIO_ALTITUDE',
  radioAltitude_3 = 'L:A32NX_RA_3_RADIO_ALTITUDE',
  groundSpeed_1 = 'L:A32NX_ADIRS_IR_1_GROUND_SPEED',
  groundSpeed_2 = 'L:A32NX_ADIRS_IR_2_GROUND_SPEED',
  groundSpeed_3 = 'L:A32NX_ADIRS_IR_3_GROUND_SPEED',
  lgciuDiscreteWord2_1 = 'L:A32NX_LGCIU_1_DISCRETE_WORD_2',
  lgciuDiscreteWord2_2 = 'L:A32NX_LGCIU_2_DISCRETE_WORD_2',
  verticalSpeed_1 = 'L:A32NX_ADIRS_IR_1_VERTICAL_SPEED',
  verticalSpeed_2 = 'L:A32NX_ADIRS_IR_2_VERTICAL_SPEED',
  verticalSpeed_3 = 'L:A32NX_ADIRS_IR_3_VERTICAL_SPEED',
  fwcFlightPhase = 'L:A32NX_FWC_FLIGHT_PHASE',
}

export class BtvSimvarPublisher extends SimVarPublisher<BtvData> {
  private static simvars = new Map<keyof BtvData, SimVarDefinition>([
    ['btvRot', { name: BtvSimVars.btvRot, type: SimVarValueType.Number }],
    ['btvTurnAroundIdleReverse', { name: BtvSimVars.btvTurnAroundIdleReverse, type: SimVarValueType.Number }],
    ['btvTurnAroundMaxReverse', { name: BtvSimVars.btvTurnAroundMaxReverse, type: SimVarValueType.Number }],
    ['dryStoppingDistance', { name: BtvSimVars.dryStoppingDistance, type: SimVarValueType.Number }],
    ['wetStoppingDistance', { name: BtvSimVars.wetStoppingDistance, type: SimVarValueType.Number }],
    ['stopBarDistance', { name: BtvSimVars.stopBarDistance, type: SimVarValueType.Number }],
    ['radioAltitude_1', { name: BtvSimVars.radioAltitude_1, type: SimVarValueType.Number }],
    ['radioAltitude_2', { name: BtvSimVars.radioAltitude_2, type: SimVarValueType.Number }],
    ['radioAltitude_3', { name: BtvSimVars.radioAltitude_3, type: SimVarValueType.Number }],
    ['groundSpeed_1', { name: BtvSimVars.groundSpeed_1, type: SimVarValueType.Number }],
    ['groundSpeed_2', { name: BtvSimVars.groundSpeed_2, type: SimVarValueType.Number }],
    ['groundSpeed_3', { name: BtvSimVars.groundSpeed_3, type: SimVarValueType.Number }],
    ['lgciuDiscreteWord2_1', { name: BtvSimVars.lgciuDiscreteWord2_1, type: SimVarValueType.Number }],
    ['lgciuDiscreteWord2_2', { name: BtvSimVars.lgciuDiscreteWord2_2, type: SimVarValueType.Number }],
    ['verticalSpeed_1', { name: BtvSimVars.verticalSpeed_1, type: SimVarValueType.Number }],
    ['verticalSpeed_2', { name: BtvSimVars.verticalSpeed_2, type: SimVarValueType.Number }],
    ['verticalSpeed_3', { name: BtvSimVars.verticalSpeed_3, type: SimVarValueType.Number }],
    ['fwcFlightPhase', { name: BtvSimVars.fwcFlightPhase, type: SimVarValueType.Enum }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(BtvSimvarPublisher.simvars, bus);
  }
}
