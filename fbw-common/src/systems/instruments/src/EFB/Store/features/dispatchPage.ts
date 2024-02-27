// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DispatchPageState {
  ofpScroll: number;
}

const initialState: DispatchPageState = { ofpScroll: 0 };

export const dispatchPageSlice = createSlice({
  name: 'dispatchPage',
  initialState,
  reducers: {
    setOfpScroll: (state, action: PayloadAction<number>) => {
      state.ofpScroll = action.payload;
    },
  },
});

export const { setOfpScroll } = dispatchPageSlice.actions;
export default dispatchPageSlice.reducer;
