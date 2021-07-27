import React, { FC } from 'react';
import { Layer } from '@instruments/common/utils';
import { ADIRS } from '@instruments/common/adirs';
import { AdirsTasDrivenIndicatorProps } from '../index';

export const SpeedIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ adrs, irs }) => {
    const tas: number = ADIRS.updateValue(`L:A32NX_ADIRS_ADR_${adrs}_TRUE_AIRSPEED`, 'Knots', 500);
    const gs: number = ADIRS.updateValue(`L:A32NX_ADIRS_IR_${irs}_GROUND_SPEED`, 'Knots', 500);

    let tasText: string;
    if (Number.isNaN(tas)) {
        tasText = '';
    } else if (tas < 0.00001) {
        tasText = '---';
    } else {
        tasText = Math.round(tas).toString().padStart(3, '0');
    }

    return (
        <Layer x={2} y={28}>
            <text x={0} y={0} fontSize={20} className="White">GS</text>
            <text x={82} y={0} fontSize={25} textAnchor="end" className="Green">
                {(Number.isNaN(gs)) ? (
                    ''
                ) : (
                    Math.round(gs).toString().padStart(3)
                )}
            </text>
            <text x={90} y={0} fontSize={20} className="White">TAS</text>
            <text x={189} y={0} fontSize={25} textAnchor="end" className="Green">
                {tasText}
            </text>
        </Layer>
    );
};
