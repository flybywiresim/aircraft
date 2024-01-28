// Copyright (c) 2021-2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisNdMode, A320EfisNdRangeValue } from '@flybywiresim/fbw-sdk';

export interface FmsState {
    leftEfisState: EfisState,

    rightEfisState: EfisState,
}

export interface EfisState {
    mode: EfisNdMode,

    range: A320EfisNdRangeValue,

    dataLimitReached: boolean,

    legsCulled: boolean,
}
