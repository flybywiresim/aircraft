import * as scratchpadActions from '../types/scratchpadActionTypes';

export type scratchpadState = {
    text: String
}
const initialState : scratchpadState = { text: 'SCRATCHPAD' };

export const scratchpadReducer = (state = initialState, action) => {
    switch (action.type) {
    case scratchpadActions.ADD_SCRATCHPAD_TEXT:
        return {
            ...state,
            text: action.text,
        };
    case scratchpadActions.REMOVE_SCRATCHPAD_TEXT:
        return {
            ...state,
            text: '',
        };
    case scratchpadActions.SET_SCRATCHPAD_TEXT:
        return {
            ...state,
            text: action.text,
        };
    default:
        return state;
    }
};
