// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TemperatureCorrectionCalculatorState {
  icao?: string;
  temperature?: number;
  fieldElevation?: number;
  publishedAltitudes: (number | undefined)[];
}

const initialState: TemperatureCorrectionCalculatorState = {
  publishedAltitudes: [],
};

export const temperatureCorrectionCalculatorSlice = createSlice({
  name: 'temperatureCorrectionCalculator',
  initialState,
  reducers: {
    setTemperature: (state, action: PayloadAction<TemperatureCorrectionCalculatorState['temperature']>) => {
      state.temperature = action.payload;
    },
    setFieldElevation: (state, action: PayloadAction<TemperatureCorrectionCalculatorState['fieldElevation']>) => {
      state.fieldElevation = action.payload;
    },
    setPublishedAltitudes: (
      state,
      action: PayloadAction<TemperatureCorrectionCalculatorState['publishedAltitudes']>,
    ) => {
      state.publishedAltitudes = action.payload;
    },
    setIcao: (state, action: PayloadAction<TemperatureCorrectionCalculatorState['icao']>) => {
      state.icao = action.payload;
    },
  },
});

export const { setTemperature, setFieldElevation, setPublishedAltitudes, setIcao } =
  temperatureCorrectionCalculatorSlice.actions;

export default temperatureCorrectionCalculatorSlice.reducer;
