import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type ActiveButton = { id: string, state: string, callBack, value };

interface ButtonSelectionState {
    activeButtons:ActiveButton[];
    disabledButtons: string[];
    tugRequestOnly: boolean;
    pushBackWaitTimerHandle: number;
}

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
        addActiveButton: (state, action: PayloadAction<ActiveButton>) => {
            state.activeButtons.push(action.payload);
        },
        removeActiveButton: (state, action: PayloadAction<number>) => {
            if (action.payload !== -1) {
                state.activeButtons.splice(action.payload, 1);
            }
        },
        updateButton: (state, action: PayloadAction<ActiveButton>) => {
            const button = state.activeButtons.findIndex((b) => action.payload.id === b.id);
            const updatedButton: ActiveButton = { id: action.payload.id, value: action.payload.value, state: 'ACTIVE', callBack: action.payload.callBack };
            if (button !== -1) {
                state.activeButtons[button] = updatedButton;
            }
        },
        setActiveButtons: (state, action: PayloadAction<ActiveButton[]>) => {
            state.activeButtons = action.payload;
        },
        addDisabledButton: (state, action: PayloadAction<string>) => {
            state.disabledButtons.push(action.payload);
        },
        removeDisabledButton: (state, action: PayloadAction<number>) => {
            if (action.payload !== -1) {
                state.disabledButtons.splice(action.payload, 1);
            }
        },
        setTugRequestOnly: (state, action: PayloadAction<boolean>) => {
            state.tugRequestOnly = action.payload;
        },
        setPushbackWaitTimerHandle: (state, action: PayloadAction<number>) => {
            state.pushBackWaitTimerHandle = action.payload;
        },
    },
});

export const {
    addActiveButton, addDisabledButton, removeActiveButton, removeDisabledButton,
    setActiveButtons, setPushbackWaitTimerHandle, setTugRequestOnly, updateButton,
} = buttonsSlice.actions;

export default buttonsSlice.reducer;
