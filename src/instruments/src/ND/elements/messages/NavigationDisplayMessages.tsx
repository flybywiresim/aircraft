import React, { FC } from 'react';
import { Mode } from '@shared/NavigationDisplay';

export interface NavigationDisplayMessagesProps {
    adirsAlign: boolean,
    mode: Mode,
    modeChangeShown: boolean,
    rangeChangeShown: boolean,
}

export const NavigationDisplayMessages: FC<NavigationDisplayMessagesProps> = ({ adirsAlign, mode, modeChangeShown, rangeChangeShown }) => {

    // Do not show general messages in ROSE VOR/ILS or ANF (latter is not in neo)
    const modeValidForGeneralMessages = (mode !== Mode.ROSE_VOR && mode !== Mode.ROSE_ILS) && (adirsAlign || mode === Mode.PLAN);

    return (
        <>
            <text
                x={384}
                y={320}
                className="Green"
                textAnchor="middle"
                fontSize={31}
                visibility={(modeChangeShown && !rangeChangeShown && modeValidForGeneralMessages) ? 'visible' : 'hidden'}
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
