// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface KeyboardState {
  offsetY: number;
}

const initialState: KeyboardState = { offsetY: 0 };

const keyboardSlice = createSlice({
  name: 'keyboard',
  initialState,
  reducers: {
    setOffsetY: (state, action: PayloadAction<number>) => {
      state.offsetY = action.payload;
    },
  },
});

export default keyboardSlice.reducer;
export const { setOffsetY } = keyboardSlice.actions;
