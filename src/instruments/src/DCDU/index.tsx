import React, { useEffect, useState, useRef } from 'react';
import { useSimVar } from '@instruments/common/simVars';
import { useCoherentEvent, useInteractionEvents } from '@instruments/common/hooks';
import { AtsuMessageComStatus, AtsuMessageDirection, AtsuMessageType } from '@atsu/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/messages/CpdlcMessage';
import { CpdlcMessageExpectedResponseType } from '@atsu/messages/CpdlcMessageElements';
import { RequestMessage } from '@atsu/messages/RequestMessage';
import { DclMessage } from '@atsu/messages/DclMessage';
import { OclMessage } from '@atsu/messages/OclMessage';
import { OutputButtons } from './elements/OutputButtons';
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

import './style.scss';

enum DcduState {
    Off,
    On,
    Selftest,
    Waiting,
    Standby
}

const sortedMessageArray = (messages: Map<number, [CpdlcMessage[], number, number]>): [CpdlcMessage[], number, number][] => {
    const arrMessages = Array.from(messages.values());
    arrMessages.sort((a, b) => a[1] - b[1]);
    return arrMessages;
};

const DCDU: React.FC = () => {
    const [electricityState] = useSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'bool', 200);
    const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
    const [state, setState] = useState((isColdAndDark) ? DcduState.Off : DcduState.On);
    const [messages, setMessages] = useState(new Map<number, [CpdlcMessage[], number, number]>());
    const [statusMessage, setStatusMessage] = useState({ sender: '', message: '' });
    const [events] = useState(RegisterViewListener('JS_LISTENER_SIMVARS', undefined, true));
    const [messageUid, setMessageUid] = useState(-1);
    const [atcMessage, setAtcMessage] = useState('');
    const [screenTimeout, setScreenTimeout] = useState<NodeJS.Timeout | null>(null);
    const [messageStatusTimeout, setMessageStatusTimeout] = useState<NodeJS.Timeout | null>(null);
    const messagesRef = useRef<Map<number, [CpdlcMessage[], number, number]>>();

    messagesRef.current = messages;

    // functions to handle the status area
    const isStatusAvailable = (sender: string) => statusMessage.sender === sender || statusMessage.message.length === 0;
    const resetStatus = (sender: string) => {
        const state = statusMessage;

        if (sender.length === 0 || sender === statusMessage.sender) {
            state.sender = '';
            state.message = '';
            setStatusMessage(state);
            if (messageStatusTimeout) {
                clearTimeout(messageStatusTimeout);
                setMessageStatusTimeout(null);
            }
        }
    };
    const setStatus = (sender: string, message: string, duration: number) => {
        const state = statusMessage;
        state.sender = sender;
        state.message = message;
        setStatusMessage(state);
        if (duration > 0) {
            if (messageStatusTimeout) {
                clearTimeout(messageStatusTimeout);
            }

            setMessageStatusTimeout(setTimeout(() => {
                const state = statusMessage;
                state.sender = '';
                state.message = '';
                setStatusMessage(state);
                setMessageStatusTimeout(null);
            }, duration * 1000));
        }
    };

    const setMessageStatus = (uid: number, response: number) => {
        const updateMap = new Map<number, [CpdlcMessage[], number, number]>(messages);

        const entry = updateMap.get(uid);
        if (entry !== undefined) {
            events.triggerToAllSubscribers('A32NX_ATSU_DCDU_MESSAGE_READ', uid);
            entry[2] = response;
            updateMap.set(uid, entry);

            setMessages(updateMap);
        }
    };

    const deleteMessage = (uid: number) => events.triggerToAllSubscribers('A32NX_ATSU_DELETE_MESSAGE', uid);
    const sendMessage = (uid: number) => events.triggerToAllSubscribers('A32NX_ATSU_SEND_MESSAGE', uid);
    const sendResponse = (uid: number, response: number) => events.triggerToAllSubscribers('A32NX_ATSU_SEND_RESPONSE', uid, response);

    // functions to handle the internal queue
    const closeMessage = (uid: number) => {
        if (!messagesRef.current) {
            return;
        }

        const sortedMessages = sortedMessageArray(messagesRef.current);
        const index = sortedMessages.findIndex((element) => element[0][0].UniqueMessageID === uid);

        events.triggerToAllSubscribers('A32NX_ATSU_DCDU_MESSAGE_CLOSED', uid);

        if (index !== -1) {
            resetStatus('');

            // define the next visible message
            if (index + 1 < sortedMessages.length) {
                setMessageUid(sortedMessages[index + 1][0][0].UniqueMessageID);
            } else if (index !== 0) {
                setMessageUid(sortedMessages[index - 1][0][0].UniqueMessageID);
            } else {
                setMessageUid(-1);
            }

            // update the map
            const updatedMap = new Map<number, [CpdlcMessage[], number, number]>(messagesRef.current);
            updatedMap.delete(uid);
            setMessages(updatedMap);
        }
    };

    // the message scroll button handling
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0MINUS', 'A32NX_DCDU_BTN_MPR_MS0MINUS'], () => {
        if (!messagesRef.current || messagesRef.current.size === 0) {
            return;
        }

        const sortedMessages = sortedMessageArray(messagesRef.current);
        let index = 0;
        if (messageUid !== -1) {
            index = sortedMessages.findIndex((element) => messageUid === element[0][0].UniqueMessageID);
        }

        if (index === 0) {
            if (isStatusAvailable('Mainpage') === true) {
                setStatus('Mainpage', 'NO MORE MSG', 5);
            }
        } else {
            resetStatus('');
            index -= 1;
        }

        setMessageUid(sortedMessages[index][0][0].UniqueMessageID);
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0PLUS', 'A32NX_DCDU_BTN_MPR_MS0PLUS'], () => {
        if (!messagesRef.current || messagesRef.current.size === 0) {
            return;
        }

        const sortedMessages = sortedMessageArray(messagesRef.current);
        let index = 0;
        if (messageUid !== -1) {
            index = sortedMessages.findIndex((element) => messageUid === element[0][0].UniqueMessageID);
        }

        if (index + 1 >= sortedMessages.length) {
            if (isStatusAvailable('Mainpage') === true) {
                setStatus('Mainpage', 'NO MORE MSG', 5);
            }
        } else {
            resetStatus('');
            index += 1;
        }

        setMessageUid(sortedMessages[index][0][0].UniqueMessageID);
    });
    useInteractionEvents(['A32NX_DCDU_BTN_MPL_PRINT', 'A32NX_DCDU_BTN_MPR_PRINT'], () => {
        if (messageUid !== -1) {
            events.triggerToAllSubscribers('A32NX_ATSU_PRINT_MESSAGE', messageUid);
        }
    });

    useCoherentEvent('A32NX_DCDU_RESET', () => {
        setMessageUid(-1);
        setMessages(new Map<number, [CpdlcMessage[], number, number]>());
        setAtcMessage('');
        resetStatus('');
    });

    // resynchronization with ATSU
    useCoherentEvent('A32NX_DCDU_MSG', (serializedMessages: any) => {
        const cpdlcMessages: CpdlcMessage[] = [];

        serializedMessages.forEach((serialized) => {
            if (serialized.UniqueMessageID !== undefined) {
                let cpdlcMessage : CpdlcMessage | undefined = undefined;
                if (serialized.Type === AtsuMessageType.CPDLC) {
                    cpdlcMessage = new CpdlcMessage();
                } else if (serialized.Type === AtsuMessageType.Request) {
                    cpdlcMessage = new RequestMessage();
                } else if (serialized.Type === AtsuMessageType.DCL) {
                    cpdlcMessage = new DclMessage();
                } else if (serialized.Type === AtsuMessageType.OCL) {
                    cpdlcMessage = new OclMessage();
                }

                if (cpdlcMessage !== undefined) {
                    cpdlcMessage.deserialize(serialized);
                    cpdlcMessages.push(cpdlcMessage);
                }
            }
        });

        if (cpdlcMessages.length !== 0) {
            const newMessageMap = new Map(messagesRef.current);
            const dcduBlock = newMessageMap.get(cpdlcMessages[0].UniqueMessageID);

            if (dcduBlock !== undefined) {
                // update the status entry
                if (dcduBlock[0][0].Direction === AtsuMessageDirection.Downlink) {
                    if (dcduBlock[0][0].ComStatus !== cpdlcMessages[0].ComStatus) {
                        if (cpdlcMessages[0].ComStatus === AtsuMessageComStatus.Failed) {
                            setStatus('Mainpage', 'COM FAILED', 5);
                        } else if (cpdlcMessages[0].ComStatus === AtsuMessageComStatus.Sent) {
                            setStatus('Mainpage', 'SENT', 5);
                        }
                    }
                } else if (cpdlcMessages[0].Response !== undefined) {
                    // received an update for a response
                    if (dcduBlock[0][0].Response !== undefined) {
                        if (dcduBlock[0][0].Response.ComStatus !== cpdlcMessages[0].Response.ComStatus) {
                            if (cpdlcMessages[0].Response.ComStatus === AtsuMessageComStatus.Failed) {
                                setStatus('Mainpage', 'COM FAILED', 5);
                            } else if (cpdlcMessages[0].Response.ComStatus === AtsuMessageComStatus.Sent) {
                                setStatus('Mainpage', 'SENT', 5);
                            }
                        }
                    } else if (cpdlcMessages[0].Response.ComStatus === AtsuMessageComStatus.Failed) {
                        setStatus('Mainpage', 'COM FAILED', 5);
                    } else if (cpdlcMessages[0].Response.ComStatus === AtsuMessageComStatus.Sent) {
                        setStatus('Mainpage', 'SENT', 5);
                    }
                }

                // update the communication states and response
                dcduBlock[0].forEach((message) => {
                    if (cpdlcMessages[0].ComStatus !== undefined) {
                        message.ComStatus = cpdlcMessages[0].ComStatus;
                    }
                    message.Response = cpdlcMessages[0].Response;
                });

                // response sent
                if (cpdlcMessages[0].Response !== undefined && cpdlcMessages[0].Response.ComStatus === AtsuMessageComStatus.Sent) {
                    dcduBlock[2] = -1;
                }
            } else {
                newMessageMap.set(cpdlcMessages[0].UniqueMessageID, [cpdlcMessages, new Date().getTime(), -1]);
            }
            setMessages(newMessageMap);

            if (messageUid === -1) {
                setMessageUid(cpdlcMessages[0].UniqueMessageID);
            }
        }
    });
    useCoherentEvent('A32NX_DCDU_MSG_DELETE_UID', (uid: number) => {
        closeMessage(uid);
    });
    useCoherentEvent('A32NX_DCDU_ATC_LOGON_MSG', (message: string) => {
        setAtcMessage(message);
    });

    useEffect(() => {
        if (state === DcduState.On && electricityState === 0) {
            setState(DcduState.Standby);
            setScreenTimeout(setTimeout(() => setState(DcduState.Off), 10000));
        } else if (state === DcduState.Standby && electricityState !== 0) {
            setState(DcduState.On);
            if (screenTimeout) {
                clearTimeout(screenTimeout);
                setScreenTimeout(null);
            }
        } else if (state === DcduState.Off && electricityState !== 0) {
            setState(DcduState.Selftest);
            setScreenTimeout(setTimeout(() => {
                setState(DcduState.Waiting);
                setScreenTimeout(setTimeout(() => setState(DcduState.On), 12000));
            }, 6000));
        } else if ((state === DcduState.Selftest || state === DcduState.Waiting) && electricityState === 0) {
            setState(DcduState.Off);
            if (screenTimeout) {
                clearTimeout(screenTimeout);
                setScreenTimeout(null);
            }
        }
    }, [electricityState]);

    // prepare the data
    let messageIndex = -1;
    let visibleMessages: CpdlcMessage[] | undefined = undefined;
    let response: number = -1;
    if (state === DcduState.On && messagesRef.current?.size !== 0) {
        const arrMessages = sortedMessageArray(messagesRef.current);

        if (messageUid !== -1) {
            messageIndex = arrMessages.findIndex((element) => messageUid === element[0][0].UniqueMessageID);
            if (messageIndex !== -1) {
                visibleMessages = arrMessages[messageIndex][0];
                response = arrMessages[messageIndex][2];
            }
        }
    }

    let answerRequired = false;
    if (visibleMessages !== undefined && visibleMessages[0].Direction === AtsuMessageDirection.Uplink) {
        answerRequired = visibleMessages[0].Content?.ExpectedResponse !== CpdlcMessageExpectedResponseType.NotRequired
                         && visibleMessages[0].Content?.ExpectedResponse !== CpdlcMessageExpectedResponseType.No;
    }

    switch (state) {
    case DcduState.Selftest:
        return (
            <>
                <div className="BacklightBleed" />
                <SelfTest />
            </>
        );
    case DcduState.Waiting:
        return (
            <>
                <div className="BacklightBleed" />
                <WaitingForData />
            </>
        );
    case DcduState.Off:
        return <></>;
    default:
        return (
            <>
                <div className="BacklightBleed" />
                <svg className="dcdu">
                    {(visibleMessages === undefined && atcMessage !== '' && (
                        <>
                            <AtcStatus message={atcMessage} />
                        </>
                    )
                    )}
                    {(visibleMessages !== undefined && (
                        <>
                            <MessageStatus
                                message={visibleMessages[0]}
                                selectedResponse={response}
                            />
                            <DatalinkMessage
                                messages={visibleMessages}
                                setStatus={setStatus}
                                isStatusAvailable={isStatusAvailable}
                                resetStatus={resetStatus}
                            />
                        </>
                    ))}
                    {(visibleMessages !== undefined && answerRequired && visibleMessages[0].Content?.ExpectedResponse === CpdlcMessageExpectedResponseType.WilcoUnable && (
                        <WilcoUnableButtons
                            message={visibleMessages[0]}
                            selectedResponse={response}
                            setMessageStatus={setMessageStatus}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            sendResponse={sendResponse}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(visibleMessages !== undefined && answerRequired && visibleMessages[0].Content?.ExpectedResponse === CpdlcMessageExpectedResponseType.AffirmNegative && (
                        <AffirmNegativeButtons
                            message={visibleMessages[0]}
                            selectedResponse={response}
                            setMessageStatus={setMessageStatus}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            sendResponse={sendResponse}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(visibleMessages !== undefined && answerRequired && visibleMessages[0].Content?.ExpectedResponse === CpdlcMessageExpectedResponseType.Roger && (
                        <RogerButtons
                            message={visibleMessages[0]}
                            selectedResponse={response}
                            setMessageStatus={setMessageStatus}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            sendResponse={sendResponse}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(visibleMessages !== undefined && !answerRequired && visibleMessages[0].Direction === AtsuMessageDirection.Downlink && (
                        <OutputButtons
                            message={visibleMessages[0]}
                            setStatus={setStatus}
                            isStatusAvailable={isStatusAvailable}
                            sendMessage={sendMessage}
                            deleteMessage={deleteMessage}
                            closeMessage={closeMessage}
                        />
                    ))}
                    {(visibleMessages !== undefined && !answerRequired && visibleMessages[0].Direction === AtsuMessageDirection.Uplink && (
                        <CloseButtons
                            message={visibleMessages[0]}
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
                        (messagesRef.current.size > 1
                        && (
                            <>
                                <g>
                                    <text className="status-atsu" x="35%" y="2480">MSG</text>
                                    <text className="status-atsu" x="35%" y="2720">
                                        {messageIndex + 1}
                                        {' '}
                                        /
                                        {' '}
                                        {messagesRef.current.size}
                                    </text>
                                </g>
                            </>
                        ))
                    }
                </svg>
            </>
        );
    }
};

render(<DCDU />);
