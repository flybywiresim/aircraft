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
import PropTypes from 'prop-types';
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
import { FMGC } from '../FMGC/FMGC.mjs';

const PagesContainer = (props) => {
    const [currentPage, setCurrentPage] = useState(0);
    const { fmgc } = props;

    // useInteractionEvent('A32NX_MCDU_PAGE_CHANGED', () => setCurrentPage(getSimVar('L:A32NX_MCDU_CURRENT_PAGE_INDEX', 'number')));

    const pages = {
        0: <AirportPage fmgc={fmgc} />,
        1: <AtcCommPage fmgc={fmgc} />,
        2: <DataPage fmgc={fmgc} />,
        3: <DirPage fmgc={fmgc} />,
        4: <FlightPlanPage fmgc={fmgc} />,
        5: <FuelPredPage fmgc={fmgc} />,
        6: <InitPage fmgc={fmgc} />,
        7: <MenuPage fmgc={fmgc} />,
        8: <PerfPage fmgc={fmgc} />,
        9: <ProgPage fmgc={fmgc} />,
        10: <RadNavPage fmgc={fmgc} />,
        11: <SecFlightPlanPage fmgc={fmgc} />,
    };

    return <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">invalid page</text>;
};

PagesContainer.propTypes = {
    fmgc: PropTypes.instanceOf(FMGC).isRequired,
};

export { PagesContainer };
