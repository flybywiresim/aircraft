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
    pushbackPaused: boolean
    updateIntervalID: number
    updateDeltaTime: number
    lastTimeStamp: number
    mapRange: number
    centerPlaneMode: boolean
    actualMapLatLon: Coordinates
    aircraftIconPosition: TScreenCoordinates
    showDebugInfo: boolean
    tugCommandedHeadingFactor: number
    tugCommandedHeading: number
    tugCommandedSpeedFactor: number
    tugCommandedSpeed: number
    tugInertiaSpeed: number
}

const initialState: TPushbackStateContainer = {
    pushbackState: {
        pushbackPaused: true,
        updateIntervalID: 0,
        updateDeltaTime: 0,
        lastTimeStamp: 0,
        mapRange: 0.2,
        centerPlaneMode: true,
        actualMapLatLon: {
            lat: SimVar.GetSimVarValue('A:PLANE LATITUDE', 'degrees latitude'),
            long: SimVar.GetSimVarValue('A:PLANE LONGITUDE', 'degrees longitude'),
        },
        aircraftIconPosition: { x: 0, y: 0 },
        showDebugInfo: false,
        tugCommandedHeadingFactor: 0,
        tugCommandedHeading: 0,
        tugCommandedSpeedFactor: 0,
        tugCommandedSpeed: 0,
        tugInertiaSpeed: 0,
    },
};

export const pushbackSlice = createSlice({
    name: 'pushback',
    initialState,
    reducers: {
        setPushbackPaused: (state, action: PayloadAction<boolean>) => {
            state.pushbackState.pushbackPaused = action.payload;
        },
        setUpdateIntervalID: (state, action: PayloadAction<number>) => {
            state.pushbackState.updateIntervalID = action.payload;
        },
        setUpdateDeltaTime: (state, action: PayloadAction<number>) => {
            state.pushbackState.updateDeltaTime = action.payload;
        },
        setLastTimestamp: (state, action: PayloadAction<number>) => {
            state.pushbackState.lastTimeStamp = action.payload;
        },
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
        setShowDebugInfo: (state, action: PayloadAction<boolean>) => {
            state.pushbackState.showDebugInfo = action.payload;
        },
        setTugCommandedHeadingFactor: (state, action: PayloadAction<number>) => {
            state.pushbackState.tugCommandedHeadingFactor = action.payload;
        },
        setTugCommandedHeading: (state, action: PayloadAction<number>) => {
            state.pushbackState.tugCommandedHeading = action.payload;
        },
        setTugCommandedSpeedFactor: (state, action: PayloadAction<number>) => {
            state.pushbackState.tugCommandedSpeedFactor = action.payload;
        },
        setTugCommandedSpeed: (state, action: PayloadAction<number>) => {
            state.pushbackState.tugCommandedSpeed = action.payload;
        },
        setTugInertiaSpeed: (state, action: PayloadAction<number>) => {
            state.pushbackState.tugInertiaSpeed = action.payload;
        },
    },
});

export const {
    setPushbackPaused,
    setUpdateIntervalID,
    setUpdateDeltaTime,
    setLastTimestamp,
    setMapRange,
    setCenterPlaneMode,
    setActualMapLatLon,
    setAircraftIconPosition,
    setShowDebugInfo,
    setTugCommandedHeadingFactor,
    setTugCommandedHeading,
    setTugCommandedSpeedFactor,
    setTugCommandedSpeed,
    setTugInertiaSpeed,
} = pushbackSlice.actions;
export default pushbackSlice.reducer;
