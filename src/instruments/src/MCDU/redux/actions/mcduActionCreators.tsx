import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { NavRadioManager } from '@fmgc/radionav/NavRadioManager';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { FMCDataManager } from '@fmgc/lib/FMCDataManager';
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
export const SET_FPM = (fpm: FlightPlanManager) => ({
    type: mcduTypes.SET_FPM,
    fpm,
});
export const SET_FP = (fp: ManagedFlightPlan) => ({
    type: mcduTypes.SET_FP,
    fp,
});
export const SET_GC = (gc: GuidanceController) => ({
    type: mcduTypes.SET_GC,
    gc,
});
export const SET_GM = (gm: GuidanceManager) => ({
    type: mcduTypes.SET_GM,
    gm,
});
export const SET_NRM = (rm: NavRadioManager) => ({
    type: mcduTypes.SET_NRM,
    rm,
});
export const SET_FMC_DATA_MANAGER = (dataManager: FMCDataManager) => ({
    type: mcduTypes.SET_FMC_DM,
    dataManager,
});
