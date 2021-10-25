import { createSlice } from '@reduxjs/toolkit';
import { TypedAction } from '../store';

type ActiveButton = { id: string, state: string };

type ButtonSelectionState = {
    activeButtons:ActiveButton[];
    disabledButtons: string[];
    tugRequestOnly: boolean;
    pushBackWaitTimerHandle: number;
};

const initialState: ButtonSelectionState = {
    activeButtons: [],
    disabledButtons: [],
    tugRequestOnly: false,
    pushBackWaitTimerHandle: -1,
};

export const buttonsSlice = createSlice({
    name: 'ground',
    initialState,
    reducers: {
        addActiveButton: (state, action: TypedAction<ActiveButton>) => {
            state.activeButtons.push(action.payload);
        },
        removeActiveButton: (state, action: TypedAction<number>) => {
            if (action.payload !== -1) {
                state.activeButtons = state.activeButtons.splice(action.payload, 1);
            }
        },
        setActiveButtons: (state, action: TypedAction<ActiveButton[]>) => {
            state.activeButtons = action.payload;
        },
        addDisabledButton: (state, action: TypedAction<string>) => {
            state.disabledButtons.push(action.payload);
        },
        removeDisabledButton: (state, action: TypedAction<number>) => {
            if (action.payload !== -1) {
                state.disabledButtons = state.disabledButtons.splice(action.payload, 1);
            }
        },
        setTugRequestOnly: (state, action: TypedAction<boolean>) => {
            state.tugRequestOnly = action.payload;
        },
        setPushbackWaitTimerHandle: (state, action: TypedAction<number>) => {
            state.pushBackWaitTimerHandle = action.payload;
        },
    },
});

export const { addActiveButton, addDisabledButton, removeActiveButton, removeDisabledButton, setActiveButtons, setPushbackWaitTimerHandle, setTugRequestOnly } = buttonsSlice.actions;

export default buttonsSlice.reducer;
