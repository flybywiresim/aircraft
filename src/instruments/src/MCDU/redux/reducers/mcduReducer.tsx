import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { NavRadioManager } from '@fmgc/radionav/NavRadioManager';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { FMCDataManager } from '@fmgc/lib/FMCDataManager';
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

export const SET_FPM = (state: mcduState, fpm: FlightPlanManager) => ({
    ...state,
    flightPlanManager: fpm,
});

export const SET_FP = (state: mcduState, fp: ManagedFlightPlan) => ({
    ...state,
    flightPlan: fp,
});

export const SET_GC = (state: mcduState, gc: GuidanceController) => ({
    ...state,
    guidanceController: gc,
});

export const SET_GM = (state: mcduState, gm: GuidanceManager) => ({
    ...state,
    guidanceManager: gm,
});

export const SET_NRM = (state: mcduState, rm: NavRadioManager) => ({
    ...state,
    navRadioManager: rm,
});

export const SET_FMC_DM = (state: mcduState, dm: FMCDataManager) => ({
    ...state,
    fmcDataManager: dm,
});

export type mcduState = {
    zfw: number | undefined,
    zfwCG: number | undefined,
    zfwCGEntered: boolean,
    flightPlanManager: FlightPlanManager | undefined,
    flightPlan: ManagedFlightPlan | undefined,
    guidanceController: GuidanceController | undefined,
    guidanceManager: GuidanceManager | undefined,
    navRadioManager: NavRadioManager | undefined,
    fmcDataManager: FMCDataManager | undefined
}

const initialState: mcduState = {
    zfw: undefined,
    zfwCG: undefined,
    zfwCGEntered: false,
    flightPlanManager: undefined,
    flightPlan: undefined,
    guidanceController: undefined,
    guidanceManager: undefined,
    navRadioManager: undefined,
    fmcDataManager: undefined,
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
    case mcduActions.SET_FPM:
        return SET_FPM(state, payload.fpm);
    case mcduActions.SET_FP:
        return SET_FP(state, payload.fp);
    case mcduActions.SET_GC:
        return SET_GC(state, payload.gc);
    case mcduActions.SET_GM:
        return SET_GM(state, payload.gm);
    case mcduActions.SET_NRM:
        return SET_NRM(state, payload.rm);
    case mcduActions.SET_FMC_DM:
        return SET_FMC_DM(state, payload.dataManager);
    default:
        return state;
    }
};
