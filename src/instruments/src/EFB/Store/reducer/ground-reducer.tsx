import typeToReducer from 'type-to-reducer';
import {
    ADD_ACTIVE_BUTTON,
    REMOVE_ACTIVE_BUTTON,
    ADD_DISABLED_BUTTON,
    SET_ACTIVE_BUTTONS,
    REMOVE_DISABLED_BUTTON,
    SET_TUG_REQUEST_ONLY,
} from '../actions';

type ButtonSelectionState = {
    activeButtons: any[];
    disabledButtons: string[];
    tugRequestOnly: boolean,

};

const initialState: ButtonSelectionState = {
    activeButtons: [],
    disabledButtons: [],
    tugRequestOnly: false,
};

export const buttonsReducer = typeToReducer(
    {
        [ADD_ACTIVE_BUTTON]: (state, { button }) => ({
            ...state,
            activeButtons: [...state.activeButtons, button],
        }),

        [REMOVE_ACTIVE_BUTTON]: (state, { elementIndex }) => {
            const activeButtons = [...state.activeButtons];
            if (elementIndex !== -1) {
                activeButtons.splice(elementIndex, 1);
            }
            return {
                ...state,
                activeButtons,
            };
        },
        [SET_ACTIVE_BUTTONS]: (state, { updatedButtons }) => ({
            ...state,
            activeButtons: updatedButtons,
        }),
        [ADD_DISABLED_BUTTON]: (state, { button }) => ({
            ...state,
            disabledButtons: [...state.disabledButtons, button],
        }),
        [REMOVE_DISABLED_BUTTON]: (state, { elementIndex }) => {
            const disabledButtons = [...state.disabledButtons];
            if (elementIndex !== -1) {
                disabledButtons.splice(elementIndex, 1);
            }
            return {
                ...state,
                disabledButtons,
            };
        },
        [SET_TUG_REQUEST_ONLY]: (state, { tugRequest }) => ({
            ...state,
            tugRequestOnly: tugRequest,
        }),
    },
    initialState,
);
