// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TooltipState {
  shown: boolean;
  posX: number;
  posY: number;
  text: string;
}

const initialState: TooltipState = {
  shown: false,
  posX: 0,
  posY: 0,
  text: '',
};

export const tooltipSlice = createSlice({
  name: 'tooltip',
  initialState,
  reducers: {
    setShown: (state, action: PayloadAction<boolean>) => {
      state.shown = action.payload;
    },
    setPosX: (state, action: PayloadAction<number>) => {
      state.posX = action.payload;
    },
    setPosY: (state, action: PayloadAction<number>) => {
      state.posY = action.payload;
    },
    setText: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
    },
  },
});

export default tooltipSlice.reducer;
export const { setShown, setPosX, setPosY, setText } = tooltipSlice.actions;
