import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { usePersistentProperty } from '@instruments/common/persistence';

enum BaroMode {
    QNH = 0,
    STD = 1
}

export const PressureIndicator: React.FC = () => {
    const [baroUnitInHg] = usePersistentProperty('ISIS_BARO_UNIT_INHG', '0');
    const [baroMode] = useSimVar('L:A32NX_ISIS_BARO_MODE', 'enum');
    const [hpaQnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'millibars');
    const [inHgQnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'inHg');

    const [baroText, setBaroText] = useState('');

    useEffect(() => {
        if (baroMode === BaroMode.STD) {
            setBaroText('STD');
        } else if (baroUnitInHg === '1') {
            setBaroText(`\xa0\xa0${Math.round(hpaQnh).toString().padStart(4, '\xa0')}/${inHgQnh.toFixed(2)}`);
        } else {
            setBaroText(`${Math.round(hpaQnh).toString().padStart(4, '\xa0')}\xa0\xa0\xa0\xa0`);
        }
    }, [baroUnitInHg, baroMode, hpaQnh, inHgQnh]);

    return (
        <text x={256} y={466} className="TextCyan" textAnchor="middle" fontSize={baroMode === BaroMode.STD ? 36 : 28}>
            {baroText}
        </text>
    );
};
