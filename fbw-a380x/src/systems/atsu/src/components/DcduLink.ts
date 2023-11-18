//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Atc } from '../ATC';
import { Atsu } from '../ATSU';
import { AtsuMessage, AtsuMessageDirection } from '../messages/AtsuMessage';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { UplinkMessageStateMachine } from './UplinkMessageStateMachine';

export enum DcduStatusMessage {
    NoMessage = -1,
    AnswerRequired = 0,
    CommunicationFault,
    CommunicationNotAvailable,
    CommunicationNotInitialized,
    MaximumDownlinkMessages,
    LinkLost,
    FlightplanLoadFailed,
    FlightplanLoadPartial,
    FlightplanLoadingUnavailable,
    MonitoringFailed,
    MonitoringLost,
    MonitoringUnavailable,
    NoAtcReply,
    OverflowClosed,
    PrintFailed,
    PriorityMessage,
    SendFailed = 16,
    FlightplanLoadSecondary,
    FlightplanLoadingSecondary,
    McduForText,
    McduForModification,
    MonitoringCancelled,
    Monitoring,
    NoFmData,
    NoMoreMessages,
    NoMorePages,
    PartialFmgsData,
    Printing,
    RecallMode,
    RecallEmpty,
    Reminder,
    Sending,
    Sent,
    WaitFmData
}

class DcduMessage {
    public MessageId: number = 0;

    public Station: string = '';

    public MessageSent = false;

    public MessageRead = false;

    public PriorityMessage = false;

    public Status: DcduStatusMessage = DcduStatusMessage.NoMessage;

    public Direction: AtsuMessageDirection = null;
}

export class DcduLink {
    private static MaxDcduFileSize = 5;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    private atsu: Atsu = null;

    private atc: Atc = null;

    private downlinkMessages: (DcduMessage[])[] = [];

    private uplinkMessages: (DcduMessage[])[] = [];

    private bufferedDownlinkMessages: (DcduMessage[])[] = [];

    private bufferedUplinkMessages: (DcduMessage[])[] = [];

    private lastClosedMessage: [DcduMessage[], number] = null;

    private atcMsgWatchdogInterval: number = null;

    private atcRingInterval: number = null;

    private closeMessage(messages: (DcduMessage[])[], backlog: (DcduMessage[])[], uid: number, uplink: boolean): boolean {
        const idx = messages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx !== -1) {
            // validate that message exists in the queue
            const message = this.atc.messages().find((elem) => elem.UniqueMessageID === uid);

            if ((!this.lastClosedMessage || this.lastClosedMessage[0][0].MessageId !== uid) && message !== undefined) {
                this.lastClosedMessage = [messages[idx], new Date().getTime()];
            }

            messages.splice(idx, 1);
            if (uplink) {
                this.validateNotificationCondition();
            }

            // add buffered messages
            while (backlog.length !== 0 && messages.length !== DcduLink.MaxDcduFileSize) {
                const bufferedBlock = backlog.shift();
                const dcduMessages = [];
                messages.push([]);

                bufferedBlock.forEach((data) => {
                    const message = this.atc.messages().find((elem) => elem.UniqueMessageID === data.MessageId);
                    if (message !== undefined) {
                        messages[messages.length - 1].push(data);

                        // pushed a new inbound message
                        if (!data.MessageRead) {
                            this.setupIntervals();
                        }

                        if ((message as CpdlcMessage).DcduRelevantMessage) {
                            dcduMessages.push(message);
                        }
                    }
                });

                if (dcduMessages.length !== 0) {
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', dcduMessages);
                }
            }
        }

        return idx !== -1;
    }

    constructor(atsu: Atsu, atc: Atc) {
        this.atsu = atsu;
        this.atc = atc;

        Coherent.on('A32NX_ATSU_DELETE_MESSAGE', (uid: number) => {
            let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                this.uplinkMessages[idx].forEach((message) => {
                    this.atc.removeMessage(message.MessageId);
                });
            } else {
                idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
                if (idx > -1) {
                    this.downlinkMessages[idx].forEach((message) => {
                        this.atc.removeMessage(message.MessageId);
                    });
                }
            }
        });

        Coherent.on('A32NX_ATSU_SEND_RESPONSE', (uid: number, response: number) => {
            const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                // iterate in reverse order to ensure that the "identification" message is the last message in the queue
                // ensures that the DCDU-status change to SENT is done after every message is sent
                this.uplinkMessages[idx].slice().reverse().forEach((message) => {
                    this.atc.sendResponse(message.MessageId, response);
                });
            }
        });

        Coherent.on('A32NX_ATSU_SEND_MESSAGE', (uid: number) => {
            let idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                // iterate in reverse order to ensure that the "identification" message is the last message in the queue
                // ensures that the DCDU-status change to SENT is done after every message is sent
                this.downlinkMessages[idx].slice().reverse().forEach((entry) => {
                    const message = this.atc.messages().find((element) => element.UniqueMessageID === entry.MessageId);
                    if (message !== undefined) {
                        if (message.Direction === AtsuMessageDirection.Downlink) {
                            this.atc.sendMessage(message).then((code) => {
                                if (code !== AtsuStatusCodes.Ok) {
                                    this.atsu.publishAtsuStatusCode(code);
                                }
                            });
                        }
                    }
                });

                return;
            }

            idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
                if (message !== undefined) {
                    const cpdlcMessage = message as CpdlcMessage;
                    if (cpdlcMessage.Response && cpdlcMessage.SemanticResponseRequired) {
                        this.atc.sendExistingResponse(uid);
                    }
                }
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_MODIFY_RESPONSE', (uid: number) => {
            const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
                if (message !== undefined) {
                    this.atsu.modifyDcduMessage(message as CpdlcMessage);
                }
            }
        });

        Coherent.on('A32NX_ATSU_PRINT_MESSAGE', (uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                this.updateDcduStatusMessage(uid, DcduStatusMessage.Printing);
                this.atsu.printMessage(message);
                setTimeout(() => {
                    if (this.currentDcduStatusMessage(uid) === DcduStatusMessage.Printing) {
                        this.updateDcduStatusMessage(uid, DcduStatusMessage.NoMessage);
                    }
                }, 4500);
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_CLOSED', (uid: number) => {
            if (!this.closeMessage(this.uplinkMessages, this.bufferedUplinkMessages, uid, true)) {
                this.closeMessage(this.downlinkMessages, this.bufferedDownlinkMessages, uid, false);
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_MONITORING', (uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            UplinkMessageStateMachine.update(this.atsu, message as CpdlcMessage, true, true);
            this.update(message as CpdlcMessage);
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_STOP_MONITORING', (uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            UplinkMessageStateMachine.update(this.atsu, message as CpdlcMessage, true, false);
            this.update(message as CpdlcMessage);
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_RECALL', () => {
            if (!this.lastClosedMessage) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_SYSTEM_ATSU_STATUS', DcduStatusMessage.RecallEmpty);
            } else {
                const currentStamp = new Date().getTime();
                // timed out after five minutes
                if (currentStamp - this.lastClosedMessage[1] > 300000) {
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_SYSTEM_ATSU_STATUS', DcduStatusMessage.RecallEmpty);
                    this.lastClosedMessage = undefined;
                } else {
                    const messages : CpdlcMessage[] = [];

                    this.lastClosedMessage[0].forEach((dcduMessage) => {
                        const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === dcduMessage.MessageId);
                        if (msg !== undefined) {
                            messages.push(msg as CpdlcMessage);
                        }
                    });

                    messages[0].CloseAutomatically = false;
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', messages);
                    if (this.lastClosedMessage[0][0].Direction === AtsuMessageDirection.Downlink) {
                        this.downlinkMessages.push(this.lastClosedMessage[0]);
                    } else {
                        this.uplinkMessages.push(this.lastClosedMessage[0]);
                    }
                    this.updateDcduStatusMessage(messages[0].UniqueMessageID, DcduStatusMessage.RecallMode);
                }
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_READ', (uid: number) => {
            const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx !== -1) {
                this.uplinkMessages[idx][0].MessageRead = true;
                this.validateNotificationCondition();
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_INVERT_SEMANTIC_RESPONSE', (uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                UplinkMessageStateMachine.update(this.atsu, message as CpdlcMessage, true, false);
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', [message]);
            }
        });
    }

    private validateNotificationCondition() {
        // check if the ring tone is still needed
        let unreadMessages = false;
        this.uplinkMessages.forEach((elem) => {
            if (!elem[0].MessageRead) {
                unreadMessages = true;
            }
        });

        if (!unreadMessages) {
            this.cleanupNotifications();
        }
    }

    private estimateRingInterval() {
        let interval = 15000;

        this.uplinkMessages.forEach((elem) => {
            if (!elem[0].MessageRead) {
                if (elem[0].PriorityMessage) {
                    interval = Math.min(interval, 5000);
                } else {
                    interval = Math.min(interval, 15000);
                }
            }
        });

        return interval;
    }

    private atcRingTone() {
        Coherent.call('PLAY_INSTRUMENT_SOUND', 'cpdlc_ring');
        // ensure that the timeout is longer than the sound
        setTimeout(() => SimVar.SetSimVarValue('W:cpdlc_ring', 'boolean', 0), 2000);
    }

    private cleanupNotifications() {
        SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_WAITING', 'boolean', 0);
        SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number', 0);

        if (this.atcMsgWatchdogInterval) {
            clearInterval(this.atcMsgWatchdogInterval);
            this.atcMsgWatchdogInterval = null;
        }

        if (this.atcRingInterval) {
            clearInterval(this.atcRingInterval);
            this.atcRingInterval = null;
        }
    }

    private setupIntervals() {
        if (!this.atcMsgWatchdogInterval) {
            // start the watchdog to check the the ATC MSG button
            this.atcMsgWatchdogInterval = setInterval(() => {
                if (SimVar.GetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number') === 1) {
                    this.cleanupNotifications();
                }
            }, 100);
        }

        if (this.atcRingInterval) {
            clearInterval(this.atcRingInterval);
        }

        // call the first ring tone
        this.atcRingTone();

        // start the ring tone interval
        this.atcRingInterval = setInterval(() => this.atcRingTone(), this.estimateRingInterval());
    }

    public reset() {
        this.listener.triggerToAllSubscribers('A32NX_DCDU_RESET');
    }

    public setAtcLogonMessage(message: string) {
        this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', message);
    }

    public enqueue(messages: AtsuMessage[]) {
        if (messages.length === 0) {
            return;
        }

        const dcduBlocks: DcduMessage[] = [];
        messages.forEach((message) => {
            const block = new DcduMessage();
            block.MessageId = message.UniqueMessageID;
            block.MessageRead = message.Direction === AtsuMessageDirection.Downlink;
            block.Station = message.Station;
            block.Direction = message.Direction;
            block.PriorityMessage = (message as CpdlcMessage).Content[0]?.Urgent;
            dcduBlocks.push(block);
        });

        if (dcduBlocks[0].Direction === AtsuMessageDirection.Downlink && this.downlinkMessages.length < DcduLink.MaxDcduFileSize) {
            this.downlinkMessages.push(dcduBlocks);
        } else if (dcduBlocks[0].Direction === AtsuMessageDirection.Uplink && this.uplinkMessages.length < DcduLink.MaxDcduFileSize) {
            this.uplinkMessages.push(dcduBlocks);
            SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_WAITING', 'boolean', 1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number', 0);
            this.setupIntervals();
        } else {
            if (dcduBlocks[0].Direction === AtsuMessageDirection.Downlink) {
                this.bufferedDownlinkMessages.push(dcduBlocks);
                this.listener.triggerToAllSubscribers('A32NX_DCDU_SYSTEM_ATSU_STATUS', DcduStatusMessage.MaximumDownlinkMessages);
                this.atsu.publishAtsuStatusCode(AtsuStatusCodes.DcduFull);
            } else {
                this.bufferedUplinkMessages.push(dcduBlocks);
                this.listener.triggerToAllSubscribers('A32NX_DCDU_SYSTEM_ATSU_STATUS', DcduStatusMessage.AnswerRequired);
            }
            return;
        }

        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', messages);
    }

    public update(message: CpdlcMessage, insertIfNeeded: boolean = false) {
        // the assumption is that the first message in the block is the UID for the complete block

        const uplinkIdx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === message.UniqueMessageID);
        if (uplinkIdx !== -1) {
            const messages = [];

            // create all messages and overwrite the first because this is the updated
            this.uplinkMessages[uplinkIdx].forEach((dcduMessage) => {
                const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === dcduMessage.MessageId);
                if (msg !== undefined) {
                    if (message.UniqueMessageID !== msg.UniqueMessageID) {
                        messages.push(msg as CpdlcMessage);
                    } else {
                        messages.push(message);
                    }
                }
            });

            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', messages);
            return;
        }

        const downlinkIdx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === message.UniqueMessageID);
        if (downlinkIdx !== -1) {
            const messages = [];

            // create all messages and overwrite the first because this is the updated
            this.downlinkMessages[downlinkIdx].forEach((dcduMessage) => {
                const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === dcduMessage.MessageId);
                if (message.UniqueMessageID !== msg.UniqueMessageID) {
                    messages.push(msg as CpdlcMessage);
                } else {
                    messages.push(message);
                }
            });
            messages[0] = message;

            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', messages);
            return;
        }

        if (insertIfNeeded) {
            this.enqueue([message]);
        }
    }

    public dequeue(uid: number) {
        // the assumption is that the first message in the block is the UID for the complete block
        let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx !== -1) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
        } else {
            idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx !== -1) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
            }
        }
    }

    public updateDcduStatusMessage(uid: number, status: DcduStatusMessage): void {
        // the assumption is that the first message in the block is the UID for the complete block
        const uplinkIdx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (uplinkIdx !== -1) {
            this.uplinkMessages[uplinkIdx][0].Status = status;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_ATSU_STATUS', uid, status);
            return;
        }

        const downlinkIdx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (downlinkIdx !== -1) {
            this.downlinkMessages[downlinkIdx][0].Status = status;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_ATSU_STATUS', uid, status);
        }
    }

    public currentDcduStatusMessage(uid: number): DcduStatusMessage {
        let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx !== -1) {
            return this.uplinkMessages[idx][0].Status;
        }

        idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx !== -1) {
            return this.downlinkMessages[idx][0].Status;
        }

        return DcduStatusMessage.NoMessage;
    }

    public openMessagesForStation(station: string): boolean {
        let retval = false;

        this.uplinkMessages.forEach((block) => {
            if (!block[0].MessageSent && block[0].Station === station) retval = true;
        });

        if (!retval) {
            this.downlinkMessages.forEach((block) => {
                if (!block[0].MessageSent && block[0].Station === station) retval = true;
            });
        }

        if (!retval) {
            this.bufferedUplinkMessages.forEach((block) => {
                if (!block[0].MessageSent && block[0].Station === station) retval = true;
            });
        }

        if (!retval) {
            this.bufferedDownlinkMessages.forEach((block) => {
                if (!block[0].MessageSent && block[0].Station === station) retval = true;
            });
        }

        return retval;
    }
}
