// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ChecklistJsonDefinition } from '@flybywiresim/fbw-sdk';
import { RootState, store } from '../store';

interface ChecklistTrackingItem {
  completed: boolean;
  hasCondition: boolean;
}

export interface TrackingChecklist {
  name: string;
  items: ChecklistTrackingItem[];
  markedCompleted: boolean;
}

interface ChecklistState {
  aircraftChecklists: ChecklistJsonDefinition[];
  checklists: TrackingChecklist[];
  selectedChecklistIndex: number;
}

const initialState: ChecklistState = {
  aircraftChecklists: [],
  selectedChecklistIndex: 0,
  checklists: [],
};

export const checklistsSlice = createSlice({
  name: 'checklists',
  initialState,
  reducers: {
    setAircraftChecklists: (state, action: PayloadAction<ChecklistJsonDefinition[]>) => {
      state.aircraftChecklists = action.payload;
    },
    addTrackingChecklists: (
      state,
      action: PayloadAction<{ checklistName: string; checklistIndex: number; itemArr: ChecklistTrackingItem[] }>,
    ) => {
      state.checklists.push({
        name: action.payload.checklistName,
        items: action.payload.itemArr,
        markedCompleted: false,
      });
    },
    setChecklistItemCompletion: (
      state,
      action: PayloadAction<{ checklistIndex: number; itemIndex: number; completionValue: boolean }>,
    ) => {
      state.checklists[action.payload.checklistIndex].items[action.payload.itemIndex].completed =
        action.payload.completionValue;
    },
    setSelectedChecklistIndex: (state, action: PayloadAction<number>) => {
      state.selectedChecklistIndex = action.payload;
    },
    setChecklistCompletion: (state, action: PayloadAction<{ checklistIndex: number; completion: boolean }>) => {
      state.checklists[action.payload.checklistIndex].markedCompleted = action.payload.completion;
    },
  },
});

/**
 * @returns The percentage of the checklist that is complete (0-1)
 */
export const getChecklistCompletion = (checklistIndex: number): number => {
  const checklists = (store.getState() as RootState).trackingChecklists.checklists[checklistIndex];
  const numCompletedItems = checklists.items.filter((item) => item.completed).length;
  return numCompletedItems / checklists.items.length;
};

/**
 * @returns If the specified checklist has all of its items completed
 */
export const areAllChecklistItemsCompleted = (checklistIndex: number): boolean =>
  getChecklistCompletion(checklistIndex) === 1;

export const {
  setAircraftChecklists,
  addTrackingChecklists,
  setChecklistItemCompletion,
  setSelectedChecklistIndex,
  setChecklistCompletion,
} = checklistsSlice.actions;
export default checklistsSlice.reducer;
