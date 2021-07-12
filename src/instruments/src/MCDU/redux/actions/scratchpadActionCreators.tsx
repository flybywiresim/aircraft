import * as scratchpadTypes from '../types/scratchpadActionTypes';

export const setScratchpadText = (text) => ({
    type: scratchpadTypes.SET_SCRATCHPAD_TEXT,
    text,
});

export const removeScratchpadText = () => ({ type: scratchpadTypes.REMOVE_SCRATCHPAD_TEXT });

export const addScratchpadText = (text) => ({
    type: scratchpadTypes.ADD_SCRATCHPAD_TEXT,
    text,
});
