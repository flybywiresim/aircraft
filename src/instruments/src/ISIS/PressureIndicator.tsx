import React from 'react';
import { useSimVar } from '@instruments/common/simVars';

enum BaroMode {
    QNH = 0,
    STD = 1
}

export const PressureIndicator: React.FC = () => {
    const [baroMode] = useSimVar('L:A32NX_ISIS_BARO_MODE', 'enum');
    const [hpaQnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'millibars');
    const [inHgQnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'inHg');

    return (
        <text x={256} y={466} className="TextCyan" textAnchor="middle" fontSize={36}>
            {baroMode === BaroMode.STD ? 'STD' : `${Math.round(hpaQnh)}/${inHgQnh.toFixed(2)}`}
        </text>
    );
};
