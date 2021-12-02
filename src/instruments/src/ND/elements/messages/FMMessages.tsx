import React, { FC, useEffect, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { Mode } from '@shared/NavigationDisplay';
import { useSimVar } from '@instruments/common/simVars';
import { FMMessage, FMMessageTypes } from '@shared/FmMessages';

export const FMMessages: FC<{ modeIndex: Mode, side: 'L' | 'R' }> = ({ modeIndex, side }) => {
    const [activeMessages, setActiveMessages] = useState<FMMessage[]>([]);

    // TODO check FM failure and get messages from other FM
    const [messageFlags] = useSimVar(`L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, 'number', 500);

    useEffect(() => {
        const newActiveMessages = activeMessages.slice();
        // the list must be ordered by priority, and LIFO for equal priority
        for (const message of Object.values(FMMessageTypes)) {
            if (((message.ndFlag ?? 0) & messageFlags) > 0) {
                if (newActiveMessages.findIndex(({ ndFlag }) => ndFlag === message.ndFlag) === -1) {
                    newActiveMessages.push(message);
                    newActiveMessages.sort((a, b) => (b.ndPriority ?? 0) - (a.ndPriority ?? 0));
                }
            } else if ((message.ndFlag ?? 0) > 0) {
                const idx = newActiveMessages.findIndex(({ ndFlag }) => ndFlag === message.ndFlag);
                if (idx !== -1) {
                    newActiveMessages.splice(idx, 1);
                }
            }
        }
        setActiveMessages(newActiveMessages);
    }, [messageFlags]);

    if (modeIndex !== Mode.ARC && modeIndex !== Mode.PLAN && modeIndex !== Mode.ROSE_NAV || activeMessages.length < 1) {
        return null;
    }

    return (
        <Layer x={164} y={713}>
            <rect x={0} y={0} width={440} height={30} className="White BackgroundFill" strokeWidth={1.75} />

            { /* the text message is offset from centre on the real one...
                 guess by the width of the multiple message arrow... */ }
            <text
                x={420 / 2}
                y={25}
                className={`${activeMessages[activeMessages.length - 1].color} MiddleAlign`}
                textAnchor="middle"
                fontSize={25}
            >
                {`${activeMessages[activeMessages.length - 1].text ?? activeMessages[activeMessages.length - 1].efisText}`}
            </text>

            { activeMessages.length > 1 && (
                <path d="M428,2 L428,20 L424,20 L430,28 L436,20 L432,20 L432,2 L428,2" className="Green Fill" />
            )}
        </Layer>
    );
};
