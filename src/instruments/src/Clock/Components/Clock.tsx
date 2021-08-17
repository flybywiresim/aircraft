import React, { useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useInteractionEvent } from '@instruments/common/hooks';

const secondsToDisplay = (seconds: number): number[] => {
    const displayTime = [0, 0, 0];

    displayTime[0] = Math.floor(seconds / 3600);
    displayTime[1] = Math.floor((seconds % 3600) / 60);
    displayTime[2] = Math.floor(seconds % 60);

    return displayTime;
};

export const Clock = () => {
    const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'Bool', 250);
    const [dateMode, setDateMode] = useState(false);
    const [currentUTC] = useSimVar('E:ZULU TIME', 'seconds', 200);
    const [dayOfMonth] = useSimVar('E:ZULU DAY OF MONTH', 'number', 1000);
    const [monthOfYear] = useSimVar('E:ZULU MONTH OF YEAR', 'number', 1000);
    const [year] = useSimVar('E:ZULU YEAR', 'number', 1000);

    useInteractionEvent('A32NX_CHRONO_DATE', () => {
        setDateMode(!dateMode);
    });

    let text1;
    let text2;
    if (!dateMode) {
        const displayTime = secondsToDisplay(currentUTC);
        text1 = `${displayTime[0].toString().padStart(2, '0')}:${displayTime[1].toString().padStart(2, '0')}`;
        text2 = displayTime[2].toString().padStart(2, '0');
    } else {
        text1 = `${monthOfYear.toString().padStart(2, '0')}:${dayOfMonth.toString().padStart(2, '0')}`;
        text2 = year.toString().substr(2, 4);
    }

    return (
        <>
            <text x="6" y="153" className="fontBig">{ltsTest === 0 ? '88:88:' : text1}</text>
            <text x="190" y="147" className="fontSmall">{ltsTest === 0 ? '88' : text2}</text>
        </>
    );
};
