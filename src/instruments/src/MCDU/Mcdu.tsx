import React, { useEffect } from 'react';

import './styles.scss';

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { NavRadioManager } from '@fmgc/radionav/NavRadioManager';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { getRootElement } from '@instruments/common/defaults';
import { FMCDataManager } from '@fmgc/lib/FMCDataManager';
import * as mcduActions from './redux/actions/mcduActionCreators';
import Scratchpad from './Scratchpad/Scratchpad';
import PagesContainer from './Pages/PagesContainer';
import Titlebar from './Titlebar/Titlebar';
import { useMCDUSelector, useMCDUDispatch } from './redux/hooks';

const MCDU = () => {
    const fmgc = useMCDUSelector((state) => state.mcduData);
    const dispatch = useMCDUDispatch();

    const initFMGC = () => {
        dispatch(mcduActions.SET_FPM(new FlightPlanManager(getRootElement() as any)));
        dispatch(mcduActions.SET_FP(new ManagedFlightPlan()));
        if (fmgc.flightPlanManager !== undefined && fmgc.guidanceManager !== undefined) {
            dispatch(mcduActions.SET_GM(new GuidanceManager(fmgc.flightPlanManager)));
            dispatch(mcduActions.SET_GC(new GuidanceController(fmgc.flightPlanManager, fmgc.guidanceManager)));
        }
        dispatch(mcduActions.SET_NRM(new NavRadioManager(getRootElement() as any)));
        dispatch(mcduActions.SET_FMC_DATA_MANAGER(new FMCDataManager(getRootElement() as any)));
        fmgc.guidanceController?.init();
    };

    useEffect(() => {
        initFMGC();
    }, []);

    return (
        <div className="mcdu-outer">
            <div className="mcdu-inner">
                <Titlebar />
                <div className="mcdu-content">
                    <PagesContainer />
                </div>
                <Scratchpad />
            </div>
        </div>

    );
};

export default MCDU;
