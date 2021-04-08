import typeToReducer from 'type-to-reducer';
import {
    ADD_TOD_GROUND_SPEED,
    CLEAR_TOD_GROUND_SPEED,
    REMOVE_TOD_GROUND_SPEED,
    SET_TOD_DATA,
    SET_TOD_GROUND_SPEED,
} from '../actions';
import { TOD_CALCULATION_TYPE } from '../../Enum/TODCalculationType.enum';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode.enum';

type TodCalculatorState = {
    groundSpeed: {from: number, groundSpeed?: number}[],
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
    groundSpeed: [{ from: 0, groundSpeed: undefined }, { from: 10000, groundSpeed: undefined }],
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

export const todCalculatorReducer = typeToReducer(
    {
        [SET_TOD_DATA]: (state, { data }) => ({
            ...state,
            ...data,
        }),
        [ADD_TOD_GROUND_SPEED]: (state, { groundSpeed }) => ({
            ...state,
            groundSpeed: [...state.groundSpeed, groundSpeed],
        }),
        [REMOVE_TOD_GROUND_SPEED]: (state, { elementIndex }) => {
            const groundSpeed = [...state.groundSpeed];
            groundSpeed.splice(elementIndex, 1);

            return {
                ...state,
                groundSpeed,
            };
        },
        [SET_TOD_GROUND_SPEED]: (state, { elementIndex, groundSpeed }) => {
            const stateGroundSpeed = [...state.groundSpeed];
            stateGroundSpeed[elementIndex] = { ...stateGroundSpeed[elementIndex], ...groundSpeed };

            return {
                ...state,
                groundSpeed: stateGroundSpeed,
            };
        },
        [CLEAR_TOD_GROUND_SPEED]: (state) => ({
            ...state,
            groundSpeed: initialState.groundSpeed,
        }),
    },
    initialState,
);
