//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessage, AtsuMessageDirection } from '@atsu/common/messages/AtsuMessage';
import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import {
    AtsuMailboxMessages,
    MailboxStatusMessage,
} from '@atsu/common/databus/Mailbox';
import { CpdlcMessage } from '@atsu/common/messages/CpdlcMessage';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';
import { Atsu } from '../ATSU';
import { Atc } from '../ATC';
import { UplinkMessageStateMachine } from '../components/UplinkMessageStateMachine';

class MailboxMessage {
    public MessageId: number = 0;

    public Station: string = '';

    public MessageSent = false;

    public MessageRead = false;

    public PriorityMessage = false;

    public Status: MailboxStatusMessage = MailboxStatusMessage.NoMessage;

    public Direction: AtsuMessageDirection = null;
}

export class MailboxBus {
    private static MaxMailboxFileSize = 5;

    private mailboxBus: EventBus = new EventBus();

    private mailboxPublisher: Publisher<AtsuMailboxMessages> = null;

    private mailboxSubscriber: EventSubscriber<AtsuMailboxMessages> = null;

    private atsu: Atsu = null;

    private atc: Atc = null;

    private downlinkMessages: (MailboxMessage[])[] = [];

    private uplinkMessages: (MailboxMessage[])[] = [];

    private bufferedDownlinkMessages: (MailboxMessage[])[] = [];

    private bufferedUplinkMessages: (MailboxMessage[])[] = [];

    private lastClosedMessage: [MailboxMessage[], number] = null;

    private atcRingInterval: NodeJS.Timer = null;

    private closeMessage(messages: (MailboxMessage[])[], backlog: (MailboxMessage[])[], uid: number, uplink: boolean): boolean {
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
            while (backlog.length !== 0 && messages.length !== MailboxBus.MaxMailboxFileSize) {
                const bufferedBlock = backlog.shift();
                const mailboxMessages = [];
                messages.push([]);

                bufferedBlock.forEach((data) => {
                    const message = this.atc.messages().find((elem) => elem.UniqueMessageID === data.MessageId);
                    if (message !== undefined) {
                        messages[messages.length - 1].push(data);

                        // pushed a new inbound message
                        if (!data.MessageRead) {
                            this.setupIntervals();
                        }

                        if ((message as CpdlcMessage).MailboxRelevantMessage) {
                            mailboxMessages.push(message);
                        }
                    }
                });

                if (mailboxMessages.length !== 0) {
                    this.mailboxPublisher.pub('messages', mailboxMessages);
                }
            }
        }

        return idx !== -1;
    }

    constructor(atsu: Atsu, atc: Atc) {
        this.atsu = atsu;
        this.atc = atc;

        this.atsu.digitalInputs.atcMessageButtonBus.addDataCallback('onButtonPressed', () => this.cleanupNotifications());
        this.mailboxPublisher = this.mailboxBus.getPublisher<AtsuMailboxMessages>();
        this.mailboxSubscriber = this.mailboxBus.getSubscriber<AtsuMailboxMessages>();

        this.mailboxSubscriber.on('deleteMessage').handle((uid: number) => {
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

        this.mailboxSubscriber.on('uplinkResponse').handle((data: { uid: number; responseId: number }) => {
            const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === data.uid);
            if (idx > -1) {
                // iterate in reverse order to ensure that the "identification" message is the last message in the queue
                // ensures that the Mailbox-status change to SENT is done after every message is sent
                this.uplinkMessages[idx].slice().reverse().forEach((message) => {
                    this.atc.sendResponse(message.MessageId, data.responseId);
                });
            }
        });

        this.mailboxSubscriber.on('downlinkTransmit').handle((uid: number) => {
            let idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                // iterate in reverse order to ensure that the "identification" message is the last message in the queue
                // ensures that the Mailbox-status change to SENT is done after every message is sent
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

        this.mailboxSubscriber.on('modifyMessage').handle((uid: number) => {
            const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx > -1) {
                const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
                if (message !== undefined) {
                    this.atsu.modifyMailboxMessage(message as CpdlcMessage);
                }
            }
        });

        this.mailboxSubscriber.on('printMessage').handle((uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                this.mailboxPublisher.pub('systemStatus', MailboxStatusMessage.Printing);
                this.atsu.printMessage(message);
                setTimeout(() => {
                    if (this.currentMessageStatus(uid) === MailboxStatusMessage.Printing) {
                        this.mailboxPublisher.pub('systemStatus', MailboxStatusMessage.NoMessage);
                    }
                }, 4500);
            }
        });

        this.mailboxSubscriber.on('closeMessage').handle((uid: number) => {
            if (!this.closeMessage(this.uplinkMessages, this.bufferedUplinkMessages, uid, true)) {
                this.closeMessage(this.downlinkMessages, this.bufferedDownlinkMessages, uid, false);
            }
        });

        this.mailboxSubscriber.on('updateMessageMonitoring').handle((uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            UplinkMessageStateMachine.update(this.atsu, message as CpdlcMessage, true, true);
            this.update(message as CpdlcMessage);
        });

        this.mailboxSubscriber.on('stopMessageMonitoring').handle((uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            UplinkMessageStateMachine.update(this.atsu, message as CpdlcMessage, true, false);
            this.update(message as CpdlcMessage);
        });

        this.mailboxSubscriber.on('recallMessage').handle(() => {
            if (!this.lastClosedMessage) {
                this.mailboxPublisher.pub('systemStatus', MailboxStatusMessage.RecallEmpty);
            } else {
                const currentStamp = new Date().getTime();
                // timed out after five minutes
                if (currentStamp - this.lastClosedMessage[1] > 300000) {
                    this.mailboxPublisher.pub('systemStatus', MailboxStatusMessage.RecallEmpty);
                    this.lastClosedMessage = undefined;
                } else {
                    const messages : CpdlcMessage[] = [];

                    this.lastClosedMessage[0].forEach((mailboxMessage) => {
                        const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === mailboxMessage.MessageId);
                        if (msg !== undefined) {
                            messages.push(msg as CpdlcMessage);
                        }
                    });

                    messages[0].CloseAutomatically = false;
                    this.mailboxPublisher.pub('messages', messages);
                    if (this.lastClosedMessage[0][0].Direction === AtsuMessageDirection.Downlink) {
                        this.downlinkMessages.push(this.lastClosedMessage[0]);
                    } else {
                        this.uplinkMessages.push(this.lastClosedMessage[0]);
                    }
                    this.updateMessageStatus(messages[0].UniqueMessageID, MailboxStatusMessage.RecallMode);
                }
            }
        });

        this.mailboxSubscriber.on('readMessage').handle((uid: number) => {
            const idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx !== -1) {
                this.uplinkMessages[idx][0].MessageRead = true;
                this.validateNotificationCondition();
            }
        });

        this.mailboxSubscriber.on('invertSemanticResponse').handle((uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                UplinkMessageStateMachine.update(this.atsu, message as CpdlcMessage, true, false);
                this.mailboxPublisher.pub('messages', [message as CpdlcMessage]);
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

    private cleanupNotifications() {
        this.atsu.digitalOutputs.AtcMessageButtonsBus.resetButton();

        if (this.atcRingInterval) {
            clearInterval(this.atcRingInterval);
            this.atcRingInterval = null;
        }
    }

    private setupIntervals() {
        if (this.atcRingInterval) {
            clearInterval(this.atcRingInterval);
        }

        // call the first ring tone
        this.atsu.digitalOutputs.FwcBus.activateAtcRing();

        // start the ring tone interval
        this.atcRingInterval = setInterval(() => this.atsu.digitalOutputs.FwcBus.activateAtcRing(), this.estimateRingInterval());
    }

    public reset() {
        this.mailboxPublisher.pub('resetSystem', true);
    }

    public setAtcLogonMessage(message: string) {
        this.mailboxPublisher.pub('logonMessage', message);
    }

    public enqueue(messages: AtsuMessage[]) {
        if (messages.length === 0) {
            return;
        }

        const mailboxBlocks: MailboxMessage[] = [];
        messages.forEach((message) => {
            const block = new MailboxMessage();
            block.MessageId = message.UniqueMessageID;
            block.MessageRead = message.Direction === AtsuMessageDirection.Downlink;
            block.Station = message.Station;
            block.Direction = message.Direction;
            block.PriorityMessage = (message as CpdlcMessage).Content[0]?.Urgent;
            mailboxBlocks.push(block);
        });

        if (mailboxBlocks[0].Direction === AtsuMessageDirection.Downlink && this.downlinkMessages.length < MailboxBus.MaxMailboxFileSize) {
            this.downlinkMessages.push(mailboxBlocks);
        } else if (mailboxBlocks[0].Direction === AtsuMessageDirection.Uplink && this.uplinkMessages.length < MailboxBus.MaxMailboxFileSize) {
            this.uplinkMessages.push(mailboxBlocks);
            this.atsu.digitalOutputs.AtcMessageButtonsBus.activateButton();
            this.setupIntervals();
        } else {
            if (mailboxBlocks[0].Direction === AtsuMessageDirection.Downlink) {
                this.bufferedDownlinkMessages.push(mailboxBlocks);
                this.mailboxPublisher.pub('systemStatus', MailboxStatusMessage.MaximumDownlinkMessages);
                this.atsu.publishAtsuStatusCode(AtsuStatusCodes.MailboxFull);
            } else {
                this.bufferedUplinkMessages.push(mailboxBlocks);
                this.mailboxPublisher.pub('systemStatus', MailboxStatusMessage.AnswerRequired);
            }
            return;
        }

        this.mailboxPublisher.pub('messages', messages as CpdlcMessage[]);
    }

    public update(message: CpdlcMessage, insertIfNeeded: boolean = false) {
        // the assumption is that the first message in the block is the UID for the complete block

        const uplinkIdx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === message.UniqueMessageID);
        if (uplinkIdx !== -1) {
            const messages = [];

            // create all messages and overwrite the first because this is the updated
            this.uplinkMessages[uplinkIdx].forEach((mailboxMessage) => {
                const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === mailboxMessage.MessageId);
                if (msg !== undefined) {
                    if (message.UniqueMessageID !== msg.UniqueMessageID) {
                        messages.push(msg as CpdlcMessage);
                    } else {
                        messages.push(message);
                    }
                }
            });

            this.mailboxPublisher.pub('messages', messages as CpdlcMessage[]);
            return;
        }

        const downlinkIdx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === message.UniqueMessageID);
        if (downlinkIdx !== -1) {
            const messages = [];

            // create all messages and overwrite the first because this is the updated
            this.downlinkMessages[downlinkIdx].forEach((mailboxMessage) => {
                const msg = this.atc.messages().find((elem) => elem.UniqueMessageID === mailboxMessage.MessageId);
                if (message.UniqueMessageID !== msg.UniqueMessageID) {
                    messages.push(msg as CpdlcMessage);
                } else {
                    messages.push(message);
                }
            });
            messages[0] = message;

            this.mailboxPublisher.pub('messages', messages as CpdlcMessage[]);
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
            this.mailboxPublisher.pub('deleteMessage', uid);
        } else {
            idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
            if (idx !== -1) {
                this.mailboxPublisher.pub('deleteMessage', uid);
            }
        }
    }

    public updateMessageStatus(uid: number, status: MailboxStatusMessage): void {
        // the assumption is that the first message in the block is the UID for the complete block
        const uplinkIdx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (uplinkIdx !== -1) {
            this.uplinkMessages[uplinkIdx][0].Status = status;
            this.mailboxPublisher.pub('messageStatus', { uid, status });
            return;
        }

        const downlinkIdx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (downlinkIdx !== -1) {
            this.downlinkMessages[downlinkIdx][0].Status = status;
            this.mailboxPublisher.pub('messageStatus', { uid, status });
        }
    }

    public currentMessageStatus(uid: number): MailboxStatusMessage {
        let idx = this.uplinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx !== -1) {
            return this.uplinkMessages[idx][0].Status;
        }

        idx = this.downlinkMessages.findIndex((elem) => elem[0].MessageId === uid);
        if (idx !== -1) {
            return this.downlinkMessages[idx][0].Status;
        }

        return MailboxStatusMessage.NoMessage;
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
