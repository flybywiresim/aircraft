import React, { useEffect } from 'react';
// import { useInteractionEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import { LegacyCdsDisplayUnit, DisplayUnitID } from '@instruments/common/LegacyCdsDisplayUnit';

// import { getSimVar } from '../util';
import { EngPage } from './Pages/Engine/EngPage';
import { BleedPage } from './Pages/Bleed/BleedPage';
import { HydPage } from './Pages/Hyd/HydPage';
import { PressPage } from './Pages/Press/PressPage';
import { ElecAcPage } from './Pages/ElecAcPage';
import { FuelPage } from './Pages/FuelPage';
import { CbPage } from './Pages/CbPage';
import { ApuPage } from './Pages/ApuPage';
import { CondPage } from './Pages/CondPage';
import { DoorPage } from './Pages/Doors/DoorPage';
import { ElecDcPage } from './Pages/ElecDc/ElecDcPage';
import { WheelPage } from './Pages/WheelPage';
import { FctlPage } from './Pages/FctlPage';
// import { VideoPage } from './Pages/VideoPage';
import { CruisePage } from './Pages/Cruise/CruisePage';
import { StatusPage } from './Pages/StatusPage';

import { StatusArea } from './StatusArea';

import '../index.scss';

export const SystemDisplay = () => {
    const [theCurrentPage] = useSimVar('L:A380X_ECAM_CP_SELECTED_PAGE', 'number', 500);
    // const [currentPage, setCurrentPage] = useState(0);
    // useInteractionEvent('A380X_SD_PAGE_CHANGED', () => setCurrentPage(getSimVar('L:A380X_SD_CURRENT_PAGE_INDEX', 'number')));

    useEffect(() => {
        console.log(`Changing current page to ${theCurrentPage}`);
        // setCurrentPage(getSimVar('L:A380X_SD_CURRENT_PAGE_INDEX', 'number'));
    }, [theCurrentPage]);

    const PAGES = {
        0: <EngPage />,
        1: <BleedPage />,
        2: <PressPage />,
        3: <ElecAcPage />,
        4: <FuelPage />,
        5: <HydPage />,
        6: <CbPage />,
        7: <ApuPage />,
        8: <CondPage />,
        9: <DoorPage />,
        10: <ElecDcPage />,
        11: <WheelPage />,
        12: <FctlPage />,
        13: <CruisePage />, // TODO video page
        14: <CruisePage />,
        15: <StatusPage />,
    };

    return (
        <LegacyCdsDisplayUnit displayUnitId={DisplayUnitID.Sd}>
            <g>
                {PAGES[theCurrentPage]}
                <StatusArea />
            </g>
        </LegacyCdsDisplayUnit>
    );
};
