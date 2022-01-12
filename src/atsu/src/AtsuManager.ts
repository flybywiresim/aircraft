//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AocSystem } from './AocSystem';
import { AtsuMessage, AtsuMessageSerializationFormat } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtisMessage } from './messages/AtisMessage';
import { MetarMessage } from './messages/MetarMessage';
import { TafMessage } from './messages/TafMessage';
import { FreetextMessage } from './messages/FreetextMessage';
import { HoppieConnector } from './HoppieConnector';
import { PdcMessage } from './messages/PdcMessage';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private connector = new HoppieConnector();

    private messageCounter = 0;

    private aocSystem = new AocSystem(this.connector);

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private mcdu = undefined;

    constructor(mcdu) {
        this.mcdu = mcdu;

        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT', 'number', -1);

        setInterval(async () => {
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number') !== -1) {
                this.removeMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number'));
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', -1);
            }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number') !== -1) {
                this.sendMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number')).catch(() => {});
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);
            }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT', 'number') !== -1) {
                const message = this.findMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT', 'number'));
                if (message !== undefined) {
                    this.printMessage(message);
                }
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT', 'number', -1);
            }
        }, 500);
    }

    public registerMessage(message: AtsuMessage) {
        if (AocSystem.isDcduMessage(message) === true && SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
            return { msg: 'DCDU FILE FULL', uid: -1 };
        }

        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtsuTimestamp();

        if (AocSystem.isRelevantMessage(message)) {
            this.aocSystem.registerMessage(message);
        } else {
            return { msg: 'INVALID MSG', uid: -1 };
        }

        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
        return { msg: '', uid: message.UniqueMessageID };
    }

    public async sendMessage(uid: number) {
        if (this.aocSystem.uidRegistered(uid)) {
            return this.aocSystem.sendMessage(uid);
        }
        return Promise.reject(Error('UNKNOWN MSG'));
    }

    public removeMessage(uid: number) {
        if (this.aocSystem.removeMessage(uid) === true) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }
    }

    public receiveMessage(message: AtsuMessage) {
        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtsuTimestamp();

        if (AocSystem.isRelevantMessage(message)) {
            this.aocSystem.receiveMessage(message);
        }
    }

    public messageRead(uid: number) {
        this.aocSystem.messageRead(uid);
    }

    public setOwnCallsign(callsign: string) {
        this.connector.setCallsign(callsign);
    }

    public aoc() {
        return this.aocSystem;
    }

    public async isRemoteStationAvailable(callsign: string) {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return Promise.reject(Error('HOPPIE DISABLED'));
        }
        return this.connector.isStationAvailable(callsign);
    }

    public findMessage(uid: number) {
        const message = this.aocSystem.messages().find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            return message;
        }
        return undefined;
    }

    public printMessage(message: AtsuMessage) {
        const text = message.serialize(AtsuMessageSerializationFormat.Printer);
        this.mcdu.printPage(text.split('\n'));
    }
}

export { AtsuMessage, AtsuTimestamp, AocSystem, FreetextMessage, WeatherMessage, MetarMessage, TafMessage, AtisMessage, PdcMessage };
