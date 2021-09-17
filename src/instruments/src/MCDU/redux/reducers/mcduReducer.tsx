import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { NavRadioManager } from '@fmgc/radionav/NavRadioManager';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { FMCDataManager } from '@fmgc/lib/FMCDataManager';
import { getRootElement } from '@instruments/common/defaults';
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
    zfwCGEntered: boolean,
    flightPlanManager: FlightPlanManager,
    flightPlan: ManagedFlightPlan,
    guidanceController: GuidanceController,
    guidanceManager: GuidanceManager,
    navRadioManager: NavRadioManager,
    fmcDataManager: FMCDataManager
}

const initFMGCState = () => {
    const fpm = new FlightPlanManager(getRootElement() as any);
    const fp = new ManagedFlightPlan();
    const gm = new GuidanceManager(fpm);
    const gc = new GuidanceController(fpm, gm);
    const nrm = new NavRadioManager(getRootElement() as any);
    const fmcDm = new FMCDataManager(getRootElement() as any);
    return {
        flightPlanManager: fpm,
        flightPlan: fp,
        guidanceController: gc,
        guidanceManager: gm,
        navRadioManager: nrm,
        fmcDataManager: fmcDm,
    };
};

const initialState: mcduState = {
    zfw: undefined,
    zfwCG: undefined,
    zfwCGEntered: false,
    ...initFMGCState(),
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
        return state;
    }
};
