import React, { useEffect, useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { usePersistentProperty } from '@instruments/common/persistence';

export const PressureIndicator: React.FC = () => {
    const [baroUnitInHg] = usePersistentProperty('ISIS_BARO_UNIT_INHG', '0');
    const [stdAltMode] = useSimVar('KOHLSMAN SETTING STD:2', 'boolean');
    const [hpaQnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'millibars');
    const [inHgQnh] = useSimVar('A:KOHLSMAN SETTING MB:2', 'inHg');

    const [baroText, setBaroText] = useState('');

    useEffect(() => {
        if (stdAltMode) {
            setBaroText('STD');
        } else if (baroUnitInHg === '1') {
            setBaroText(`\xa0\xa0${Math.round(hpaQnh).toString().padStart(4, '\xa0')}/${inHgQnh.toFixed(2)}`);
        } else {
            setBaroText(`${Math.round(hpaQnh).toString().padStart(4, '\xa0')}\xa0\xa0\xa0\xa0`);
        }
    }, [baroUnitInHg, stdAltMode, hpaQnh, inHgQnh]);

    return (
        <text x={256} y={466} className="TextCyan" textAnchor="middle" fontSize={stdAltMode ? 36 : 28}>
            {baroText}
        </text>
    );
};
