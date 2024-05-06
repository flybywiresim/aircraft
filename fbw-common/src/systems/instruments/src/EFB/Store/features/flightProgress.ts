// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FlightPlanProgressState {
  flightPlanProgress: number;
}

const initialState: FlightPlanProgressState = { flightPlanProgress: 0 };

export const flightProgressSlice = createSlice({
  name: 'flightPlanProgress',
  initialState,
  reducers: {
    setFlightPlanProgress: (state, action: PayloadAction<number>) => {
      state.flightPlanProgress = action.payload;
    },
  },
});

export const { setFlightPlanProgress } = flightProgressSlice.actions;
export default flightProgressSlice.reducer;
