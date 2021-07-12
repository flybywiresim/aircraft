import * as titlebarTypes from '../types/TitlebarActionTypes';

export const setTitleBarText = (text) => ({
    type: titlebarTypes.SET_TITLEBAR_TEXT,
    text,
});
