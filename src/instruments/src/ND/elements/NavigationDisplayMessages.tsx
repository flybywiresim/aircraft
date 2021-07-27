import React, { FC, useEffect, useRef, useState } from 'react';
import { Mode, RangeSetting } from '../index';

export interface NavigationDisplayMessagesProps {
    adirsState: boolean,
    rangeSetting: RangeSetting,
    mode: Mode,
}

export const NavigationDisplayMessages: FC<NavigationDisplayMessagesProps> = ({ adirsState, rangeSetting, mode }) => {
    const [modeChangeShown, setModeChangeShown] = useState(false);
    const [rangeChangeShown, setRangeChangeShown] = useState(false);

    const firstModeUpdate = useRef(true);
    const firstRangeUpdate = useRef(true);

    useEffect(() => {
        console.log(mode);
        if (firstModeUpdate.current) {
            firstModeUpdate.current = false;
            return () => {};
        }

        setModeChangeShown(true);

        const timeout = setTimeout(() => {
            setModeChangeShown(false);
        }, 2_500);

        return () => clearTimeout(timeout);
    }, [mode]);

    useEffect(() => {
        if (firstRangeUpdate.current) {
            firstRangeUpdate.current = false;
            return () => {};
        }

        // RANGE CHANGE has priority over MODE CHANGE
        if (modeChangeShown) {
            setModeChangeShown(false);
        }
        setRangeChangeShown(true);

        const timeout = setTimeout(() => {
            setRangeChangeShown(false);
        }, 2_500);

        return () => clearTimeout(timeout);
    }, [rangeSetting]);

    // Do not show general messages in ROSE VOR/ILS or ANF (latter is not in neo)
    const modeValidForGeneralMessages = (mode !== Mode.ROSE_VOR && mode !== Mode.ROSE_ILS) && (adirsState || mode === Mode.PLAN);

    return (
        <>
            <text
                x={384}
                y={320}
                className="Green"
                textAnchor="middle"
                fontSize={31}
                visibility={(modeChangeShown && modeValidForGeneralMessages) ? 'visible' : 'hidden'}
            >
                MODE CHANGE
            </text>
            <text
                x={384}
                y={320}
                className="Green"
                textAnchor="middle"
                fontSize={31}
                visibility={(rangeChangeShown && modeValidForGeneralMessages) ? 'visible' : 'hidden'}
            >
                RANGE CHANGE
            </text>
        </>
    );
};
