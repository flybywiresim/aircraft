// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisNdMode, EfisNdRangeValue } from '@shared/NavigationDisplay';

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
