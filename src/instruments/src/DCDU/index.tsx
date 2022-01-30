import React, { useState } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useCoherentEvent, useInteractionEvents } from '@instruments/common/hooks';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageType } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage, CpdlcMessageRequestedResponseType, CpdlcMessageResponse } from '@atsu/messages/CpdlcMessage';
import { AffirmNegativeButtons } from './elements/AffirmNegativeButtons';
import { WilcoUnableButtons } from './elements/WilcoUnableButtons';
import { RogerButtons } from './elements/RogerButtons';
import { CloseButtons } from './elements/CloseButtons';
import { render } from '../Common';
import { SelfTest } from './pages/SelfTest';
import { WaitingForData } from './pages/WaitingForData';
import { DcduLines } from './elements/DcduLines';
import { DatalinkMessage } from './elements/DatalinkMessage';
import { MessageStatus } from './elements/MessageStatus';
import { AtcStatus } from './elements/AtcStatus';
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

const sortedMessageArray = (messages: Map<number, [CpdlcMessage, number, boolean]>): [CpdlcMessage, number, boolean][] => {
    const arrMessages = Array.from(messages.values());
    arrMessages.sort((a, b) => a[1] - b[1]);
    return arrMessages;
};

const DCDU: React.FC = () => {
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState(isColdAndDark ? DcduState.Off : DcduState.Active);
    const [messages, setMessages] = useState(new Map<number, [CpdlcMessage, number, boolean]>());
    const [statusMessage, setStatusMessage] = useState({ sender: '', message: '', remainingMilliseconds: 0 });
    const [messageUid, setMessageUid] = useState(-1);
    const [atcMessage, setAtcMessage] = useState('');
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

    const setMessageStatus = (uid: number, response: CpdlcMessageResponse | undefined) => {
        const updateMap = messages;

        const entry = updateMap.get(uid);
        if (entry !== undefined) {
            entry[0].ResponseType = response;
            entry[2] = true;
            updateMap.set(uid, entry);
        }

        setMessages(updateMap);
    };

    // functions to handle the internal queue
    const closeMessage = (uid: number) => {
        const sortedMessages = sortedMessageArray(messages);
        const index = sortedMessages.findIndex((element) => element[0].UniqueMessageID === uid);

        if (index !== -1) {
            resetStatus('');

            // define the next visible message
            if (index + 1 < sortedMessages.length) {
                setMessageUid(sortedMessages[index + 1][0].UniqueMessageID);
            } else if (index !== 0) {
                setMessageUid(sortedMessages[index - 1][0].UniqueMessageID);
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
            index = sortedMessages.findIndex((element) => messageUid === element[0].UniqueMessageID);
        }

        if (index === 0) {
            if (isStatusAvailable('Mainpage') === true) {
                setStatus('Mainpage', 'NO MORE MSG');
            }
        } else {
            resetStatus('');
            index -= 1;
        }

        setMessageUid(sortedMessages[index][0].UniqueMessageID);
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0PLUS', 'A32NX_DCDU_BTN_MPR_MS0PLUS'], () => {
        if (messages.size === 0) {
            return;
        }

        const sortedMessages = sortedMessageArray(messages);
        let index = 0;
        if (messageUid !== -1) {
            index = sortedMessages.findIndex((element) => messageUid === element[0].UniqueMessageID);
        }

        if (index + 1 >= sortedMessages.length) {
            if (isStatusAvailable('Mainpage') === true) {
                setStatus('Mainpage', 'NO MORE MSG');
            }
        } else {
            resetStatus('');
            index += 1;
        }

        setMessageUid(sortedMessages[index][0].UniqueMessageID);
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_PRINT', 'A32NX_DCDU_BTN_MPR_PRINT'], () => {
        if (messages.size === 0) {
            return;
        }

        if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number') !== -1) {
            setStatus('Mainpage', 'PRINTER BUSY');
            return;
        }

        if (messageUid !== -1) {
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', messageUid);
        }
    });

    // resynchronization with AtsuManager
    useCoherentEvent('A32NX_DCDU_MSG', (serialized: any) => {
        let cpdlcMessage : CpdlcMessage | undefined = undefined;
        if (serialized.Type === AtsuMessageType.CPDLC) {
            cpdlcMessage = new CpdlcMessage();
            cpdlcMessage.deserialize(serialized);
        }

        if (cpdlcMessage !== undefined && cpdlcMessage.UniqueMessageID !== undefined) {
            const oldMessage = messages.get(cpdlcMessage.UniqueMessageID);
            let dcduTimestamp = new Date().getTime();
            let readMessage = false;

            if (oldMessage !== undefined) {
                dcduTimestamp = oldMessage[1];
                readMessage = oldMessage[2];

                // check if we have to show the status of an output message
                if (oldMessage[0].Direction === AtsuMessageDirection.Output) {
                    if (oldMessage[0].ComStatus !== cpdlcMessage.ComStatus) {
                        if (cpdlcMessage.ComStatus === AtsuMessageComStatus.Failed) {
                            setStatus('Mainpage', 'COM FAILED');
                        } else if (cpdlcMessage.ComStatus === AtsuMessageComStatus.Sent) {
                            setStatus('Mainpage', 'SENT');
                        }
                    }
                } else if (cpdlcMessage.Response !== undefined) {
                    // received an update for a response
                    if (oldMessage[0].Response !== undefined) {
                        if (oldMessage[0].Response.ComStatus !== cpdlcMessage.Response.ComStatus) {
                            if (cpdlcMessage.Response.ComStatus === AtsuMessageComStatus.Failed) {
                                setStatus('Mainpage', 'COM FAILED');
                            } else if (cpdlcMessage.Response.ComStatus === AtsuMessageComStatus.Sent) {
                                setStatus('Mainpage', 'SENT');
                            }
                        }
                    } else if (cpdlcMessage.Response.ComStatus === AtsuMessageComStatus.Failed) {
                        setStatus('Mainpage', 'COM FAILED');
                    } else if (cpdlcMessage.Response.ComStatus === AtsuMessageComStatus.Sent) {
                        setStatus('Mainpage', 'SENT');
                    }
                }
            } else {
                readMessage = cpdlcMessage.Response !== undefined || cpdlcMessage.ResponseType !== undefined;
            }

            setMessages(messages.set(cpdlcMessage.UniqueMessageID, [cpdlcMessage, dcduTimestamp, readMessage]));

            if (messageUid === -1) {
                setMessageUid(cpdlcMessage.UniqueMessageID);
            }
        }
    });
    useCoherentEvent('A32NX_DCDU_MSG_DELETE_UID', (uid: number) => {
        closeMessage(uid);
    });
    useCoherentEvent('A32NX_DCDU_ATC_LOGON_MSG', (message: string) => {
        setAtcMessage(message);
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

        // check the number of unread messages
        let unreadMessages = 0;
        messages.forEach((message) => {
            if (message[0].Direction === AtsuMessageDirection.Input && !message[2]) {
                unreadMessages += 1;
            }
        })
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_UNREAD_MSGS', 'number', unreadMessages);

        // update if the DCDU is full
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean', messages.size >= maxMessageCount ? 1 : 0);
    });

    // prepare the data
    let messageIndex = -1;
    let message : CpdlcMessage | undefined = undefined;
    if (state === DcduState.Active && messages.size !== 0) {
        const arrMessages = sortedMessageArray(messages);

        if (messageUid !== -1) {
            messageIndex = arrMessages.findIndex((element) => messageUid === element[0].UniqueMessageID);
            if (messageIndex !== -1) {
                message = arrMessages[messageIndex][0];
            }
        }
    }

    let answerRequired = false;
    if (message !== undefined) {
        answerRequired = message.RequestedResponses !== CpdlcMessageRequestedResponseType.NotRequired && message.RequestedResponses !== CpdlcMessageRequestedResponseType.No;
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
                    {(message === undefined && atcMessage !== '' && (
                        <>
                            <AtcStatus message={atcMessage} />
                        </>
                    )
                    )}
                    {(message !== undefined && (
                        <>
                            <MessageStatus
                                message={message}
                            />
                            <DatalinkMessage
                                message={message}
                                setStatus={setStatus}
                                isStatusAvailable={isStatusAvailable}
                                resetStatus={resetStatus}
                            />
                        </>
                    ))}
                    {(message !== undefined && answerRequired && message.RequestedResponses === CpdlcMessageRequestedResponseType.WilcoUnable && (
                        <WilcoUnableButtons
                            message={message}
                            setMessageStatus={setMessageStatus}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(message !== undefined && answerRequired && message.RequestedResponses === CpdlcMessageRequestedResponseType.AffirmNegative && (
                        <AffirmNegativeButtons
                            message={message}
                            setMessageStatus={setMessageStatus}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(message !== undefined && answerRequired && message.RequestedResponses === CpdlcMessageRequestedResponseType.Roger && (
                        <RogerButtons
                            message={message}
                            setMessageStatus={setMessageStatus}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(message !== undefined && !answerRequired && (
                        <CloseButtons
                            message={message}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {statusMessage.message.length !== 0 && (
                        <>
                            <g>
                                <text className="status-atsu" x="50%" y="2160">{statusMessage.message}</text>
                            </g>
                        </>
                    )}
                    <DcduLines />
                    {
                        (messages.size > 1
                        && (
                            <>
                                <g>
                                    <text className="status-atsu" x="35%" y="2480">MSG</text>
                                    <text className="status-atsu" x="35%" y="2720">
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
