//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtcMessage, AtcMessageComStatus } from './AtcMessage';
import { AtcTimestamp } from './AtcTimestamp';
import { HoppieConnector } from './HoppieConnector';
import { PreDepartureClearance } from './PreDepartureClearance';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private connector = new HoppieConnector();

    private station = '';

    private messageCounter = 0;

    private aocMessageQueue : AtcMessage[] = [];

    private atcMessageQueue : AtcMessage[] = [];

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    constructor() {
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);

        setInterval(() => {
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number') !== -1) {
                this.removeMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number'));
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', -1);
            }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number') !== -1) {
                this.sendMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number'));
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);
            }
        }, 500);
    }

    public registerPdcMessage(message: PreDepartureClearance) {
        if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
            return 'DCDU FILE FULL';
        }

        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtcTimestamp();
        this.aocMessageQueue.unshift(message);
        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

        return '';
    }

    private sendMessage(uid: number) {
        let index = this.atcMessageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.atcMessageQueue[index].ComStatus = AtcMessageComStatus.Sending;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.atcMessageQueue[index]);
            return;
        }

        index = this.aocMessageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.aocMessageQueue[index].ComStatus = AtcMessageComStatus.Sending;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.aocMessageQueue[index]);
        }
    }

    private removeMessage(uid: number) {
        let index = this.atcMessageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.atcMessageQueue.splice(index, 1);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }

        index = this.aocMessageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.aocMessageQueue.splice(index, 1);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }
    }

    public atcMessages() {
        return this.atcMessageQueue;
    }

    public aocMessages() {
        return this.aocMessageQueue;
    }

    public getConnector() {
        return this.connector;
    }
}

export { PreDepartureClearance, AtcMessage, AtcTimestamp };
