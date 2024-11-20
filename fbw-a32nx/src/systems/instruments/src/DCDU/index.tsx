// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import React, { useEffect, useState, useRef } from 'react';
import { EventBus, Publisher, EventSubscriber } from '@microsoft/msfs-sdk';
import { useSimVar, useInteractionEvents } from '@flybywiresim/fbw-sdk';
import {
  AtsuMessageComStatus,
  AtsuMessageDirection,
  DclMessage,
  OclMessage,
  CpdlcMessage,
  CpdlcMessageMonitoringState,
  CpdlcMessageExpectedResponseType,
  Conversion,
  AtsuMailboxMessages,
  MailboxStatusMessage,
} from '@datalink/common';
import { SemanticResponseButtons } from './elements/SemanticResponseButtons';
import { OutputButtons } from './elements/OutputButtons';
import { AffirmNegativeButtons } from './elements/AffirmNegativeButtons';
import { WilcoUnableButtons } from './elements/WilcoUnableButtons';
import { RogerButtons } from './elements/RogerButtons';
import { CloseButtons } from './elements/CloseButtons';
import { RecallButtons } from './elements/RecallButtons';
import { render } from '../Common';
import { SelfTest } from './pages/SelfTest';
import { AtsuStatusMessage } from './elements/AtsuStatusMessage';
import { WaitingForData } from './pages/WaitingForData';
import { DcduLines } from './elements/DcduLines';
import { DatalinkMessage } from './elements/DatalinkMessage';
import { MessageStatus } from './elements/MessageStatus';
import { AtcStatus } from './elements/AtcStatus';
import { useUpdate } from '../util.js';

import './style.scss';

enum DcduState {
  Off,
  On,
  Selftest,
  Waiting,
  Standby,
}

export class DcduMessageBlock {
  public messages: CpdlcMessage[] = [];

  public timestamp: number = 0;

  public response: number = -1;

  public statusMessage: MailboxStatusMessage = MailboxStatusMessage.NoMessage;

  public messageVisible: boolean = false;

  public automaticCloseTimeout: number = -1;

  public semanticResponseIncomplete: boolean = false;

  public reachedEndOfMessage: boolean = false;
}

const sortedMessageArray = (messages: Map<number, DcduMessageBlock>): DcduMessageBlock[] => {
  const arrMessages = Array.from(messages.values());
  arrMessages.sort((a, b) => a.timestamp - b.timestamp);
  return arrMessages;
};

const DcduSystemStatusDuration = 5000;

const DCDU: React.FC = () => {
  const [publisher, setPublisher] = useState<Publisher<AtsuMailboxMessages> | null>(null);
  const [_subscriber, setSubscriber] = useState<EventSubscriber<AtsuMailboxMessages> | null>(null);
  const [electricityState] = useSimVar('L:A32NX_ELEC_DC_1_BUS_IS_POWERED', 'bool', 200);
  const [isColdAndDark] = useSimVar('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool', 200);
  const [state, setState] = useState(isColdAndDark ? DcduState.Off : DcduState.On);
  const [systemStatusMessage, setSystemStatusMessage] = useState(MailboxStatusMessage.NoMessage);
  const [systemStatusTimer, setSystemStatusTimer] = useState<number | null>(null);
  const [screenTimeout, setScreenTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [messages, setMessages] = useState(new Map<number, DcduMessageBlock>());
  const publisherRef = useRef<Publisher<AtsuMailboxMessages> | null>();
  const messagesRef = useRef<Map<number, DcduMessageBlock>>();
  const [atcMessage, setAtcMessage] = useState('');

  messagesRef.current = messages;
  publisherRef.current = publisher;

  const updateSystemStatusMessage = (status: MailboxStatusMessage) => {
    setSystemStatusMessage(status);
    setSystemStatusTimer(5000);
  };

  const reachedEndOfMessage = (uid: number, reachedEnd: boolean) => {
    if (!messagesRef.current) {
      return;
    }

    const updateMap = new Map<number, DcduMessageBlock>(messagesRef.current);

    const entry = updateMap.get(uid);
    if (entry !== undefined) {
      entry.reachedEndOfMessage = reachedEnd;
    }

    setMessages(updateMap);
  };

  const setMessageStatus = (uid: number, response: number) => {
    if (!messagesRef.current) {
      return;
    }

    const updateMap = new Map<number, DcduMessageBlock>(messagesRef.current);

    const entry = updateMap.get(uid);
    if (entry !== undefined) {
      publisherRef.current?.pub('readMessage', uid, true, false);
      entry.response = response;
    }

    setMessages(updateMap);
  };

  const deleteMessage = (uid: number) => publisherRef.current?.pub('deleteMessage', uid, true, false);
  const sendMessage = (uid: number) => publisherRef.current?.pub('downlinkTransmit', uid, true, false);
  const sendResponse = (uid: number, responseId: number) =>
    publisherRef.current?.pub('uplinkResponse', { uid, responseId }, true, false);

  // functions to handle the internal queue
  const invertResponse = (uid: number) => {
    publisherRef.current?.pub('invertSemanticResponse', uid, true, false);
  };
  const modifyResponse = (uid: number) => {
    if (!messagesRef.current) {
      return;
    }

    const message = messagesRef.current.get(uid);
    if (message) {
      message.statusMessage = MailboxStatusMessage.FmsDisplayForModification;
      publisherRef.current?.pub('readMessage', uid, true, false);
      publisherRef.current?.pub('modifyMessage', uid, true, false);
    }

    setMessages(new Map<number, DcduMessageBlock>(messagesRef.current));
  };
  const recallMessage = () => {
    publisherRef.current?.pub('recallMessage', true, true, false);
  };
  const closeMessage = (uid: number) => {
    if (!messagesRef.current) {
      return;
    }

    const sortedMessages = sortedMessageArray(messagesRef.current);
    const index = sortedMessages.findIndex((element) => element.messages[0].UniqueMessageID === uid);

    publisherRef.current?.pub('closeMessage', uid, true, false);

    if (index !== -1) {
      setSystemStatusMessage(MailboxStatusMessage.NoMessage);
      setSystemStatusTimer(null);

      // update the map
      const updatedMap = new Map<number, DcduMessageBlock>(messagesRef.current);

      // define the next visible message
      if (index > 0) {
        const message = updatedMap.get(sortedMessages[index - 1].messages[0].UniqueMessageID);
        if (message) {
          message.messageVisible = true;
          publisherRef.current.pub('visibleMessage', message.messages[0].UniqueMessageID, true, false);
        }
      } else if (index + 1 < sortedMessages.length) {
        const message = updatedMap.get(sortedMessages[index + 1].messages[0].UniqueMessageID);
        if (message) {
          message.messageVisible = true;
          publisherRef.current.pub('visibleMessage', message.messages[0].UniqueMessageID, true, false);
        }
      }

      updatedMap.delete(uid);

      // no other message visible
      if (updatedMap.size === 0) {
        publisherRef.current.pub('visibleMessage', -1, true, false);
      }

      setMessages(updatedMap);
    }
  };
  const monitorMessage = (uid: number) => publisherRef.current?.pub('updateMessageMonitoring', uid, true, false);
  const stopMessageMonitoring = (uid: number) => publisherRef.current?.pub('stopMessageMonitoring', uid, true, false);

  // the message scroll button handling
  useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0MINUS', 'A32NX_DCDU_BTN_MPR_MS0MINUS'], () => {
    if (!messagesRef.current || messagesRef.current.size === 0) {
      return;
    }

    const sortedMessages = sortedMessageArray(messagesRef.current);
    const index = sortedMessages.findIndex((element) => element.messageVisible);

    if (index <= 0) {
      setSystemStatusMessage(MailboxStatusMessage.NoMoreMessages);
      setSystemStatusTimer(DcduSystemStatusDuration);
    } else {
      setSystemStatusMessage(MailboxStatusMessage.NoMessage);
      setSystemStatusTimer(null);

      const oldMessage = messagesRef.current.get(sortedMessages[index].messages[0].UniqueMessageID);
      const newMessage = messagesRef.current.get(sortedMessages[index - 1].messages[0].UniqueMessageID);
      if (oldMessage && newMessage) {
        oldMessage.messageVisible = false;
        newMessage.messageVisible = true;
        setMessages(new Map<number, DcduMessageBlock>(messagesRef.current));
        publisherRef.current.pub('visibleMessage', newMessage.messages[0].UniqueMessageID, true, false);
      }
    }
  });
  useInteractionEvents(['A32NX_DCDU_BTN_MPL_MS0PLUS', 'A32NX_DCDU_BTN_MPR_MS0PLUS'], () => {
    if (!messagesRef.current || messagesRef.current.size === 0) {
      return;
    }

    const sortedMessages = sortedMessageArray(messagesRef.current);
    const index = sortedMessages.findIndex((element) => element.messageVisible);

    if (index + 1 >= sortedMessages.length) {
      setSystemStatusMessage(MailboxStatusMessage.NoMoreMessages);
      setSystemStatusTimer(DcduSystemStatusDuration);
    } else {
      setSystemStatusMessage(MailboxStatusMessage.NoMessage);
      setSystemStatusTimer(null);

      const oldMessage = messagesRef.current.get(sortedMessages[index].messages[0].UniqueMessageID);
      const newMessage = messagesRef.current.get(sortedMessages[index + 1].messages[0].UniqueMessageID);
      if (oldMessage && newMessage) {
        oldMessage.messageVisible = false;
        newMessage.messageVisible = true;
        setMessages(new Map<number, DcduMessageBlock>(messagesRef.current));
        publisherRef.current.pub('visibleMessage', newMessage.messages[0].UniqueMessageID, true, false);
      }
    }
  });
  useInteractionEvents(['A32NX_DCDU_BTN_MPL_PRINT', 'A32NX_DCDU_BTN_MPR_PRINT'], () => {
    if (!messagesRef.current || messagesRef.current.size === 0) {
      return;
    }

    const sortedMessages = sortedMessageArray(messagesRef.current);
    const index = sortedMessages.findIndex((element) => element.messageVisible);
    if (index !== -1) {
      publisherRef.current?.pub('printMessage', sortedMessages[index].messages[0].UniqueMessageID, true, false);
    }
  });

  // initialize the event bus
  useEffect(() => {
    const eventBus = new EventBus();
    setPublisher(eventBus.getPublisher<AtsuMailboxMessages>());

    const newSubscriber = eventBus.getSubscriber<AtsuMailboxMessages>();

    newSubscriber.on('resetSystem').handle(() => {
      setSystemStatusMessage(MailboxStatusMessage.NoMessage);
      setSystemStatusTimer(null);
      if (screenTimeout) {
        clearTimeout(screenTimeout);
        setScreenTimeout(null);
      }

      setMessages(new Map<number, DcduMessageBlock>());
      setAtcMessage('');
    });

    const handleIncomingMessages = (cpdlcMessages: CpdlcMessage[]): void => {
      if (!messagesRef.current) {
        return;
      }

      const enhancedMessages: CpdlcMessage[] = [];
      cpdlcMessages.forEach((message) =>
        enhancedMessages.push(Conversion.messageDataToMessage(message) as CpdlcMessage),
      );

      if (enhancedMessages.length !== 0) {
        const newMessageMap = new Map<number, DcduMessageBlock>(messagesRef.current);
        const dcduBlock = newMessageMap.get(enhancedMessages[0].UniqueMessageID);

        if (dcduBlock !== undefined) {
          // update the communication states and response
          dcduBlock.messages = enhancedMessages;

          if (dcduBlock.statusMessage === MailboxStatusMessage.NoMessage) {
            if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
              dcduBlock.statusMessage = MailboxStatusMessage.Monitoring;
            } else if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Cancelled) {
              dcduBlock.statusMessage = MailboxStatusMessage.MonitoringCancelled;
            }
          } else if (dcduBlock.statusMessage === MailboxStatusMessage.Monitoring) {
            if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Cancelled) {
              dcduBlock.statusMessage = MailboxStatusMessage.MonitoringCancelled;
            } else if (enhancedMessages[0].MessageMonitoring !== CpdlcMessageMonitoringState.Monitoring) {
              dcduBlock.statusMessage = MailboxStatusMessage.NoMessage;
            }
          } else if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Finished) {
            dcduBlock.statusMessage = MailboxStatusMessage.NoMessage;
          }

          // response sent
          if (enhancedMessages[0].Response?.ComStatus === AtsuMessageComStatus.Sent) {
            dcduBlock.response = -1;
          }
        } else {
          const message = new DcduMessageBlock();
          message.messages = enhancedMessages;
          message.timestamp = new Date().getTime();
          if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
            message.statusMessage = MailboxStatusMessage.Monitoring;
          } else if (enhancedMessages[0].MessageMonitoring === CpdlcMessageMonitoringState.Cancelled) {
            message.statusMessage = MailboxStatusMessage.MonitoringCancelled;
          }
          newMessageMap.set(enhancedMessages[0].UniqueMessageID, message);
        }

        // check if we have a semantic response and all data is available
        if (
          enhancedMessages[0].SemanticResponseRequired &&
          enhancedMessages[0].Response &&
          enhancedMessages[0].Response.Content
        ) {
          const dcduBlock = newMessageMap.get(enhancedMessages[0].UniqueMessageID);
          if (dcduBlock) {
            dcduBlock.semanticResponseIncomplete = false;
            if (
              dcduBlock.statusMessage === MailboxStatusMessage.NoFmData ||
              dcduBlock.statusMessage === MailboxStatusMessage.FmsDisplayForModification
            ) {
              dcduBlock.statusMessage = MailboxStatusMessage.NoMessage;
            }

            for (const entry of enhancedMessages[0].Response.Content[0].Content) {
              if (entry.Value === '') {
                dcduBlock.semanticResponseIncomplete = true;
                dcduBlock.statusMessage = MailboxStatusMessage.NoFmData;
                break;
              }
            }
          }
        }

        if (newMessageMap.size === 1) {
          const message = newMessageMap.get(enhancedMessages[0].UniqueMessageID);
          if (message) {
            message.messageVisible = true;
            publisherRef.current.pub('visibleMessage', message.messages[0].UniqueMessageID, true, false);
          }
        }

        setMessages(newMessageMap);
      }
    };

    newSubscriber.on('cpdlcMessages').handle((messages: CpdlcMessage[]) => handleIncomingMessages(messages));
    newSubscriber.on('dclMessages').handle((messages: DclMessage[]) => handleIncomingMessages(messages));
    newSubscriber.on('oclMessages').handle((messages: OclMessage[]) => handleIncomingMessages(messages));
    newSubscriber.on('deleteMessage').handle((uid: number) => closeMessage(uid));
    newSubscriber.on('logonMessage').handle((message: string) => setAtcMessage(message));
    newSubscriber.on('systemStatus').handle((status: MailboxStatusMessage) => {
      setSystemStatusMessage(status);
      setSystemStatusTimer(5000);
    });
    newSubscriber.on('messageStatus').handle((data: { uid: number; status: MailboxStatusMessage }) => {
      if (!messagesRef.current) {
        return;
      }

      const dcduBlock = messagesRef.current.get(data.uid);
      if (dcduBlock !== undefined) {
        dcduBlock.statusMessage = data.status;
        if (data.status === MailboxStatusMessage.NoMessage) {
          if (dcduBlock.messages[0].MessageMonitoring === CpdlcMessageMonitoringState.Monitoring) {
            dcduBlock.statusMessage = MailboxStatusMessage.Monitoring;
          } else if (dcduBlock.messages[0].MessageMonitoring === CpdlcMessageMonitoringState.Cancelled) {
            dcduBlock.statusMessage = MailboxStatusMessage.MonitoringCancelled;
          }
        }
        setMessages(new Map<number, DcduMessageBlock>(messagesRef.current));
      }
    });

    setSubscriber(newSubscriber);

    // remove the subscriber to avoid memory leaks
    return () => {
      // TODO reset also all internal subscriber references as soon as the new MSFS SDK is in place
      setSubscriber(null);
    };
  }, []);

  useUpdate((deltaTime) => {
    if (messagesRef.current === undefined) {
      return;
    }

    // check if the timeout of messages is triggered
    const currentTime = new Date().getTime() / 1000;
    const sortedArray = sortedMessageArray(messagesRef.current);
    sortedArray.forEach((message) => {
      if (message.messages[0].CloseAutomatically) {
        if (message.messageVisible && message.automaticCloseTimeout < 0) {
          const cpdlcMessage = message.messages[0];

          // start the timeout
          if (
            (cpdlcMessage.Direction === AtsuMessageDirection.Downlink &&
              cpdlcMessage.ComStatus === AtsuMessageComStatus.Sent) ||
            (cpdlcMessage.Direction === AtsuMessageDirection.Uplink &&
              cpdlcMessage.Response?.Content[0].TypeId !== 'DM2' &&
              cpdlcMessage.Response?.ComStatus === AtsuMessageComStatus.Sent)
          ) {
            message.automaticCloseTimeout = new Date().getTime() / 1000;
          }
        } else if (
          message.automaticCloseTimeout > 0 &&
          currentTime - message.automaticCloseTimeout >= 2.0 &&
          message.messages[0].MessageMonitoring !== CpdlcMessageMonitoringState.Finished
        ) {
          // check if the timeout is reached
          closeMessage(message.messages[0].UniqueMessageID);
        } else if (!message.messageVisible) {
          // reset the timeout of invisible messages
          message.automaticCloseTimeout = -1;
        }
      }
    });

    if (systemStatusTimer !== null) {
      if (systemStatusTimer > 0) {
        setSystemStatusTimer(systemStatusTimer - deltaTime);
      } else {
        setSystemStatusMessage(MailboxStatusMessage.NoMessage);
        setSystemStatusTimer(null);
      }
    }
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
      setScreenTimeout(
        setTimeout(() => {
          setState(DcduState.Waiting);
          setScreenTimeout(setTimeout(() => setState(DcduState.On), 12000));
        }, 6000),
      );
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
  let messageReadComplete: boolean = true;
  let visibleMessagesSemanticResponseIncomplete: boolean = false;
  let visibleMessages: CpdlcMessage[] | undefined = undefined;
  let visibleMessageStatus: MailboxStatusMessage = MailboxStatusMessage.NoMessage;
  let response: number = -1;
  if (state === DcduState.On && messages.size !== 0) {
    const arrMessages = sortedMessageArray(messagesRef.current);

    messageIndex = arrMessages.findIndex((element) => element.messageVisible);
    if (messageIndex !== -1) {
      response = arrMessages[messageIndex].response;
      visibleMessages = arrMessages[messageIndex].messages;
      messageReadComplete = arrMessages[messageIndex].reachedEndOfMessage;
      visibleMessageStatus = arrMessages[messageIndex].statusMessage;
      visibleMessagesSemanticResponseIncomplete = arrMessages[messageIndex].semanticResponseIncomplete;
    }

    // check if PRIORITY MSG + needs to be visualized
    let noUrgentMessage = true;
    arrMessages.forEach((message) => {
      if (message.messages[0].Content[0]?.Urgent && !message.messageVisible) {
        if (systemStatusMessage !== MailboxStatusMessage.PriorityMessage) {
          setSystemStatusMessage(MailboxStatusMessage.PriorityMessage);
          setSystemStatusTimer(-1);
        }
        noUrgentMessage = false;
      }
    });

    if (noUrgentMessage && systemStatusMessage === MailboxStatusMessage.PriorityMessage) {
      setSystemStatusMessage(MailboxStatusMessage.NoMessage);
    }
  }

  let answerRequired = false;
  if (visibleMessages !== undefined && visibleMessages[0].Direction === AtsuMessageDirection.Uplink) {
    answerRequired =
      visibleMessages[0].Content[0].ExpectedResponse !== CpdlcMessageExpectedResponseType.NotRequired &&
      visibleMessages[0].Content[0].ExpectedResponse !== CpdlcMessageExpectedResponseType.No;
  }

  switch (state) {
    case DcduState.Selftest:
      return <SelfTest />;
    case DcduState.Waiting:
      return <WaitingForData />;
    case DcduState.Off:
      return <></>;
    default:
      return (
        <>
          <svg className="dcdu">
            {visibleMessages === undefined && atcMessage !== '' && (
              <>
                <AtcStatus message={atcMessage} />
              </>
            )}
            {visibleMessages !== undefined && (
              <>
                <MessageStatus message={visibleMessages[0]} selectedResponse={response} />
                <DatalinkMessage
                  messages={visibleMessages}
                  updateSystemStatusMessage={updateSystemStatusMessage}
                  reachedEndOfMessage={reachedEndOfMessage}
                />
              </>
            )}
            {visibleMessages !== undefined &&
              answerRequired &&
              !visibleMessages[0].SemanticResponseRequired &&
              visibleMessages[0].Content[0].ExpectedResponse === CpdlcMessageExpectedResponseType.WilcoUnable && (
                <WilcoUnableButtons
                  message={visibleMessages[0]}
                  reachedEndOfMessage={messageReadComplete}
                  selectedResponse={response}
                  setMessageStatus={setMessageStatus}
                  sendResponse={sendResponse}
                  closeMessage={closeMessage}
                  monitorMessage={monitorMessage}
                  cancelMessageMonitoring={stopMessageMonitoring}
                />
              )}
            {visibleMessages !== undefined &&
              answerRequired &&
              !visibleMessages[0].SemanticResponseRequired &&
              visibleMessages[0].Content[0].ExpectedResponse === CpdlcMessageExpectedResponseType.AffirmNegative && (
                <AffirmNegativeButtons
                  message={visibleMessages[0]}
                  reachedEndOfMessage={messageReadComplete}
                  selectedResponse={response}
                  setMessageStatus={setMessageStatus}
                  sendResponse={sendResponse}
                  closeMessage={closeMessage}
                  monitorMessage={monitorMessage}
                  cancelMessageMonitoring={stopMessageMonitoring}
                />
              )}
            {visibleMessages !== undefined &&
              answerRequired &&
              !visibleMessages[0].SemanticResponseRequired &&
              visibleMessages[0].Content[0].ExpectedResponse === CpdlcMessageExpectedResponseType.Roger && (
                <RogerButtons
                  message={visibleMessages[0]}
                  reachedEndOfMessage={messageReadComplete}
                  selectedResponse={response}
                  setMessageStatus={setMessageStatus}
                  sendResponse={sendResponse}
                  closeMessage={closeMessage}
                  monitorMessage={monitorMessage}
                  cancelMessageMonitoring={stopMessageMonitoring}
                />
              )}
            {visibleMessages !== undefined &&
              !answerRequired &&
              !visibleMessages[0].SemanticResponseRequired &&
              visibleMessages[0].Direction === AtsuMessageDirection.Downlink && (
                <OutputButtons
                  message={visibleMessages[0]}
                  reachedEndOfMessage={messageReadComplete}
                  sendMessage={sendMessage}
                  deleteMessage={deleteMessage}
                  closeMessage={closeMessage}
                />
              )}
            {visibleMessages !== undefined &&
              visibleMessages[0].SemanticResponseRequired &&
              visibleMessages[0].Direction === AtsuMessageDirection.Uplink && (
                <SemanticResponseButtons
                  message={visibleMessages[0]}
                  reachedEndOfMessage={messageReadComplete}
                  messageUnderModification={
                    visibleMessageStatus === MailboxStatusMessage.FmsDisplayForModification ||
                    visibleMessageStatus === MailboxStatusMessage.FmsDisplayForText
                  }
                  dataIncomplete={visibleMessagesSemanticResponseIncomplete}
                  invertResponse={invertResponse}
                  modifyResponse={modifyResponse}
                  sendMessage={sendMessage}
                  closeMessage={closeMessage}
                />
              )}
            {visibleMessages !== undefined &&
              !answerRequired &&
              !visibleMessages[0].SemanticResponseRequired &&
              visibleMessages[0].Direction === AtsuMessageDirection.Uplink && (
                <CloseButtons message={visibleMessages[0]} closeMessage={closeMessage} />
              )}
            {visibleMessages === undefined && <RecallButtons recallMessage={recallMessage} />}
            <AtsuStatusMessage visibleMessage={visibleMessageStatus} systemMessage={systemStatusMessage} />
            <DcduLines />
            {messagesRef.current.size > 1 && (
              <>
                <g>
                  <text className="status-atsu" fill="white" x="35%" y="2480">
                    MSG
                  </text>
                  <text className="status-atsu" fill="white" x="35%" y="2720">
                    {messageIndex + 1} / {messagesRef.current.size}
                  </text>
                </g>
              </>
            )}
          </svg>
        </>
      );
  }
};

render(<DCDU />);
