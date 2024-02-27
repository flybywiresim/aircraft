// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FailurePageState {
  searchQuery: string;
}

const FailurePageInitialState: FailurePageState = { searchQuery: '' };

export const failurePageSlice = createSlice({
  name: 'failurePage',
  initialState: FailurePageInitialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const { setSearchQuery } = failurePageSlice.actions;
export default failurePageSlice.reducer;
