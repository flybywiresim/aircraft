//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Datalink } from './com/Datalink';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { AtcSystem } from './AtcSystem';
import { AocSystem } from './AocSystem';
import { AtsuMessage, AtsuMessageSerializationFormat, AtsuMessageComStatus } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { CpdlcMessage } from './messages/CpdlcMessage';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtisMessage } from './messages/AtisMessage';
import { MetarMessage } from './messages/MetarMessage';
import { TafMessage } from './messages/TafMessage';
import { FreetextMessage } from './messages/FreetextMessage';
import { PdcMessage } from './messages/PdcMessage';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private datalink = new Datalink(this);

    private messageCounter = 0;

    private aocSystem = new AocSystem(this.datalink);

    private atcSystem = new AtcSystem(this, this.datalink);

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private mcdu = undefined;

    constructor(mcdu) {
        this.mcdu = mcdu;
        SimVar.SetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number', 1);
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.UnknownMessage;

        if (AocSystem.isRelevantMessage(message)) {
            retval = await this.aocSystem.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessage(message);
            }
        } else if (AtcSystem.isRelevantMessage(message)) {
            retval = await this.atcSystem.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessage(message);
            }
        }

        return retval;
    }

    public removeMessage(uid: number): void {
        if (this.atcSystem.removeMessage(uid) === true) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
        } else {
            this.aocSystem.removeMessage(uid);
        }
    }

    public registerMessage(message: AtsuMessage): void {
        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtsuTimestamp();

        if (AocSystem.isRelevantMessage(message)) {
            this.aocSystem.insertMessage(message);
        } else if (AtcSystem.isRelevantMessage(message)) {
            if (message.ComStatus !== AtsuMessageComStatus.Sending && message.ComStatus !== AtsuMessageComStatus.Sent) {
                if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
                    this.mcdu.updateAtsuStatusCode(AtsuStatusCodes.DcduFull);
                    // this.mcdu.addNewMessage(NXSystemMessages.dcduFileFull);
                }
            }
            this.atcSystem.insertMessage(message);
        }
    }

    public messageRead(uid: number): void {
        this.aocSystem.messageRead(uid);
        this.atcSystem.messageRead(uid);
    }

    public aoc(): AocSystem {
        return this.aocSystem;
    }

    public atc(): AtcSystem {
        return this.atcSystem;
    }

    public async isRemoteStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return this.datalink.isStationAvailable(callsign);
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
