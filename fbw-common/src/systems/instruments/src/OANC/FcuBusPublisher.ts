// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EfisNdMode, EfisOption, NavAidMode } from '@flybywiresim/fbw-sdk';

export interface FcuSimVars {
  ndRangeSetting: number;
  ndMode: EfisNdMode;
  option: EfisOption;
  navaidMode1: NavAidMode;
  navaidMode2: NavAidMode;
  /** State of the LS pushbutton on the EFIS control panel. */
  efisLsActive: boolean;
  oansRange: number;
}
