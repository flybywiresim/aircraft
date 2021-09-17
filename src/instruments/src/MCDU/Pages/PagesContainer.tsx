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
import React, { useState } from 'react';

import { useSimVar } from '@instruments/common/simVars';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { useInteractionEvent } from '../../Common/hooks';

import InitPage from './FMGC/Init/Init';
import MenuPage from './FMGC/Menu/Menu';
import IdentPage from './FMGC/Ident/Ident';
import { PAGE_KEYS } from '../Components/Buttons';
import FuelPred from './FMGC/Fuel/FuelPred';
import FplanHolder from './FMGC/Fplan/Fplan';

const PagesContainer = () => {
    const [currentPage, setCurrentPage] = useState('MENU');
    const [, setFMCFplanIsTemp] = useSimVar('L:FMC_FLIGHT_PLAN_IS_TEMPORARY', 'number');
    const [, setMapShowTempFplan] = useSimVar('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'number');

    // FIXME: Can I use SetSimVarValue instead?
    const eraseTemporaryFlightPlan = (fpm:FlightPlanManager) => {
        fpm.setCurrentFlightPlanIndex(0, () => {
            setFMCFplanIsTemp(0);
            setMapShowTempFplan(0);
        });
    };

    // TODO: move these into the FPM?
    const insertTemporaryFlightPlan = (fpm:FlightPlanManager) => {
        if (fpm.getCurrentFlightPlanIndex() === 1) {
            fpm.copyCurrentFlightPlanInto(0, () => {
                fpm.setCurrentFlightPlanIndex(0, () => {
                    SimVar.SetSimVarValue('L:FMC_FLIGHT_PLAN_IS_TEMPORARY', 'number', 0);
                    SimVar.SetSimVarValue('L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN', 'number', 0);
                });
            });
        }
    };

    const pages = {
        INIT: <InitPage />,
        MENU: <MenuPage setPage={setCurrentPage} />,
        IDENT: <IdentPage />,
        FUEL: <FuelPred />,
        FPLAN: <FplanHolder eraseTemporaryFlightPlan={eraseTemporaryFlightPlan} insertTemporaryFlightPlan={insertTemporaryFlightPlan} />,
    };

    useInteractionEvent(PAGE_KEYS.INIT, () => setCurrentPage('INIT'));
    useInteractionEvent(PAGE_KEYS.MENU, () => setCurrentPage('MENU'));
    useInteractionEvent(PAGE_KEYS.ATC, () => setCurrentPage('MENU'));
    useInteractionEvent(PAGE_KEYS.FUEL, () => setCurrentPage('FUEL'));

    return pages[currentPage];
};

export default PagesContainer;
