// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Coordinates } from 'msfs-geo';

export interface TScreenCoordinates {
    x: number;
    y: number;
}

interface TPushbackStateContainer {
    pushbackState: TPushbackState
}

export interface TPushbackState {
    mapRange: number
    centerPlaneMode: boolean
    actualMapLatLon: Coordinates
    aircraftIconPosition: TScreenCoordinates
}

const ACE = process.env.VITE_BUILD;

const initialState: TPushbackStateContainer = {
    pushbackState: {
        mapRange: 0.2,
        centerPlaneMode: true,
        actualMapLatLon: {
            lat: (ACE ? 0 : SimVar.GetSimVarValue('A:PLANE LATITUDE', 'degrees latitude')),
            long: (ACE ? 0 : SimVar.GetSimVarValue('A:PLANE LONGITUDE', 'degrees longitude')),
        },
        aircraftIconPosition: { x: 0, y: 0 },
    },
};

export const pushbackSlice = createSlice({
    name: 'pushback',
    initialState,
    reducers: {
        setMapRange: (state, action: PayloadAction<number>) => {
            state.pushbackState.mapRange = action.payload;
        },
        setCenterPlaneMode: (state, action: PayloadAction<boolean>) => {
            state.pushbackState.centerPlaneMode = action.payload;
        },
        setActualMapLatLon: (state, action: PayloadAction<Coordinates>) => {
            state.pushbackState.actualMapLatLon = action.payload;
        },
        setAircraftIconPosition: (state, action: PayloadAction<TScreenCoordinates>) => {
            state.pushbackState.aircraftIconPosition = action.payload;
        },
    },
});

export const {
    setMapRange,
    setCenterPlaneMode,
    setActualMapLatLon,
    setAircraftIconPosition,
} = pushbackSlice.actions;
export default pushbackSlice.reducer;
