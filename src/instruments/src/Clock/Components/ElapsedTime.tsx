import React, { useEffect, useState } from 'react';
import { useInteractionSimVar, useSimVar } from '@instruments/common/simVars';
import { debouncedTimeDelta } from '../../Common';

const getDisplayString = (seconds: number, running: boolean) : string => (seconds === 0 && !running ? ''
    : `${Math.floor(Math.min(seconds, 359940) / 3600).toString().padStart(2, '0')}${running ? ':' : ' '}${(Math.floor((Math.min(seconds, 359940) % 3600) / 60)).toString().padStart(2, '0')}`);

export const ElapsedTime = () => {
    const [ltsTest] = useSimVar('L:A32NX_OVHD_INTLT_ANN', 'bool', 250);
    const [dcEssIsPowered] = useSimVar('L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED', 'bool', 250);
    const [elapsedKnobPos] = useInteractionSimVar('L:A32NX_CHRONO_ET_SWITCH_POS', 'number', 'A32NX_CHRONO_ET_POS_CHANGED');
    const [, setElapsedSimvarTime] = useSimVar('L:A32NX_CHRONO_ET_ELAPSED_TIME', 'number', 250);
    const [absTime] = useSimVar('E:ABSOLUTE TIME', 'Seconds', 1000);
    const [prevTime, setPrevTime] = useState(absTime);

    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (dcEssIsPowered) {
            if (elapsedKnobPos === 0) {
                const newElapsedTime = (elapsedTime || 0) + debouncedTimeDelta(absTime, prevTime);
                setElapsedTime(newElapsedTime);
                setElapsedSimvarTime(newElapsedTime);
            } else if (elapsedKnobPos === 2) {
                setElapsedTime(0);
                setElapsedSimvarTime(-1); // Simvar is not nullable, so a -1 placeholder is used
            }
            setPrevTime(absTime);
        }
    }, [absTime, elapsedKnobPos, dcEssIsPowered]);

    useEffect(() => {
        setElapsedSimvarTime(-1);
    }, []);

    return (
        <text x="47" y="247" className="fontBig">{ltsTest === 0 ? '88:88' : getDisplayString(elapsedTime, elapsedKnobPos === 0)}</text>
    );
};
