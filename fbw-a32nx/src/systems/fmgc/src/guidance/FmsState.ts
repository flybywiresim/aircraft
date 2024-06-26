// Copyright (c) 2021-2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisNdMode } from '@flybywiresim/fbw-sdk';

export interface FmsState<T extends number> {
  leftEfisState: EfisState<T>;

  rightEfisState: EfisState<T>;
}

export interface EfisState<T extends number> {
  mode: EfisNdMode;

  range: T;

  dataLimitReached: boolean;

  legsCulled: boolean;
}
