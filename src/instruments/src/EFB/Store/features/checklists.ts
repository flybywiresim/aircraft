import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState, store } from '../store';

interface ChecklistItem {
    completed: boolean;
    divider?: boolean;
}

interface Checklist {
    name: string;
    items: ChecklistItem[];
    markedCompleted: boolean;
}

interface ChecklistState {
    checklists: Checklist[];
    selectedChecklistIndex: number;
}

const initialState: ChecklistState = {
    selectedChecklistIndex: 0,
    checklists: [
        {
            name: 'Before Start',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'After Start',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'Before Takeoff',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'After Takeoff / Climb',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'Approach',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'Landing',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'After Landing',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'Parking',
            items: [],
            markedCompleted: false,
        },
        {
            name: 'Securing Aircraft',
            items: [],
            markedCompleted: false,
        },
    ],
};

export const checklistsSlice = createSlice({
    name: 'checklists',
    initialState,
    reducers: {
        setChecklistItems: (state, action: PayloadAction<{checklistIndex: number, itemArr: ChecklistItem[]}>) => {
            state.checklists[action.payload.checklistIndex].items = action.payload.itemArr;
        },
        setChecklistItemCompletion: (state, action: PayloadAction<{checklistIndex: number, itemIndex: number, completionValue: boolean}>) => {
            state.checklists[action.payload.checklistIndex].items[action.payload.itemIndex].completed = action.payload.completionValue;
        },
        setSelectedChecklistIndex: (state, action: PayloadAction<number>) => {
            state.selectedChecklistIndex = action.payload;
        },
        setChecklistCompletion: (state, action: PayloadAction<{checklistIndex: number, completion: boolean}>) => {
            state.checklists[action.payload.checklistIndex].markedCompleted = action.payload.completion;
        },
    },
});

/**
 * @returns The percentage of the checklist that is complete (0-1)
 */
export const getChecklistCompletion = (checklistIndex: number): number => {
    const checklists = (store.getState() as RootState).checklists.checklists[checklistIndex];
    const numCompletedItems = checklists.items.filter((item) => item.completed && !item.divider).length;
    return numCompletedItems / checklists.items.filter((item) => !item.divider).length;
};

/**
 * @returns If the specified checklist has all of its items completed
 */
export const areAllChecklistItemsCompleted = (checklistIndex: number): boolean => getChecklistCompletion(checklistIndex) === 1;

export const { setChecklistItems, setChecklistItemCompletion, setSelectedChecklistIndex, setChecklistCompletion } = checklistsSlice.actions;
export default checklistsSlice.reducer;
