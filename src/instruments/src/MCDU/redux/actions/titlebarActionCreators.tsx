import { lineColors, lineSides } from '../../Components/Lines/Line';
import * as titlebarTypes from '../types/TitlebarActionTypes';

export const setTitleBarText = (text : string) => ({
    type: titlebarTypes.SET_TITLEBAR_TEXT,
    text,
});

export const setTitleBarColor = (color : lineColors) => ({
    type: titlebarTypes.SET_TITLEBAR_COLOUR,
    color,
});

export const setTitleBarSide = (side : lineSides) => ({
    type: titlebarTypes.SET_TITLEBAR_ORIENTATION,
    side,
});
