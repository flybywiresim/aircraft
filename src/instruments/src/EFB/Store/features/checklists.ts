import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, store } from '../store';

interface ChecklistItem {
    completed: boolean;
}

interface Checklist {
    name: string;
    items: ChecklistItem[]
}

interface ChecklistState {
    checklists: Checklist[],
    selectedChecklistIndex: number,
}

const initialState: ChecklistState = {
    selectedChecklistIndex: 0,
    checklists: [
        {
            name: 'Before Start',
            items: [],
        },
        {
            name: 'After Start',
            items: [],
        },
        {
            name: 'Before Takeoff',
            items: [],
        },
        {
            name: 'After Takeoff / Climb',
            items: [],
        },
        {
            name: 'Approach',
            items: [],
        },
        {
            name: 'Landing',
            items: [],
        },
        {
            name: 'After Landing',
            items: [],
        },
        {
            name: 'Parking',
            items: [],
        },
        {
            name: 'Securing Aircraft',
            items: [],
        },
    ],
};

export const checklistsSlice = createSlice({
    name: 'checklists',
    initialState,
    reducers: {
        setChecklistItems: (state, action: PayloadAction<{checklistIndex: number, itemArr: ChecklistItem[] } >) => {
            state.checklists[action.payload.checklistIndex].items = action.payload.itemArr;
        },
        setChecklistItemCompletion: (state, action: PayloadAction<{checklistIndex: number, itemIndex: number, completionValue: boolean}>) => {
            state.checklists[action.payload.checklistIndex].items[action.payload.itemIndex].completed = action.payload.completionValue;
        },
        setSelectedChecklistIndex: (state, action: PayloadAction<number>) => {
            state.selectedChecklistIndex = action.payload;
        },
    },
});

/**
 * @returns The percentage of the checklist that is complete (0-1)
 */
export const getChecklistCompletion = (checklistIndex: number): number => {
    const checklists = (store.getState() as RootState).checklists.checklists[checklistIndex];
    const numCompletedItems = checklists.items.filter((item) => item.completed).length;
    return numCompletedItems / checklists.items.length;
};

/**
 * @returns If the specified checklist has all of its items completed
 */
export const isChecklistCompleted = (checklistIndex: number): boolean => getChecklistCompletion(checklistIndex) === 1;

export const { setChecklistItems, setChecklistItemCompletion, setSelectedChecklistIndex } = checklistsSlice.actions;
export default checklistsSlice.reducer;
