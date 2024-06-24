// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisNdMode, EfisOption, EfisSide, NavAidMode } from '@flybywiresim/fbw-sdk';

export interface FcuSimVars {
  ndRangeSetting: number;
  ndMode: EfisNdMode;
  option: EfisOption;
  navaidMode1: NavAidMode;
  navaidMode2: NavAidMode;
  /** State of the LS pushbutton on the EFIS control panel. */
  efisLsActive: boolean;
}

export class FcuBusPublisher extends SimVarPublisher<FcuSimVars> {
  constructor(bus: EventBus, efisSide: EfisSide) {
    super(
      new Map([
        ['ndRangeSetting', { name: `L:A32NX_EFIS_${efisSide}_ND_RANGE`, type: SimVarValueType.Enum }],
        ['ndMode', { name: `L:A32NX_EFIS_${efisSide}_ND_MODE`, type: SimVarValueType.Enum }],
        ['option', { name: `L:A32NX_EFIS_${efisSide}_OPTION`, type: SimVarValueType.Enum }],
        ['navaidMode1', { name: `L:A32NX_EFIS_${efisSide}_NAVAID_1_MODE`, type: SimVarValueType.Enum }],
        ['navaidMode2', { name: `L:A32NX_EFIS_${efisSide}_NAVAID_2_MODE`, type: SimVarValueType.Enum }],
        ['efisLsActive', { name: `L:BTN_LS_${efisSide === 'L' ? 1 : 2}_FILTER_ACTIVE`, type: SimVarValueType.Bool }],
      ]),
      bus,
    );
  }
}
