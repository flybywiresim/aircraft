import React, { useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useCoherentEvent } from '@instruments/common/hooks';
import { AtcMessage, AtcMessageDirection, AtcMessageType } from '@atsu/AtcMessage';
import { PreDepartureClearance } from '@atsu/PreDepartureClearance';
import { render } from '../Common';
import { SelfTest } from './pages/SelfTest';
import { WaitingForData } from './pages/WaitingForData';
import { BaseView } from './elements/BaseView';
import { DatalinkMessage } from './elements/DatalinkMessage';
import { getSimVar, useUpdate } from '../util.js';

import './style.scss';

enum DcduState {
    Default,
    Off,
    On,
    Waiting,
    Active,
}

function powerAvailable() {
    // Each DCDU is powered by a different DC BUS. Sadly the cockpit only contains a single DCDU emissive.
    // Once we have two DCDUs running, the capt. DCDU should be powered by DC 1, and F/O by DC 2.
    return getSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'Bool') || getSimVar('L:A32NX_ELEC_DC_2_BUS_IS_POWERED', 'Bool');
}

const DCDU: React.FC = () => {
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState(isColdAndDark ? DcduState.Off : DcduState.Active);
    const [messageUid, setMessageUid] = useState('');
    const [messages, setMessages] = useState(new Map());
    const maxMessageCount = 5;

    useCoherentEvent('A32NX_DCDU_MSG', (serialized: any) => {
        let atsuMessage : AtcMessage | undefined = undefined;
        if (serialized.Type === AtcMessageType.PDC) {
            atsuMessage = new PreDepartureClearance();
            atsuMessage.deserialize(serialized);
        }

        if (atsuMessage !== undefined) {
            if (messages.get(atsuMessage.UniqueMessageID) === undefined) {
                atsuMessage.DcduTimestamp = new Date().getTime();
            }
            setMessages(messages.set(atsuMessage.UniqueMessageID, atsuMessage));
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean', messages.size >= maxMessageCount ? 1 : 0);
        }
    });
    useCoherentEvent('A32NX_DCDU_MSG_REMOVE', (uid: string) => {
        const entry = messages.get(uid);
        if (entry !== undefined) {
            const updatedMap = messages;
            updatedMap.delete(uid);
            setMessages(updatedMap);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean', messages.size >= maxMessageCount ? 1 : 0);
        }
    });

    useUpdate((_deltaTime) => {
        if (state === DcduState.Off) {
            if (powerAvailable()) {
                setState(DcduState.On);
            }
        } else if (!powerAvailable()) {
            setState(DcduState.Off);
        }
    });

    // prepare the data
    let messageIndex = -1;
    let serializedMessage = '';
    let messageDirection = AtcMessageDirection.Output;
    if (state === DcduState.Active && messages.size !== 0) {
        const arrMessages: AtcMessage[] = Array.from(messages.values());
        arrMessages.sort((a, b) => a.DcduTimestamp - b.DcduTimestamp);

        if (messageUid !== '') {
            messageIndex = arrMessages.findIndex((element) => messageUid === element.UniqueMessageID);
            if (messageIndex !== -1) {
                serializedMessage = messages[messageIndex].serialize();
                messageDirection = messages[messageIndex].Direction;
            }
        } else {
            serializedMessage = arrMessages[0].serialize();
            messageDirection = arrMessages[0].Direction;
            messageIndex = 0;
        }
    }

    switch (state) {
    case DcduState.Off:
        return <></>;
    case DcduState.On:
        setTimeout(() => {
            if (powerAvailable()) {
                setState(DcduState.Waiting);
            }
        }, 8000);
        return (
            <>
                <div className="BacklightBleed" />
                <SelfTest />
            </>
        );
    case DcduState.Waiting:
        setTimeout(() => {
            if (powerAvailable()) {
                setState(DcduState.Active);
            }
        }, 12000);
        return (
            <>
                <div className="BacklightBleed" />
                <WaitingForData />
            </>
        );
    case DcduState.Active:
        return (
            <>
                <div className="BacklightBleed" />
                <svg className="dcdu">
                    <DatalinkMessage message={serializedMessage} direction={messageDirection} />
                    <BaseView />
                    {
                        (messages.size > 1
                        && (
                            <>
                                <g>
                                    <text className="status-atsu" x="35%" y="310">MSG</text>
                                    <text className="status-atsu" x="35%" y="340">
                                        {messageIndex + 1}
                                        {' '}
                                        /
                                        {' '}
                                        {messages.size}
                                    </text>
                                </g>
                            </>
                        ))
                    }
                </svg>
            </>
        );
    default:
        throw new RangeError();
    }
};

render(<DCDU />);
