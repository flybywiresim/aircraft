import { useSimVar } from '@instruments/common/simVars';
import React from 'react';

enum BaroMode {
    QNH = 0,
    STD = 1
}

export const PressureIndicator: React.FC = () => {
    const [baroMode] = useSimVar('L:A32NX_ISIS_BARO_MODE', 'enum');
    const [qnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'millibars');

    if (baroMode === BaroMode.STD) {
        return <text x={256} y={466} width="100%" textAnchor="middle" fontSize={36} fill="cyan">STD</text>;
    }
    return (
        <text x={256} y={466} width="100%" textAnchor="middle" fontSize={36} fill="cyan">
            {Math.round(qnh)}
            /
            {((qnh * 0.03).toFixed(2))}
        </text>
    );
};
