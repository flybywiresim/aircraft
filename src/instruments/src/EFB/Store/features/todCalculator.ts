import { createSlice } from '@reduxjs/toolkit';

import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode';
import { groundSpeed } from '../../Service/TODCalculator';
import { TypedAction } from '../store';

type TodCalculatorState = {
    groundSpeed: groundSpeed[],
    groundSpeedMode: TOD_INPUT_MODE,
    currentAltitudeMode: TOD_INPUT_MODE,
    calculationInputMode: TOD_INPUT_MODE,
    currentAltitude?: number,
    targetAltitude?: number,
    calculation: {
        input?: number,
        type?: TOD_CALCULATION_TYPE
    }
};

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
        setTodData: (state, action: TypedAction<any>) => ({
            ...state,
            ...action.payload,
        }),
        addTodGroundSpeed: (state, action: TypedAction<groundSpeed>) => {
            state.groundSpeed.push(action.payload);
        },
        removeTodGroundSpeed: (state, action: TypedAction<number>) => {
            state.groundSpeed.splice(action.payload, 1);
        },
        setTodGroundSpeed: (state, action: TypedAction<{index: number, value: groundSpeed}>) => {
            state.groundSpeed[action.payload.index] = action.payload.value;
        },
        setTodGroundSpeedMode: (state, action: TypedAction<TOD_INPUT_MODE>) => {
            if (action.payload === TOD_INPUT_MODE.AUTO) {
                state.groundSpeed = initialState.groundSpeed;
            }

            return ({
                ...state,
                ...{ groundSpeedMode: action.payload },
            });
        },
        setTodCurrentAltitudeSync: (state, action: TypedAction<boolean>) => ({
            ...state,
            ...{ currentAltitudeMode: action.payload ? TOD_INPUT_MODE.AUTO : TOD_INPUT_MODE.MANUAL },
        }),
        clearTodGroundSpeed: (state) => {
            state.groundSpeed = initialState.groundSpeed;
        },
    },
});

export const { setTodData, addTodGroundSpeed, removeTodGroundSpeed, setTodGroundSpeed, setTodGroundSpeedMode, clearTodGroundSpeed, setTodCurrentAltitudeSync } = todCalculatorSlice.actions;

export default todCalculatorSlice.reducer;
