import React, { useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useCoherentEvent, useInteractionEvents } from '@instruments/common/hooks';
import { AtsuMessage, AtsuMessageComStatus, AtsuMessageType } from '@atsu/AtsuMessage';
import { PreDepartureClearance } from '@atsu/PreDepartureClearance';
import { PdcButtons } from './elements/PdcButtons';
import { render } from '../Common';
import { SelfTest } from './pages/SelfTest';
import { WaitingForData } from './pages/WaitingForData';
import { DcduLines } from './elements/DcduLines';
import { DatalinkMessage } from './elements/DatalinkMessage';
import { MessageStatus } from './elements/MessageStatus';
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

const sortedMessageArray = (messages: Map<number, AtsuMessage>) => {
    const arrMessages = Array.from(messages.values());
    arrMessages.sort((a, b) => a.DcduTimestamp - b.DcduTimestamp);
    return arrMessages;
};

const DCDU: React.FC = () => {
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState(isColdAndDark ? DcduState.Off : DcduState.Active);
    const [messages, setMessages] = useState(new Map<number, AtsuMessage>());
    const [statusMessage, setStatusMessage] = useState({ sender: '', message: '', remainingMilliseconds: 0 });
    const [messageUid, setMessageUid] = useState(-1);
    const maxMessageCount = 5;

    // functions to handle the status area
    const isStatusAvailable = (sender: string) => statusMessage.sender === sender || statusMessage.message.length === 0;
    const resetStatus = (sender: string) => {
        const state = statusMessage;

        if (sender.length === 0 || sender === statusMessage.sender) {
            state.sender = '';
            state.message = '';
            state.remainingMilliseconds = 0;
            setStatusMessage(state);
        }
    };
    const setStatus = (sender: string, message: string) => {
        const state = statusMessage;
        state.sender = sender;
        state.message = message;
        state.remainingMilliseconds = 5000;
        setStatusMessage(state);
    };

    // functions to handle the internal queue
    const closeMessage = (uid: number) => {
        const sortedMessages = sortedMessageArray(messages);
        const index = sortedMessages.findIndex((element) => element.UniqueMessageID === uid);

        if (index !== -1) {
            // define the next visible message
            if (index + 1 < sortedMessages.length) {
                setMessageUid(sortedMessages[index + 1].UniqueMessageID);
            } else if (index !== 0) {
                setMessageUid(sortedMessages[index - 1].UniqueMessageID);
            } else {
                setMessageUid(-1);
            }

            // update the map
            const updatedMap = messages;
            updatedMap.delete(uid);
            setMessages(updatedMap);
        }
    };

    // the message scroll button handling
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0MINUS', 'A32NX_DCDU_BTN_MPR_MS0MINUS'], () => {
        if (messages.size === 0) {
            return;
        }

        const sortedMessages = sortedMessageArray(messages);
        let index = 0;
        if (messageUid !== -1) {
            index = sortedMessages.findIndex((element) => messageUid === element.UniqueMessageID);
        }

        if (index === 0) {
            if (isStatusAvailable('Mainpage') === true) {
                setStatus('Mainpage', 'NO MORE MSG');
            }
        } else {
            resetStatus('');
            index -= 1;
        }

        setMessageUid(sortedMessages[index].UniqueMessageID);
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0PLUS', 'A32NX_DCDU_BTN_MPR_MS0PLUS'], () => {
        if (messages.size === 0) {
            return;
        }

        const sortedMessages = sortedMessageArray(messages);
        let index = 0;
        if (messageUid !== -1) {
            index = sortedMessages.findIndex((element) => messageUid === element.UniqueMessageID);
        }

        if (index + 1 >= sortedMessages.length) {
            if (isStatusAvailable('Mainpage') === true) {
                setStatus('Mainpage', 'NO MORE MSG');
            }
        } else {
            resetStatus('');
            index += 1;
        }

        setMessageUid(sortedMessages[index].UniqueMessageID);
    });

    // resynchronization with AtsuManager
    useCoherentEvent('A32NX_DCDU_MSG', (serialized: any) => {
        let atsuMessage : AtsuMessage | undefined = undefined;
        if (serialized.Type === AtsuMessageType.PDC) {
            atsuMessage = new PreDepartureClearance();
            atsuMessage.deserialize(serialized);
        }

        if (atsuMessage !== undefined) {
            const oldMessage = messages.get(atsuMessage.UniqueMessageID);
            if (oldMessage === undefined) {
                atsuMessage.DcduTimestamp = new Date().getTime();
            } else if (oldMessage.ComStatus !== atsuMessage.ComStatus) {
                if (atsuMessage.ComStatus === AtsuMessageComStatus.Failed) {
                    setStatus('Mainpage', 'COM FAILED');
                } else if (atsuMessage.ComStatus === AtsuMessageComStatus.Sent) {
                    setStatus('Mainpage', 'SENT');
                }
            }

            setMessages(messages.set(atsuMessage.UniqueMessageID, atsuMessage));
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean', messages.size >= maxMessageCount ? 1 : 0);

            if (messageUid === -1) {
                setMessageUid(atsuMessage.UniqueMessageID);
            }
        }
    });
    useCoherentEvent('A32NX_DCDU_MSG_REMOVE', (uid: number) => {
        closeMessage(uid);
    });

    useUpdate((_deltaTime) => {
        if (state === DcduState.Off) {
            if (powerAvailable()) {
                setState(DcduState.On);
            }
        } else if (!powerAvailable()) {
            setState(DcduState.Off);
        }

        // check if the status is outdated
        const status = statusMessage;
        if (status.message !== '') {
            status.remainingMilliseconds -= _deltaTime;
            if (status.remainingMilliseconds <= 0) {
                resetStatus('');
            }
        }
    });

    // prepare the data
    let messageIndex = -1;
    let message : AtsuMessage | undefined = undefined;
    if (state === DcduState.Active && messages.size !== 0) {
        const arrMessages = sortedMessageArray(messages);

        if (messageUid !== -1) {
            messageIndex = arrMessages.findIndex((element) => messageUid === element.UniqueMessageID);
            if (messageIndex !== -1) {
                message = arrMessages[messageIndex];
            }
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
                    {(message !== undefined && (
                        <>
                            <MessageStatus
                                timestamp={message.Timestamp}
                                direction={message.Direction}
                                status={message.Status}
                                comStatus={message.ComStatus}
                                station={message.Station}
                                confirmed={message.Confirmed}
                            />
                            <DatalinkMessage
                                message={message}
                                setStatus={setStatus}
                                isStatusAvailable={isStatusAvailable}
                                resetStatus={resetStatus}
                            />
                        </>
                    ))}
                    {(message !== undefined && message.Type === AtsuMessageType.PDC && (
                        <PdcButtons
                            message={message}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {statusMessage.message.length !== 0 && (
                        <>
                            <g>
                                <text className="status-atsu" x="50%" y="270">{statusMessage.message}</text>
                            </g>
                        </>
                    )}
                    <DcduLines />
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
