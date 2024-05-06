/* eslint-disable max-len */
// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AirframeInfo, CabinInfo, FlypadInfo } from '@flybywiresim/fbw-sdk';
import { store, RootState } from '../store';

interface AircraftState {
  airframeInfo: AirframeInfo;
  flypadInfo: FlypadInfo;
  cabinInfo: CabinInfo;
}

const initialState: AircraftState = {
  airframeInfo: null,
  flypadInfo: null,
  cabinInfo: null,
};

export const configSlice = createSlice({
  name: 'config',
  initialState,
  reducers: {
    setAirframeInfo: (state, action: PayloadAction<AirframeInfo>) => {
      state.airframeInfo = action.payload;
    },
    setFlypadInfo: (state, action: PayloadAction<FlypadInfo>) => {
      state.flypadInfo = action.payload;
    },
    setCabinInfo: (state, action: PayloadAction<CabinInfo>) => {
      state.cabinInfo = action.payload;
    },
  },
});

export const { setAirframeInfo, setFlypadInfo, setCabinInfo } = configSlice.actions;

export const getMaxPax = (): number =>
  (store.getState() as RootState).config.cabinInfo.seatMap.reduce(
    (count, station) => count + station.rows.reduce((stationCount, row) => stationCount + row.seats.length, 0),
    0,
  );

export const getMaxCargo = (): number =>
  (store.getState() as RootState).config.cabinInfo.cargoMap.reduce((a, b) => a + b.weight, 0);

export default configSlice.reducer;
