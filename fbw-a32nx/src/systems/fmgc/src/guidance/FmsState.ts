// Copyright (c) 2021-2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisNdMode, EfisNdRangeValue } from '@flybywiresim/fbw-sdk';

export interface FmsState {
    leftEfisState: EfisState,

    rightEfisState: EfisState,
}

export interface EfisState {
    mode: EfisNdMode,

    range: EfisNdRangeValue,

    dataLimitReached: boolean,

    legsCulled: boolean,
}
