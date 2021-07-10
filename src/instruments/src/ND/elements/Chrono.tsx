import React, { useEffect, useState } from 'react';
import { useInteractionEvent } from '@instruments/common/hooks';
import { useSimVar } from '@instruments/common/simVars';
import { EfisSide } from '../index';

// TODO need a font with the right H ' and " chars

const getDisplayString = (seconds: number) : string => {
    if (seconds >= 3600) {
        return `${Math.floor(seconds / 3600).toString().padStart(2, '0')}H${Math.floor((seconds % 3600) / 60).toString().padStart(2, '0')}'`;
    }
    return `${Math.floor(seconds / 60).toString().padStart(2, '0')}'${Math.floor(seconds % 60).toString().padStart(2, '0')}"`;
};

export const Chrono: React.FC<{ side: EfisSide }> = ({ side }) => {
    const [absTime] = useSimVar('E:ABSOLUTE TIME', 'Seconds', 200);
    const [prevTime, setPrevTime] = useState(absTime);

    const [elapsedTime, setElapsedTime] = useState(0);
    const [state, setState] = useState('HIDDEN');

    useEffect(() => {
        if (state === 'RUNNING') {
            // max 99 hours, 59 min
            setElapsedTime(Math.min(359940, Math.max(elapsedTime + absTime - prevTime, 0)));
        }
        setPrevTime(absTime);
    }, [absTime]);

    useInteractionEvent(`A32NX_EFIS_${side}_CHRONO_PUSHED`, () => {
        switch (state) {
        case 'HIDDEN':
            setPrevTime(absTime);
            setElapsedTime(0);
            setState('RUNNING');
            break;
        case 'RUNNING':
            setState('STOPPED');
            break;
        case 'STOPPED':
            setState('HIDDEN');
            break;
        }
    });

    if (state === 'HIDDEN') {
        return <></>;
    }
    return (
        <g className="chrono">
            <rect x={0} y={632} width={104} height={30} className="Grey Fill" />
            <text x={8} y={652} fontSize={24} className="Green">{getDisplayString(elapsedTime)}</text>
        </g>
    );
};
