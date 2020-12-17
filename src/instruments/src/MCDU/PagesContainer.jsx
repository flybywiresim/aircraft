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
import { AirportPage } from './Pages/Airport';
import { AtcCommPage } from './Pages/AtcComm';
import { DataPage } from './Pages/Data';
import { DirPage } from './Pages/Dir';
import { FlightPlanPage } from './Pages/FlightPlan';
import { FuelPredPage } from './Pages/FuelPred';
import { InitPage } from './Pages/Init';
import { MenuPage } from './Pages/Menu';
import { PerfPage } from './Pages/Perf';
import { ProgPage } from './Pages/Prog';
import { RadNavPage } from './Pages/RadNav';
import { SecFlightPlanPage } from './Pages/SecFlightPlan';

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

    return pages[currentPage] || <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">invalid page</text>;
};
