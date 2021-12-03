import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { Arinc429Word, useArinc429Var } from '@instruments/common/arinc429';
import { AdirsTasDrivenIndicatorProps } from '../index';

export const SpeedIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ adrs, irs }) => {
    const tas: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_ADR_${adrs}_TRUE_AIRSPEED`, 200);
    const gs: Arinc429Word = useArinc429Var(`L:A32NX_ADIRS_IR_${irs}_GROUND_SPEED`, 200);

    let tasText: string;
    if (!tas.isNormalOperation()) {
        tasText = '';
    } else if (tas.value < 0.00001) {
        tasText = '---';
    } else {
        tasText = Math.round(tas.value).toString().padStart(3, '0');
    }

    return (
        <Layer x={2} y={28}>
            <text x={0} y={0} fontSize={20} className="White">GS</text>
            <text x={82} y={0} fontSize={25} textAnchor="end" className="Green">
                {gs.isNormalOperation() ? Math.round(gs.value).toString().padStart(3) : '' }
            </text>
            <text x={90} y={0} fontSize={20} className="White">TAS</text>
            <text x={189} y={0} fontSize={25} textAnchor="end" className="Green">
                {tasText}
            </text>
        </Layer>
    );
};
