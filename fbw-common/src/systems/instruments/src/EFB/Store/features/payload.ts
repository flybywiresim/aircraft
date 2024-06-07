// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export const payloadInitialState: { displayPaxMainDeck: boolean } = { displayPaxMainDeck: true };

export const payloadSlice = createSlice({
  name: 'payload',
  initialState: payloadInitialState,
  reducers: {
    setDisplayPaxMainDeck: (state, action: PayloadAction<boolean>) => {
      state.displayPaxMainDeck = action.payload;
    },
  },
});

export const { setDisplayPaxMainDeck } = payloadSlice.actions;

export default payloadSlice.reducer;
