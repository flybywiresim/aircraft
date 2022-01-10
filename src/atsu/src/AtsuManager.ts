//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AocSystem } from './AocSystem';
import { AtsuMessage } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
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

    constructor() {
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);

        setInterval(async () => {
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number') !== -1) {
                this.removeMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number'));
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE', 'number', -1);
            }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number') !== -1) {
                this.sendMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number')).catch(() => {});
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);
            }
        }, 500);
    }

    public registerMessage(message: AtsuMessage) {
        if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
            return 'DCDU FILE FULL';
        }

        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtsuTimestamp();

        if (AocSystem.isRelevantMessage(message)) {
            this.aocSystem.registerMessage(message);
        } else {
            return 'INVALID MSG';
        }

        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
        return '';
    }

    public async sendMessage(uid: number) {
        const message = this.aocSystem.sendMessage(uid);
        if (message !== undefined) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
        }
    }

    private removeMessage(uid: number) {
        if (this.aocSystem.removeMessage(uid) === true) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }
    }

    public setOwnCallsign(callsign: string) {
        this.connector.setCallsign(callsign);
    }

    public async isRemoteStationAvailable(callsign: string) {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
            return Promise.reject(Error('HOPPIE DISABLED'));
        }
        return this.connector.isStationAvailable(callsign);
    }
}

export { AtsuMessage, AtsuTimestamp, AocSystem, FreetextMessage, PdcMessage };
