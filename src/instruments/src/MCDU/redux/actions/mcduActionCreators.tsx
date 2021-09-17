import * as mcduTypes from '../types/mcduActionTypes';

export const setZFW = (zfw: number | undefined) => ({
    type: mcduTypes.SET_ZFW,
    zfw,
});

export const setZFWCG = (zfwcg: number | undefined) => ({
    type: mcduTypes.SET_ZFW_CG,
    zfwcg,
});

export const setZFWCGEntered = (entered: boolean) => ({
    type: mcduTypes.SET_ZFW_ENTERED,
    entered,
});
