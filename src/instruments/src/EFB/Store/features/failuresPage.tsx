import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export enum FailurePageLayoutMode {
    COMFORT,
    COMPACT,
}

interface FailurePageState {
    searchQuery: string;
    layoutMode: FailurePageLayoutMode;
}

const FailurePageInitialState: FailurePageState = {
    searchQuery: '',
    layoutMode: FailurePageLayoutMode.COMFORT,
};

export const failurePageSlice = createSlice({
    name: 'failurePage',
    initialState: FailurePageInitialState,
    reducers: {
        setSearchQuery: (state, action: PayloadAction<string>) => {
            state.searchQuery = action.payload;
        },
        setLayoutMode: (state, action: PayloadAction<FailurePageLayoutMode>) => {
            state.layoutMode = action.payload;
        },
    },
});

export const { setSearchQuery, setLayoutMode } = failurePageSlice.actions;
export default failurePageSlice.reducer;
