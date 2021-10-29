import { ADD_ACTIVE_BUTTON, ADD_DISABLED_BUTTON, REMOVE_ACTIVE_BUTTON, REMOVE_DISABLED_BUTTON, SET_ACTIVE_BUTTONS, SET_TUG_REQUEST_ONLY, SET_PUSH_BACK_WAIT_TIMER_HANDLE } from '../actions';

export const addActiveButton = (button) => ({
    type: ADD_ACTIVE_BUTTON,
    button,
});

export const removeActiveButton = (elementIndex) => ({
    type: REMOVE_ACTIVE_BUTTON,
    elementIndex,
});

export const setActiveButtons = (updatedButtons) => ({
    type: SET_ACTIVE_BUTTONS,
    updatedButtons,
});

export const addDisabledButton = (button) => ({
    type: ADD_DISABLED_BUTTON,
    button,
});

export const removeDisabledButton = (elementIndex) => ({
    type: REMOVE_DISABLED_BUTTON,
    elementIndex,
});

export const setTugRequestOnly = (tugRequest) => ({
    type: SET_TUG_REQUEST_ONLY,
    tugRequest,
});

export const setPushBackWaitTimerHandle = (pushBackWaitTimerHandle) => ({
    type: SET_PUSH_BACK_WAIT_TIMER_HANDLE,
    pushBackWaitTimerHandle,
});
