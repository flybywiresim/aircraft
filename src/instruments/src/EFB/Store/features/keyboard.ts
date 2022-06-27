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
