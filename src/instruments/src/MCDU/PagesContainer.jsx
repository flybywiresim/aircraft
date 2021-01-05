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

import { useState } from 'react/cjs/react.production.min.js';
import { getSimVar, useInteractionEvent } from '../util.mjs';
import { AirportPage } from './Pages/FMGC/Airport.jsx';
import { AtcCommPage } from './Pages/FMGC/AtcComm.jsx';
import { DataPage } from './Pages/FMGC/Data.jsx';
import { DirPage } from './Pages/FMGC/Dir.jsx';
import { FlightPlanPage } from './Pages/FMGC/FlightPlan.jsx';
import { FuelPredPage } from './Pages/FMGC/FuelPred.jsx';
import { InitPage } from './Pages/FMGC/Init.jsx';
import { MenuPage } from './Pages/FMGC/Menu.jsx';
import { PerfPage } from './Pages/FMGC/Perf.jsx';
import { ProgPage } from './Pages/FMGC/Prog.jsx';
import { RadNavPage } from './Pages/FMGC/RadNav.jsx';
import { SecFlightPlanPage } from './Pages/FMGC/SecFlightPlan.jsx';

export const PagesContainer = () => {
    const [currentPage, setCurrentPage] = useState(0);

    useInteractionEvent('A32NX_MCDU_PAGE_CHANGED', () => setCurrentPage(getSimVar('L:A32NX_MCDU_CURRENT_PAGE_INDEX', 'number')));

    const pages = {
        0: <AirportPage />,
        1: <AtcCommPage />,
        2: <DataPage />,
        3: <DirPage />,
        4: <FlightPlanPage />,
        5: <FuelPredPage />,
        6: <InitPage />,
        7: <MenuPage />,
        8: <PerfPage />,
        9: <ProgPage />,
        10: <RadNavPage />,
        11: <SecFlightPlanPage />,
    };

    return pages[7] || <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">invalid page</text>;
};
