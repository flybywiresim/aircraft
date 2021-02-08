import typeToReducer from 'type-to-reducer';
import {SET_TOD_DATA} from '../actions';

type state = {
    groundSpeed: {from: number, groundSpeed?: number}[],
    currentAltitude?: number,
    targetAltitude?: number,
    calculation?: {
        input: number,
        type: 'VERTICAL_SPEED' | 'DISTANCE'
    }
};

const initialState: state = {
    groundSpeed: [{from: 0, groundSpeed: undefined}],
    currentAltitude: undefined,
    targetAltitude: undefined,
    calculation: undefined
};

export const todCalculatorReducer = typeToReducer(
    {
        [SET_TOD_DATA]: (state, { data }) => ({
            ...state,
            ...data
        })
    },
    initialState
);
