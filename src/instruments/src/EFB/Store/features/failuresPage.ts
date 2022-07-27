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
