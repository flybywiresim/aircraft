/*
 * A32NX
 * Copyright (C) 2020 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
/* global EmptyCallback */
import React, { useState } from 'react';

import { ScratchpadMessage } from '@fmgc/lib/ScratchpadMessage';
import { useSimVar } from '@instruments/common/simVars';
import { SLEW_KEYS } from '../../../Components/Buttons';
import * as titlebarActions from '../../../redux/actions/titlebarActionCreators';
import * as scratchpadActions from '../../../redux/actions/scratchpadActionCreators';
import * as mcduActions from '../../../redux/actions/mcduActionCreators';
import InitAPage from './InitA';
import InitBPage from './InitB';

import { useInteractionEvent } from '../../../../Common/hooks';
import { useMCDUDispatch, useMCDUSelector } from '../../../redux/hooks';

const InitPage: React.FC = () => {
    const scratchpad = useMCDUSelector((state) => state.scratchpad);
    const fmgc = useMCDUSelector((state) => state.mcduData);

    const dispatch = useMCDUDispatch();
    const setZFW = (msg: number | undefined) => {
        dispatch(mcduActions.setZFW(msg));
    };
    const setZFWCG = (msg: number | undefined) => {
        dispatch(mcduActions.setZFWCG(msg));
    };
    const setZFWCGEntered = (entered: boolean) => {
        dispatch(mcduActions.setZFWCGEntered(entered));
    };
    const setTitlebarText = (msg: string) => {
        dispatch(titlebarActions.setTitleBarText(msg));
    };
    const setScratchpad = (msg: string) => {
        dispatch(scratchpadActions.setScratchpad(msg));
    };
    const clearScratchpad = () => {
        dispatch(scratchpadActions.clearScratchpad());
    };
    const addMessage = (msg: ScratchpadMessage) => {
        dispatch(scratchpadActions.addScratchpadMessage(msg));
    };

    const [, setFplTemp] = useSimVar('L:FMC_FLIGHT_PLAN_IS_TEMPORARY', 'number');
    const [, showTempFpl] = useSimVar('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'number');

    // Move this to the page container
    const eraseTemporaryFlightPlan = (callback = EmptyCallback.Void) => {
        fmgc.flightPlanManager?.setCurrentFlightPlanIndex(0, () => {
            setFplTemp(0);
            showTempFpl(0);
            callback();
        });
    };

    const pages = {
        A: <InitAPage
            scratchpad={scratchpad}
            clearScratchpad={clearScratchpad}
            addMessage={addMessage}
            setTitlebarText={setTitlebarText}
            fmgc={fmgc}
            eraseTempFpl={eraseTemporaryFlightPlan}
        />,
        B: <InitBPage
            addScratchpadMessage={addMessage}
            setTitlebarText={setTitlebarText}
            mcduData={fmgc}
            setScratchpad={setScratchpad}
            scratchpad={scratchpad}
            setZFW={setZFW}
            setZFWCG={setZFWCG}
            setZFWCGEntered={setZFWCGEntered}
        />,
    };
    const [currentPage, setCurrentPage] = useState('A');

    function determinePage() {
        if (currentPage === 'A') {
            return 'B';
        }
        return 'A';
    }

    useInteractionEvent(SLEW_KEYS.RARROW, () => setCurrentPage(determinePage()));
    useInteractionEvent(SLEW_KEYS.LARROW, () => setCurrentPage(determinePage()));

    return pages[currentPage];
};

export default InitPage;
