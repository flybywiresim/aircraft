import { lineColors, lineSides } from '../../Components/Lines/Line';
import * as titlebarActions from '../types/TitlebarActionTypes';

export type titleBarState = {
    text: String,
    color: lineColors,
    orientation: lineSides,
};

const initialState : titleBarState = { text: 'FLYBYWIRE', color: lineColors.white, orientation: lineSides.center };

export const titlebarReducer = (state = initialState, action) => {
    switch (action.type) {
    case titlebarActions.SET_TITLEBAR_TEXT:
        return {
            ...state,
            text: action.text,
        };
    case titlebarActions.SET_TITLEBAR_COLOUR:
        return {
            ...state,
            color: action.color,
        };
    case titlebarActions.SET_TITLEBAR_ORIENTATION:
        return {
            ...state,
            orientation: action.side,
        };
    default:
        return state;
    }
};
