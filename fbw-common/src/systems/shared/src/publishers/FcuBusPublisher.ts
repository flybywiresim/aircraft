// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisNdMode, EfisOption, EfisSide, NavAidMode } from '@flybywiresim/fbw-sdk';

export interface FcuSimVars {
  ndRangeSetting: number;
  ndMode: EfisNdMode;
  option: EfisOption;
  navaidMode1: NavAidMode;
  navaidMode2: NavAidMode;
  oansRange: number;
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
        ['efisLsActive', { name: `L:A380X_EFIS_${efisSide}_LS_BUTTON_IS_ON`, type: SimVarValueType.Bool }],
        ['oansRange', { name: `L:A32NX_EFIS_${efisSide}_OANS_RANGE`, type: SimVarValueType.Number }],
      ]),
      bus,
    );
  }
}
