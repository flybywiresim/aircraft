import { lineArrow } from '../../Components/Lines/Line';
import { scratchpadMessage } from '../reducers/scratchpadRedcuer';
import * as scratchpadTypes from '../types/scratchpadActionTypes';

/**
 * Clears the entire scratchpad
 */
export const clearScratchpad = () => ({ type: scratchpadTypes.CLEAR_SCRATCHPAD });

/**
 * Used for the when the clear button is pressed
 */
export const clearScratchpadCharacter = () => ({ type: scratchpadTypes.CLEAR_SCRATCHPAD_CHARACTER });

/**
 * Adds a message to the messaging systems
 * @param msg the message to the messaging systems
 */
export const addNewMessage = (msg : scratchpadMessage) => ({
    type: scratchpadTypes.ADD_SCRATCHPAD_MESSAGE,
    msg,
});

/**
 * Adds a message to the scratchpad directly
 * @param msg The string to add to the scratchpad
 */
export const addToScratchpad = (msg: string) => ({
    type: scratchpadTypes.ADD_TO_SCRATCHPAD,
    msg,
});

/**
 * Adds a plus or minus to the scratchpad
 */
export const addPlusMinus = () => ({ type: scratchpadTypes.ADD_PLUSMINUS_SCRATCHPAD });

export const addArrow = (arrowChange: lineArrow) => ({
    type: scratchpadTypes.ADD_ARROW_SCRATCHPAD,
    msg: arrowChange,
});
