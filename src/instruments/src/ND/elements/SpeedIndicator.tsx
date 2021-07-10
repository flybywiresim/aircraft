import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';
import { AdirsTasDrivenIndicatorProps } from '../index';

export const SpeedIndicator: FC<AdirsTasDrivenIndicatorProps> = ({ adirsState, tas }) => {
    const [gs] = useSimVar('GPS GROUND SPEED', 'knots', 500);

    return (
        <Layer x={2} y={28}>
            <text x={0} y={0} fontSize={20} className="White">GS</text>
            <text x={82} y={0} fontSize={25} textAnchor="end" className="Green">
                {(adirsState === 2) ? (
                    Math.round(gs).toString().padStart(3)
                ) : (
                    '---'
                )}
            </text>
            <text x={90} y={0} fontSize={20} className="White">TAS</text>
            <text x={189} y={0} fontSize={25} textAnchor="end" className="Green">
                {(adirsState === 2 && tas >= 60) ? (
                    Math.round(tas).toString().padStart(3, '0')
                ) : (
                    '---'
                )}
            </text>
        </Layer>
    );
};
