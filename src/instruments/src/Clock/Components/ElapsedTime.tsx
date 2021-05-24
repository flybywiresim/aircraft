import React, { useEffect, useState } from 'react';
import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';

const getDisplayString = (seconds: number, running: boolean) : string => (seconds === 0 && !running ? ''
    : `${Math.floor(Math.min(seconds, 359940) / 3600).toString().padStart(2, '0')}${running ? ':' : ' '}${(Math.floor((Math.min(seconds, 359940) % 3600) / 60)).toString().padStart(2, '0')}`);

export const ElapsedTime = () => {
    const [ltsTest] = useSimVar('L:XMLVAR_LTS_Test', 'bool', 250);
    const [elapsedKnobPos] = useInteractionSimVar('L:A32NX_CHRONO_ET_SWITCH_POS', 'number', 'A32NX_CHRONO_ET_POS_CHANGED');
    const [absTime] = useSimVar('E:ABSOLUTE TIME', 'Seconds', 1000);
    const [prevTime, setPrevTime] = useState(absTime);

    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (elapsedKnobPos === 0) {
            setElapsedTime(Math.max(elapsedTime + absTime - prevTime, 0));
        } else if (elapsedKnobPos === 2) {
            setElapsedTime(0);
        }
        setPrevTime(absTime);
    }, [absTime, elapsedKnobPos]);

    return (
        <text x="47" y="247" className="fontBig">{ltsTest ? '88:88' : getDisplayString(elapsedTime, elapsedKnobPos === 0)}</text>
    );
};
