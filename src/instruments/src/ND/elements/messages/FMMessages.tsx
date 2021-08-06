import React, { FC, useState } from 'react';
import { Layer } from '@instruments/common/utils';
import { FMMessage, FMMessageTriggers } from '@shared/FmMessages';
import { useCoherentEvent } from 'react-msfs';
import { Mode } from '../../index';

export const FMMessages: FC<{ modeIndex: Mode }> = ({ modeIndex }) => {
    const [messages, setMessages] = useState<FMMessage[]>([]);

    useCoherentEvent(FMMessageTriggers.SEND_TO_EFIS, (message) => {
        setMessages((messages) => [...messages, message]);
    });

    useCoherentEvent(FMMessageTriggers.RECALL_FROM_EFIS_WITH_ID, (id) => {
        setMessages((messages) => messages.filter(({ id: mId }) => mId !== id));
    });

    useCoherentEvent(FMMessageTriggers.POP_FROM_STACK, () => {
        setMessages((messages) => messages.filter((_, index) => index !== messages.length - 1));
    });

    if (modeIndex !== Mode.ARC && modeIndex !== Mode.PLAN && modeIndex !== Mode.ROSE_NAV || !messages?.[messages.length - 1]) {
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
                className={`${messages[messages.length - 1].color} MiddleAlign`}
                textAnchor="middle"
                fontSize={25}
            >
                {`${messages[messages.length - 1].efisText ?? messages[messages.length - 1].text}`}
            </text>

            { messages.length > 1 && (
                <path d="M428,2 L428,20 L424,20 L430,28 L436,20 L432,20 L432,2 L428,2" className="Green Fill" />
            )}
        </Layer>
    );
};

// const DmcMessages: FMMessage[] = [
//     { text: 'MAP PARTLY DISPLAYED', color: 'Amber' },
//     { text: 'SET OFFSIDE RNG/MODE', color: 'Amber' },
//     { text: 'OFFSIDE FM CONTROL', color: 'Amber' },
//     { text: 'OFFSIDE FM/WXR CONTROL', color: 'Amber' },
//     { text: 'OFFSIDE WXR CONTROL', color: 'Amber' },
//     { text: 'GPS PRIMARY LOST', color: 'Amber' },
//     { text: 'RTA MISSED', color: 'Amber' },
//     { text: 'BACK UP NAV', color: 'Amber' },
// ];
