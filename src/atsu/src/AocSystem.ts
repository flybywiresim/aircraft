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

    private messageSendQueue : number[] = [];

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

    public sendMessage(uid: number): AtsuMessage {
        let message : AtsuMessage = undefined;

        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sending;
            this.messageSendQueue.push(this.messageQueue[index].UniqueMessageID);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
            message = this.messageQueue[index];
        }

        return message;
    }

    public removeMessage(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue.splice(index, 1);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }
        return index !== -1;
    }

    public publishOutputMessages() {
        this.messageSendQueue.forEach((uid) => {
            const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
            if (message !== undefined) {
                this.connector.sendTelexMessage(message).then(() => {
                    const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
                    if (index !== -1) {
                        this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sent;
                        if (AocSystem.isDcduMessage(this.messageQueue[index]) === true) {
                            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
                        }
                    }
                }).catch(() => {
                    const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
                    if (index !== -1) {
                        this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
                        if (AocSystem.isDcduMessage(this.messageQueue[index]) === true) {
                            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
                        }
                    }
                });
            }
        });

        this.messageSendQueue = [];
    }

    public messages() {
        return this.messageQueue;
    }

    public setOwnCallsign(callsign: string) {
        this.connector.setCallsign(callsign);
    }

    public async isRemoteStationAvailable(callsign: string) {
        return this.connector.isStationAvailable(callsign);
    }
}

export { AtsuMessage };
