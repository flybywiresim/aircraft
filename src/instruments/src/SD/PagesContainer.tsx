import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { getSimVar, useInteractionEvent } from '../util.js';
import { EngPage } from './Pages/Eng/Eng';
import { BleedPage } from './Pages/Bleed/Bleed';
import { PressPage } from './Pages/Press/Press';
import { ElecPage } from './Pages/Elec/Elec';
import { HydPage } from './Pages/Hyd/Hyd';
import { FuelPage } from './Pages/Fuel/Fuel';
import { ApuPage } from './Pages/Apu/Apu';
import { CondPage } from './Pages/Cond/Cond';
import { DoorPage } from './Pages/Door/Door';
import { WheelPage } from './Pages/Wheel/Wheel';
import { FctlPage } from './Pages/Fctl/Fctl';
import { StatusPage } from './Pages/Status/Status';
import { CrzPage } from './Pages/Crz/Crz';

export const PagesContainer = () => {
    const [currentPage, setCurrentPage] = useState(10);

    // const [page, setPage] = useSimVar('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number', 300);

    useInteractionEvent('A32NX_SD_PAGE_CHANGED', () => {
        const page = SimVar.GetSimVarValue('L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX', 'number');
        if (page !== -1) {
            setCurrentPage(page);
        } else {
            // setPageWhenUnselected(12);
            // setPage(12);
            setCurrentPage(12);
        }
    });

    /*     useEffect(() => {

    }, [page]);
 */
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
