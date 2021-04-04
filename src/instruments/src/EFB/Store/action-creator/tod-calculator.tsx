import {
    ADD_TOD_GROUND_SPEED, CLEAR_TOD_GROUND_SPEED,
    REMOVE_TOD_GROUND_SPEED,
    SET_TOD_DATA,
    SET_TOD_GROUND_SPEED,
} from '../actions';
import { TOD_INPUT_MODE } from '../../Enum/TODInputMode.enum';

export const setTodData = (data) => ({
    type: SET_TOD_DATA,
    data,
});

export const addTodGroundSpeed = (groundSpeed) => ({
    type: ADD_TOD_GROUND_SPEED,
    groundSpeed,
});

export const removeTodGroundSpeed = (elementIndex) => ({
    type: REMOVE_TOD_GROUND_SPEED,
    elementIndex,
});

export const setTodGroundSpeed = (elementIndex, groundSpeed) => ({
    type: SET_TOD_GROUND_SPEED,
    elementIndex,
    groundSpeed,
});

export const setTodGroundSpeedMode = (groundSpeedMode: TOD_INPUT_MODE) => (dispatch) => {
    if (groundSpeedMode === TOD_INPUT_MODE.AUTO) {
        dispatch(clearTodGroundSpeed());
    }

    dispatch(setTodData({ groundSpeedMode }));
};

export const setTodCurrentAltitudeSync = (enabled: boolean) => (dispatch) => {
    dispatch(setTodData({ currentAltitudeMode: enabled ? TOD_INPUT_MODE.AUTO : TOD_INPUT_MODE.MANUAL }));
};

export const clearTodGroundSpeed = () => ({ type: CLEAR_TOD_GROUND_SPEED });
