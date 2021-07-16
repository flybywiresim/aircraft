import { lineColors, lineSides } from '../../Components/Lines/Line';
import * as titlebarActions from '../types/TitlebarActionTypes';

export type titleBarState = {
    text: String,
    color: lineColors,
    orientation: lineSides,
};

const setText = (state: titleBarState, msg: titleBarState) => ({
    ...state,
    text: msg,
});

const setColor = (state: titleBarState, newColor: lineColors) => ({
    ...state,
    color: newColor,
});

const setSide = (state: titleBarState, newSide: lineSides) => ({
    ...state,
    orientation: newSide,
});
const initialState : titleBarState = { text: 'FLYBYWIRE', color: lineColors.white, orientation: lineSides.center };

export const titlebarReducer = (state = initialState, action) => {
    switch (action.type) {
    case titlebarActions.SET_TITLEBAR_TEXT:
        return setText(state, action.text);
    case titlebarActions.SET_TITLEBAR_COLOUR:
        return setColor(state, action.color);
    case titlebarActions.SET_TITLEBAR_ORIENTATION:
        return setSide(state, action.side);
    default:
        return state;
    }
};
