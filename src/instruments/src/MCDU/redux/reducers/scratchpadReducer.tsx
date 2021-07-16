import { lineArrow, lineColors } from '../../Components/Lines/Line';
import * as scratchpadActions from '../types/scratchpadActionTypes';

export type scratchpadMessage = {
    text: string,
    isAmber: Boolean,
    isTypeTwo: Boolean,
    c? : () => {},
    f? : () => {},
}

const MAX_LEN = 24;
const MAX_LEN_ARROW = 22;

/**
 * Show the type one message on the scratchpad while storing the user's input for later retrieval
 * @param state The current state of the scratchpad
 * @param msg The message to be added to the scratchpad
 * @returns The updated state
 */
const addTypeOneMessage = (state: scratchpadState, msg: scratchpadMessage) => {
    if (!state.isDisplayingErrorMessage && !state.isDisplayingTypeTwoMessage && !state.lastUserInput) {
        return {
            ...state,
            isDisplayingErrorMessage: true,
            lastUserInput: state.currentMessage,
            currentMessage: msg.text.toUpperCase(),
            currentColor: msg.isAmber ? lineColors.amber : lineColors.white,
        };
    }
    return {
        ...state,
        isDisplayingErrorMessage: true,
        currentMessage: msg.text.toUpperCase(),
        currentColor: msg.isAmber ? lineColors.amber : lineColors.white,
    };
};

/**
 * @deprecated Not working
 * @todo Finish this
 * @param state the current state of the scratchpad
 * @param msg The type II message to add to the que
 * @returns the updated scratchpad state
 */
const addTypeTwoMessage = (state: scratchpadState, msg: scratchpadMessage) => ({
    ...state,
    messageQueue: [...state.messageQueue, msg],
});

/**
 * Adds a message to the scratchpad messaging systems
 * @param state the current state of the scratchpad
 * @param msg the message to add to the messaging system
 * @returns the updated state
 */
const addMessage = (state: scratchpadState, msg: scratchpadMessage) => {
    if (msg.isTypeTwo) {
        return addTypeTwoMessage(state, msg);
    }
    return addTypeOneMessage(state, msg);
};

const addArrow = (state: scratchpadState, arrowToChange: lineArrow) => ({
    ...state,
    arrow: arrowToChange,
});

/**
 * Adds either a plus or minus character to the front or end of the scratchpad
 * @param state The current state of the scratchpad
 * @returns The updated state of the scratchpad
 */
const addPlusMinus = (state: scratchpadState) => {
    if (state.currentMessage === '') {
        return {
            ...state,
            currentMessage: '-',
        };
    }
    if (state.currentMessage !== 'CLR' && (!state.isDisplayingErrorMessage || !state.isDisplayingTypeTwoMessage)) {
        if (state.currentMessage.slice(-1) === '-') {
            return {
                ...state,
                currentMessage: `${state.currentMessage.slice(0, -1)}+`,
            };
        }
        return {
            ...state,
            currentMessage: `${state.currentMessage}-`,
        };
    }
    return { ...state };
};

/**
 * Edits the current scratchpad text, if an error message is displaying,
 * then it gets overridden by the msg value
 *
 * @todo add Type II capability
 * @param state current state of the MCDU
 * @param msg the input value to add to the scratchpad's current message
 * @returns the updated scratchpad's state
 */
const editCurrentScratchpad = (state: scratchpadState, msg: string) => {
    if (state.isDisplayingErrorMessage) {
        return {
            ...state,
            isDisplayErrorMessage: false,
            currentMessage: msg.toUpperCase(),
            currentColor: lineColors.white,
        };
    }
    if (state.arrow !== lineArrow.none && (`${state.currentMessage}${msg.toUpperCase()}`.length <= MAX_LEN_ARROW)) {
        return {
            ...state,
            currentMessage: `${state.currentMessage}${msg.toUpperCase()}`,
            currentColor: lineColors.white,
        };
    }
    if (state.arrow === lineArrow.none && (`${state.currentMessage}${msg.toUpperCase()}`.length <= MAX_LEN)) {
        return {
            ...state,
            currentMessage: `${state.currentMessage}${msg.toUpperCase()}`,
            currentColor: lineColors.white,
        };
    }
    return { ...state };
};

/**
 * Clears the scratchpad when an error message is showing
 * @param state
 * @returns The updated State
 */
const clearErrorMessage = (state: scratchpadState) => {
    if (state.lastUserInput === 'CLR') {
        return ({
            ...state,
            isDisplayingErrorMessage: false,
            currentMessage: '',
            lastUserInput: '',
            currentColor: lineColors.white,
        });
    }
    return ({
        ...state,
        isDisplayingErrorMessage: false,
        currentMessage: state.lastUserInput,
        lastUserInput: '',
        currentColor: lineColors.white,
    });
};

/**
 * Removes a character from the scratchpad (e.g pressing the CLR button),
 * if and error message is showing then it's cleared and the previous user input is shown
 * @todo add Type II capability
 * @param state the current state of the scratchpad
 * @returns the updated state of the scratchpad
 */
const removeCharacter = (state: scratchpadState) => {
    if (state.isDisplayingErrorMessage) {
        return clearErrorMessage(state);
    }
    if (state.currentMessage === 'CLR') {
        return {
            ...state,
            currentMessage: '',
        };
    }
    if (state.currentMessage === '') {
        return {
            ...state,
            currentMessage: 'CLR',
        };
    }
    return {
        ...state,
        currentMessage: state.currentMessage.slice(0, -1),
        currentColor: lineColors.white,
    };
};

/**
 * Used for when the user press and HOLDS the CLR button
 * @todo add Type II capability
 * @param state the current state of the scratchpad
 * @return the updates state of the scratchpad
 */
const clearScratchpad = (state: scratchpadState) => {
    if (state.isDisplayingErrorMessage) {
        return clearErrorMessage(state);
    }
    return {
        ...state,
        currentMessage: '',
    };
};

/**
 * Used for set the scratchpad text entirely
 * @todo add Type II capability
 * @param state The original state of the scratchpad
 * @param msg The message to replace the current message
 * @returns the updated state of the scratchpad
 */
const setScratchpad = (state: scratchpadState, msg: string) => {
    if (!state.isDisplayingErrorMessage) {
        return {
            ...state,
            currentMessage: msg.toUpperCase(),
        };
    }
    return { ...state };
};

export type scratchpadState = {
    currentMessage: string,
    currentColor: lineColors,
    isDisplayingErrorMessage: Boolean,
    isDisplayingTypeTwoMessage: Boolean,
    lastUserInput: string,
    messageQueue: (Array<scratchpadMessage>),
    arrow: lineArrow,
}

const initialState : scratchpadState = {
    currentMessage: '',
    isDisplayingErrorMessage: false,
    isDisplayingTypeTwoMessage: false,
    lastUserInput: '',
    currentColor: lineColors.white,
    messageQueue: [],
    arrow: lineArrow.none,
};

export const scratchpadReducer = (state = initialState, { type, msg }) => {
    switch (type) {
    case scratchpadActions.ADD_SCRATCHPAD_MESSAGE:
        return addMessage(state, msg);
    case scratchpadActions.ADD_TO_SCRATCHPAD:
        return editCurrentScratchpad(state, msg);
    case scratchpadActions.CLEAR_SCRATCHPAD_CHARACTER:
        return removeCharacter(state);
    case scratchpadActions.CLEAR_SCRATCHPAD:
        return clearScratchpad(state);
    case scratchpadActions.ADD_PLUSMINUS_SCRATCHPAD:
        return addPlusMinus(state);
    case scratchpadActions.SET_SCRATCHPAD:
        return setScratchpad(state, msg);
    case scratchpadActions.ADD_ARROW_SCRATCHPAD:
        return addArrow(state, msg);
    default:
        return { ...state };
    }
};
