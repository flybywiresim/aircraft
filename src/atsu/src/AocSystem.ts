//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessage, AtsuMessageComStatus, AtsuMessageType } from './messages/AtsuMessage';
import { HoppieConnector } from './HoppieConnector';

/**
 * Defines the AOC manager
 */
export class AocSystem {
    private connector : HoppieConnector = undefined;

    private messageQueue : AtsuMessage[] = [];

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    constructor(connector: HoppieConnector) {
        this.connector = connector;
    }

    public static isRelevantMessage(message: AtsuMessage) {
        return message.Type === AtsuMessageType.Freetext || message.Type === AtsuMessageType.PDC;
    }

    public static isDcduMessage(message: AtsuMessage) {
        return message.Type === AtsuMessageType.PDC;
    }

    public registerMessage(message: AtsuMessage) {
        this.messageQueue.unshift(message);
    }

    private async sendFbwTelexMessage(index: number) {
        const content = this.messageQueue[index].Lines.join(';');
        NXApi.sendTelexMessage(this.messageQueue[index].Station, content).then(() => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sent;
            return Promise.resolve();
        }).catch(() => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
            return Promise.reject(Error('COM UNAVAILABLE'));
        });
    }

    private async sendHoppieTelexMessage(index: number) {
        this.connector.sendTelexMessage(this.messageQueue[index]).then(() => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sent;
            if (this.messageQueue[index].Type === AtsuMessageType.PDC) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
            }
            return Promise.resolve();
        }).catch((err) => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
            return Promise.reject(Error(err.message));
        });
    }

    private async sendTelexMessage(index: number) {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return this.sendHoppieTelexMessage(index);
        }
        if (NXApi.hasTelexConnection() === true && NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') === 'ENABLED') {
            return this.sendFbwTelexMessage(index);
        }
        this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
        return Promise.reject(Error('COM UNAVAILABLE'));
    }

    private async sendPdcMessage(index: number) {
        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return this.sendHoppieTelexMessage(index);
        }
        this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
        return Promise.reject(Error('COM UNAVAILABLE'));
    }

    public async sendMessage(uid: number) {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sending;
            if (this.messageQueue[index].Type === AtsuMessageType.Freetext) {
                return this.sendTelexMessage(index);
            }
            if (this.messageQueue[index].Type === AtsuMessageType.PDC) {
                return this.sendPdcMessage(index);
            }
        }
        return Promise.reject(Error('INVALID MSG'));
    }

    public removeMessage(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue.splice(index, 1);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }
        return index !== -1;
    }

    public messages() {
        return this.messageQueue;
    }

    public uidRegistered(uid: number) {
        return this.messageQueue.findIndex((element) => uid === element.UniqueMessageID) !== -1;
    }

    public setOwnCallsign(callsign: string) {
        this.connector.setCallsign(callsign);
    }
}

export { AtsuMessage };
