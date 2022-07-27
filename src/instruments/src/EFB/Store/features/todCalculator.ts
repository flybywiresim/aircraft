import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode';
import { groundSpeed } from '../../Service/TODCalculator';

interface TodCalculatorState {
    groundSpeed: groundSpeed[];
    groundSpeedMode: TOD_INPUT_MODE;
    currentAltitudeMode: TOD_INPUT_MODE;
    calculationInputMode: TOD_INPUT_MODE;
    currentAltitude?: number;
    targetAltitude?: number;
    calculation: {
        input?: number;
        type?: TOD_CALCULATION_TYPE;
    }
}

const initialState: TodCalculatorState = {
    groundSpeed: [{ from: 0, groundSpeed: 0 }, { from: 10000, groundSpeed: 0 }],
    groundSpeedMode: TOD_INPUT_MODE.AUTO,
    currentAltitudeMode: TOD_INPUT_MODE.MANUAL,
    calculationInputMode: TOD_INPUT_MODE.MANUAL,
    currentAltitude: undefined,
    targetAltitude: undefined,
    calculation: {
        input: 3,
        type: TOD_CALCULATION_TYPE.FLIGHT_PATH_ANGLE,
    },
};

export const todCalculatorSlice = createSlice({
    name: 'todCalculator',
    initialState,
    reducers: {
        setTodData: (state, action: PayloadAction<Partial<TodCalculatorState>>) => {
            Object.keys(action.payload).forEach((key) => {
                state[key] = action.payload[key];
            });
        },
        addTodGroundSpeed: (state, action: PayloadAction<groundSpeed>) => {
            state.groundSpeed.push(action.payload);
        },
        removeTodGroundSpeed: (state, action: PayloadAction<number>) => {
            state.groundSpeed.splice(action.payload, 1);
        },
        setTodGroundSpeed: (state, action: PayloadAction<{index: number, value: groundSpeed}>) => {
            state.groundSpeed[action.payload.index] = action.payload.value;
        },
        setTodGroundSpeedMode: (state, action: PayloadAction<TOD_INPUT_MODE>) => {
            state.groundSpeedMode = action.payload;
        },
        setTodCurrentAltitudeSync: (state, action: PayloadAction<boolean>) => {
            state.currentAltitudeMode = action.payload ? TOD_INPUT_MODE.AUTO : TOD_INPUT_MODE.MANUAL;
        },
    },
});

export const {
    setTodData,
    addTodGroundSpeed,
    removeTodGroundSpeed,
    setTodGroundSpeed,
    setTodGroundSpeedMode,
    setTodCurrentAltitudeSync,
} = todCalculatorSlice.actions;

export default todCalculatorSlice.reducer;
