import { createSlice } from '@reduxjs/toolkit';
import { TypedAction } from '../store';

type ActiveButton = { id: string, state: string, callBack, value };

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
                state.activeButtons.splice(action.payload, 1);
            }
            console.log(state.activeButtons);
        },
        updateButton: (state, action: TypedAction<ActiveButton>) => {
            const button = state.activeButtons.findIndex((b) => action.payload.id === b.id);
            const updatedButton: ActiveButton = { id: action.payload.id, value: action.payload.value, state: 'ACTIVE', callBack: action.payload.callBack };
            if (button !== -1) {
                state.activeButtons[button] = updatedButton;
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
                state.disabledButtons.splice(action.payload, 1);
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

export const {
    addActiveButton, addDisabledButton, removeActiveButton, removeDisabledButton,
    setActiveButtons, setPushbackWaitTimerHandle, setTugRequestOnly, updateButton,
} = buttonsSlice.actions;

export default buttonsSlice.reducer;
