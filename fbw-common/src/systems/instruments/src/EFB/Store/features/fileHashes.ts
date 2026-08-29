// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { HashMismatchResult } from '../../Utils/fileHashes';

const initialState: { mismatches: HashMismatchResult[] } = { mismatches: [] };

export const fileHashesSlice = createSlice({
  name: 'fileHashes',
  initialState,
  reducers: {
    setFileHashMismatches: (state, action: PayloadAction<HashMismatchResult[]>) => {
      state.mismatches = action.payload;
    },
  },
});

export const { setFileHashMismatches } = fileHashesSlice.actions;
export default fileHashesSlice.reducer;
