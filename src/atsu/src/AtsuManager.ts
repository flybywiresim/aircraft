//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtcSystem } from './AtcSystem';
import { AocSystem } from './AocSystem';
import { AtsuMessage, AtsuMessageSerializationFormat, AtsuMessageComStatus } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { CpdlcMessage } from './messages/CpdlcMessage';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtisMessage } from './messages/AtisMessage';
import { MetarMessage } from './messages/MetarMessage';
import { NXApiConnector } from './NXApiConnector';
import { TafMessage } from './messages/TafMessage';
import { FreetextMessage } from './messages/FreetextMessage';
import { HoppieConnector } from './HoppieConnector';
import { PdcMessage } from './messages/PdcMessage';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private hoppieNetwork = new HoppieConnector(this);

    private nxapiNetwork = new NXApiConnector(this);

    private messageCounter = 0;

    private aocSystem = new AocSystem(this, this.hoppieNetwork, this.nxapiNetwork);

    private atcSystem = new AtcSystem(this, this.hoppieNetwork);

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private mcdu = undefined;

    constructor(mcdu) {
        this.mcdu = mcdu;
        SimVar.SetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number', 1);
    }

    public async sendMessage(message: AtsuMessage): Promise<string> {
        let retval = 'UNKNOWN MSG';

        if (AocSystem.isRelevantMessage(message)) {
            retval = await this.aocSystem.sendMessage(message);
            if (retval === '') {
                this.registerMessage(message);
            }
        } else if (AtcSystem.isRelevantMessage(message)) {
            retval = await this.atcSystem.sendMessage(message);
            if (retval === '') {
                this.registerMessage(message);
            }
        }

        return retval;
    }

    public removeMessage(uid: number) {
        if (this.atcSystem.removeMessage(uid) === true) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
        } else {
            this.aocSystem.removeMessage(uid);
        }
    }

    public registerMessage(message: AtsuMessage) {
        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtsuTimestamp();

        if (AocSystem.isRelevantMessage(message)) {
            this.aocSystem.insertMessage(message);
        } else if (AtcSystem.isRelevantMessage(message)) {
            if (message.ComStatus !== AtsuMessageComStatus.Sending && message.ComStatus !== AtsuMessageComStatus.Sent) {
                if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
                    this.mcdu.addNewMessage(NXSystemMessages.dcduFileFull);
                }
            }
            this.atcSystem.insertMessage(message);
        }
    }

    public messageRead(uid: number) {
        this.aocSystem.messageRead(uid);
        this.atcSystem.messageRead(uid);
    }

    public aoc(): AocSystem {
        return this.aocSystem;
    }

    public atc(): AtcSystem {
        return this.atcSystem;
    }

    public async isRemoteStationAvailable(callsign: string): Promise<string> {
        return this.hoppieNetwork.isStationAvailable(callsign);
    }

    public findMessage(uid: number): AtsuMessage {
        let message = this.aocSystem.messages().find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            return message;
        }

        message = this.atcSystem.messages().find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            return message;
        }

        return undefined;
    }

    public printMessage(message: AtsuMessage): void {
        const text = message.serialize(AtsuMessageSerializationFormat.Printer);
        this.mcdu.printPage(text.split('\n'));
    }
}

export { AtsuMessage, AtsuTimestamp, AocSystem, FreetextMessage, WeatherMessage, MetarMessage, TafMessage, AtisMessage, PdcMessage, CpdlcMessage };
