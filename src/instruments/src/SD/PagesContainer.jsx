import { useState } from 'react';
import { getSimVar, useInteractionEvent } from '../util.js';
import { EngPage } from './Pages/Eng/Eng.tsx';
import { BleedPage } from './Pages/Bleed.jsx';
import { PressPage } from './Pages/Press/Press.tsx';
import { ElecPage } from './Pages/Elec/Elec.tsx';
import { HydPage } from './Pages/Hyd/Hyd.tsx';
import { FuelPage } from './Pages/Fuel/Fuel.tsx';
import { ApuPage } from './Pages/Apu.jsx';
import { CondPage } from './Pages/Cond/Cond.tsx';
import { DoorPage } from './Pages/Door/Door.tsx';
import { WheelPage } from './Pages/Wheel/Wheel.tsx';
import { FctlPage } from './Pages/Fctl/Fctl.tsx';
import { StatusPage } from './Pages/Status.jsx';
import { CrzPage } from './Pages/Crz/Crz.tsx';

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
        11: <StatusPage />,
        12: <CrzPage />,
    };

    return pages[currentPage] || <text x={300} y={300} fill="white" fontSize={18} textAnchor="middle">invalid page</text>;
};
