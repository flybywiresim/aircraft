import React from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Triangle } from '@instruments/common/Shapes';
import { PageTitle } from '../Generic/PageTitle';
import ElectricalNetwork from './elements/ElectricalNetwork';

import '../../../index.scss';

export const ElecDcPage = () => {
    // const sdacDatum = true;
    const [statInvPowered] = useSimVar('L:A32NX_ELEC_AC_STAT_INV_BUS_IS_POWERED', 'bool', 500);

    return (
        <>
            <PageTitle showMore={false} x={5} y={28}>ELEC DC</PageTitle>

            <ElectricalNetwork x={36} y={90} network='1' AC={2} />
            <ElectricalNetwork x={198} y={90} network='ESS' AC={1} />
            <ElectricalNetwork x={396} y={90} network='2' AC={3} />
            <ElectricalNetwork x={626} y={90} network='APU' AC={4} />
            {/* inverter */}
            <g id='static-inverter'>
                <Triangle x={265} y={314} colour={statInvPowered ? 'White' : 'Amber'} fill={0} orientation={180} scale={1} />
                <text className={`F25 ${statInvPowered ? 'White' : 'Amber'} LS-1`} x={237} y={339}>STAT</text>
                <text className={`F25 ${statInvPowered ? 'White' : 'Amber'} LS-1`} x={303} y={339}>INV</text>
            </g>
        </>
    );
};
