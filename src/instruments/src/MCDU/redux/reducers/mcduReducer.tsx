import * as mcduActions from '../types/mcduActionTypes';

const setZFW = (state: mcduState, msg: number | undefined) => ({
    ...state,
    zfw: msg,
});

const setZFWCG = (state: mcduState, msg: number | undefined) => ({
    ...state,
    zfwCG: msg,
});

const setZFWCGEntered = (state: mcduState, entered: boolean) => ({
    ...state,
    zfwCGEntered: entered,
});

export type mcduState = {
    zfw: number | undefined,
    zfwCG: number | undefined,
    zfwCGEntered: boolean
}

const initialState: mcduState = {
    zfw: undefined,
    zfwCG: undefined,
    zfwCGEntered: false,

};

// Shouldn't this be FMGC reducer?
export const mcduReducer = (state = initialState, payload) => {
    switch (payload.type) {
    case mcduActions.SET_ZFW:
        return setZFW(state, payload.zfw);
    case mcduActions.SET_ZFW_CG:
        return setZFWCG(state, payload.zfwcg);
    case mcduActions.SET_ZFW_ENTERED:
        return setZFWCGEntered(state, payload.entered);
    default:
        return { ...state };
    }
};
