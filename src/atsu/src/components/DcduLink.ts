//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Atc } from '../ATC';
import { Atsu } from '../ATSU';
import { AtsuMessageDirection } from '../messages/AtsuMessage';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { CpdlcMessage } from '../messages/CpdlcMessage';

class DcduMessage {
    public MessageId: number;

    public MessageRead = false;

    public EmergencyMessage = false;
}

export class DcduLink {
    private static MaxDcduFileSize = 5;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    private atsu: Atsu | undefined = undefined;

    private atc: Atc | undefined = undefined;

    private messages: DcduMessage[] = [];

    private bufferedMessages: DcduMessage[] = [];

    private atcMsgWatchdogInterval: number | undefined = undefined;

    private atcRingInterval: number | undefined = undefined;

    constructor(atsu: Atsu, atc: Atc) {
        this.atsu = atsu;
        this.atc = atc;

        Coherent.on('A32NX_ATSU_DELETE_MESSAGE', (uid: number) => {
            this.atc.removeMessage(uid);
        });

        Coherent.on('A32NX_ATSU_SEND_RESPONSE', (uid: number, response: CpdlcMessageResponse) => {
            this.atc.sendResponse(uid, response);
        });

        Coherent.on('A32NX_ATSU_SEND_MESSAGE', (uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                if (message.Direction === AtsuMessageDirection.Output) {
                    this.atc.sendMessage(message).then((code) => {
                        if (code !== AtsuStatusCodes.Ok) {
                            this.atsu.publishAtsuStatusCode(code);
                        }
                    });
                }
            }
        });

        Coherent.on('A32NX_ATSU_PRINT_MESSAGE', (uid: number) => {
            const message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                this.atsu.printMessage(message);
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_CLOSED', (uid: number) => {
            const idx = this.messages.findIndex((elem) => elem.MessageId === uid);
            if (idx !== -1) {
                this.messages.splice(idx, 1);
                this.validateNotificationCondition();

                // add buffered messages
                while (this.bufferedMessages.length !== 0 && this.messages.length !== DcduLink.MaxDcduFileSize) {
                    const data = this.bufferedMessages.shift();
                    const message = this.atc.messages().find((elem) => elem.UniqueMessageID === data.MessageId);
                    if (message !== undefined) {
                        this.messages.push(data);

                        // pushed a new inbound message
                        if (!data.MessageRead) {
                            this.setupIntervals();
                        }

                        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
                    }
                }
            }
        });

        Coherent.on('A32NX_ATSU_DCDU_MESSAGE_READ', (uid: number) => {
            const idx = this.messages.findIndex((elem) => elem.MessageId === uid);
            if (idx !== -1) {
                this.messages[idx].MessageRead = true;
                this.validateNotificationCondition();
            }
        });
    }

    private validateNotificationCondition() {
        // check if the ring tone is still needed
        let unreadMessages = false;
        this.messages.forEach((elem) => {
            if (!elem.MessageRead) {
                unreadMessages = true;
            }
        });

        if (!unreadMessages) {
            this.cleanupNotifications();
        }
    }

    private estimateRingInterval() {
        let interval = 10000;

        this.messages.forEach((elem) => {
            if (!elem.MessageRead) {
                if (elem.EmergencyMessage) {
                    interval = Math.min(interval, 5000);
                } else {
                    interval = Math.min(interval, 10000);
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

        if (this.atcMsgWatchdogInterval !== undefined) {
            clearInterval(this.atcMsgWatchdogInterval);
            this.atcMsgWatchdogInterval = undefined;
        }

        if (this.atcRingInterval !== undefined) {
            clearInterval(this.atcRingInterval);
            this.atcRingInterval = undefined;
        }
    }

    private setupIntervals() {
        if (this.atcMsgWatchdogInterval === undefined) {
            // start the watchdog to check the the ATC MSG button
            setInterval(() => {
                if (SimVar.GetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number') === 1) {
                    this.cleanupNotifications();
                }
            }, 100);
        }

        if (this.atcRingInterval !== undefined) {
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

    public enqueue(message: CpdlcMessage) {
        const block = new DcduMessage();
        block.MessageId = message.UniqueMessageID;
        block.MessageRead = message.Direction === AtsuMessageDirection.Output;

        if (this.messages.length < DcduLink.MaxDcduFileSize) {
            this.messages.push(block);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

            // reset the ring tone interval
            if (block.MessageRead === false) {
                SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_WAITING', 'boolean', 1);
                SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number', 0);
                this.setupIntervals();
            }
        } else {
            this.atsu.publishAtsuStatusCode(AtsuStatusCodes.DcduFull);
            this.bufferedMessages.push(block);
        }
    }

    public update(message: CpdlcMessage) {
        const idx = this.messages.findIndex((elem) => elem.MessageId === message.UniqueMessageID);
        if (idx !== -1) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
        }
    }

    public dequeue(uid: number) {
        const idx = this.messages.findIndex((elem) => elem.MessageId === uid);
        if (idx !== -1) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
            this.messages.splice(idx, 1);
        }
    }
}
