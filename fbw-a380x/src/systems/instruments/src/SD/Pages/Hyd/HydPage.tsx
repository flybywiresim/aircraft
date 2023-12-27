import { useSimVar } from '@instruments/common/simVars';
import React from 'react';
import { PageTitle } from '../Generic/PageTitle';
import { HydraulicSystem } from 'instruments/src/SD/Pages/Hyd/elements/HydraulicSystem';

import '../../../index.scss';


export const HydPage = () => {
    const [greenReservoirLevelIsLow] = useSimVar('L:A32NX_HYD_GREEN_RESERVOIR_LEVEL_IS_LOW', 'boolean', 1000);

    return (
        <g>
            <PageTitle x={6} y={29}>HYD</PageTitle>

            <HydraulicSystem label='GREEN' />

            <text x={352} y={110} className='F26 White LS1'>ELEC</text>
            <text x={352} y={135} className='F26 White LS1'>PMP</text>
            <text x={401} y={135} className='F23 White'>S</text>

            <HydraulicSystem label='YELLOW' />
        </g>
    );
};
