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
import { EngPage } from './Pages/Eng.jsx';
import { BleedPage } from './Pages/Bleed.jsx';
import { PressPage } from './Pages/Press.jsx';
import { ElecPage } from './Pages/Elec.jsx';
import { HydPage } from './Pages/Hyd.jsx';
import { FuelPage } from './Pages/Fuel.jsx';
import { ApuPage } from './Pages/Apu.jsx';
import { CondPage } from './Pages/Cond.jsx';
import { DoorPage } from './Pages/Door/Door.jsx';
import { WheelPage } from './Pages/Wheel.jsx';
import { FctlPage } from './Pages/Fctl.jsx';

export const PagesContainer = () => {
    const [currentPage, setCurrentPage] = useState(0);

    useInteractionEvent('A32NX_SD_PAGE_CHANGED', () => setCurrentPage(getSimVar('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number')));

    const pages = {
        0: <EngPage />,
        1: <BleedPage />,
        2: <PressPage />,
        3: <ElecPage />,
        4: <HydPage />,
        5: <FuelPage />,
        6: <ApuPage />,
        7: <CondPage />,
        8: <DoorPage />,
        9: <WheelPage />,
        10: <FctlPage />,
    };

    return pages[currentPage] || <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">invalid page</text>;
};
