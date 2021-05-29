import React, { FC } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { Layer } from '@instruments/common/utils';

export const SpeedIndicator: FC = () => {
    const [gs] = useSimVar('GPS GROUND SPEED', 'knots');
    const [tas] = useSimVar('AIRSPEED TRUE', 'knots');

    return (
        <Layer x={2} y={22}>
            <text x={0} y={0} fontSize={18} className="White">GS</text>
            <text x={74} y={0} fontSize={22} textAnchor="end" className="Green">{Math.round(gs)}</text>
            <text x={80} y={0} fontSize={18} className="White">TAS</text>
            <text x={165} y={0} fontSize={22} textAnchor="end" className="Green">{Math.round(tas)}</text>
        </Layer>
    );
};
