import * as titlebarActions from '../types/TitlebarActionTypes';

export type titleBarState = {
    text: String
};

const initialState : titleBarState = { text: 'FLYBYWIRE' };

export const titlebarReducer = (state = initialState, action) => {
    switch (action.type) {
    case titlebarActions.SET_TITLEBAR_TEXT:
        return {
            ...state,
            text: action.text,
        };
    default:
        return state;
    }
};
