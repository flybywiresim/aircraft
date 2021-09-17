import React, { useState } from 'react';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { useMCDUSelector, useMCDUDispatch } from '../../../redux/hooks';
import FPlanPage from './FplanA';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';

export const Markers = {
    FPLN_DISCONTINUITY: '---F-PLN DISCONTINUITY--',
    END_OF_FPLN: '------END OF F-PLN------',
    NO_ALTN_FPLN: '-----NO ALTN F-PLN------',
    END_OF_ALTN_FPLN: '---END OF ALT F-PLN----',
    TOO_STEEP_PATH: '-----TOO STEEP PATH-----',
};

export enum FPlanPages {
    A,
    B
}

type FPlanHolderProps = {
    eraseTemporaryFlightPlan: (fpm: FlightPlanManager) => void
    insertTemporaryFlightPlan: (fpm: FlightPlanManager) => void
}
const FplanHolder: React.FC<FPlanHolderProps> = ({ eraseTemporaryFlightPlan, insertTemporaryFlightPlan }) => {
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const fmgc = useMCDUSelector((state) => state.mcduData);
    const [currentPage, setCurrentPage] = useState('A');
    const [fplanPage, setFplanPage] = useState<FPlanPages>(FPlanPages.A);

    const dispatch = useMCDUDispatch();
    const setTitlebarText = (msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    };

    const pages = {
        A: <FPlanPage
            setTitlebarText={setTitlebarText}
            fmgc={fmgc}
            eraseTemporaryFlightPlan={eraseTemporaryFlightPlan}
            insertTemporaryFlightPlan={insertTemporaryFlightPlan}
        />,
    };

    return pages[currentPage];
};

export default FplanHolder;
