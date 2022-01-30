//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Datalink } from './com/Datalink';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { AtcSystem } from './AtcSystem';
import { AocSystem } from './AocSystem';
import { AtsuMessage, AtsuMessageSerializationFormat, AtsuMessageComStatus } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';

/**
 * Defines the ATSU manager
 */
export class AtsuManager {
    private datalink = new Datalink(this);

    private messageCounter = 0;

    public aoc = new AocSystem(this.datalink);

    public atc = new AtcSystem(this, this.datalink);

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private mcdu = undefined;

    constructor(mcdu) {
        this.mcdu = mcdu;
    }

    public static async connectToNetworks(): Promise<AtsuStatusCodes> {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        if (flightNo.length === 0 || flightNo === '1123') {
            return AtsuStatusCodes.Ok;
        }

        let retvalAoc = await AocSystem.connect();
        if (retvalAoc === AtsuStatusCodes.Ok || retvalAoc === AtsuStatusCodes.NoTelexConnection) {
            retvalAoc = AtsuStatusCodes.Ok;
        }

        let retvalAtc = await AtcSystem.connect();
        if (retvalAtc === AtsuStatusCodes.Ok || retvalAtc === AtsuStatusCodes.NoHoppieConnection) {
            retvalAtc = AtsuStatusCodes.Ok;
        }

        if (retvalAoc !== AtsuStatusCodes.Ok) {
            return retvalAoc;
        }
        return retvalAtc;
    }

    public static async disconnectFromNetworks(): Promise<AtsuStatusCodes> {
        let retvalAoc = await AocSystem.disconnect();
        if (retvalAoc === AtsuStatusCodes.Ok || retvalAoc === AtsuStatusCodes.NoTelexConnection) {
            retvalAoc = AtsuStatusCodes.Ok;
        }

        let retvalAtc = await AtcSystem.disconnect();
        if (retvalAtc === AtsuStatusCodes.Ok || retvalAtc === AtsuStatusCodes.NoHoppieConnection) {
            retvalAtc = AtsuStatusCodes.Ok;
        }

        if (retvalAoc !== AtsuStatusCodes.Ok) {
            return retvalAoc;
        }
        return retvalAtc;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.UnknownMessage;

        if (AocSystem.isRelevantMessage(message)) {
            retval = await this.aoc.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessage(message);
            }
        } else if (AtcSystem.isRelevantMessage(message)) {
            retval = await this.atc.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessage(message);
            }
        }

        return retval;
    }

    public removeMessage(uid: number): void {
        if (this.atc.removeMessage(uid) === true) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
        } else {
            this.aoc.removeMessage(uid);
        }
    }

    public registerMessage(message: AtsuMessage): void {
        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = new AtsuTimestamp();

        if (AocSystem.isRelevantMessage(message)) {
            this.aoc.insertMessage(message);
        } else if (AtcSystem.isRelevantMessage(message)) {
            if (message.ComStatus !== AtsuMessageComStatus.Sending && message.ComStatus !== AtsuMessageComStatus.Sent) {
                if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 1) {
                    this.mcdu.addNewAtsuMessage(AtsuStatusCodes.DcduFull);
                }
            }
            this.atc.insertMessage(message);
        }
    }

    public messageRead(uid: number): void {
        this.aoc.messageRead(uid);
        this.atc.messageRead(uid);
    }

    public async isRemoteStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return this.datalink.isStationAvailable(callsign);
    }

    public findMessage(uid: number): AtsuMessage {
        let message = this.aoc.messages().find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            return message;
        }

        message = this.atc.messages().find((element) => element.UniqueMessageID === uid);
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
