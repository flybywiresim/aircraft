// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AirframeInfo, CabinInfo, FlypadPayloadInfo } from '@flybywiresim/fbw-sdk';

interface AircraftState {
    airframeInfo: AirframeInfo;
    flypadPayloadInfo: FlypadPayloadInfo;
    cabinInfo: CabinInfo;
}

const initialState: AircraftState = {
    airframeInfo: null,
    flypadPayloadInfo: null,
    cabinInfo: null,
};

export const configSlice = createSlice({
    name: 'config',
    initialState,
    reducers: {
        setAirframeInfo: (state, action: PayloadAction<AirframeInfo>) => {
            state.airframeInfo = action.payload;
        },
        setFlypadPayloadInfo: (state, action: PayloadAction<FlypadPayloadInfo>) => {
            state.flypadPayloadInfo = action.payload;
        },
        setCabinInfo: (state, action: PayloadAction<CabinInfo>) => {
            state.cabinInfo = action.payload;
        },
    },
});

export const { setAirframeInfo, setFlypadPayloadInfo, setCabinInfo } = configSlice.actions;
export default configSlice.reducer;
