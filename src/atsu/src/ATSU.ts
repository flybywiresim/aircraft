//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Datalink } from './com/Datalink';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { Atc } from './ATC';
import { Aoc } from './AOC';
import { AtsuMessage, AtsuMessageSerializationFormat } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';

/**
 * Defines the ATSU
 */
export class Atsu {
    private datalink = new Datalink(this);

    private fltNo: string = '';

    private messageCounter = 0;

    public aoc = new Aoc(this.datalink);

    public atc = new Atc(this, this.datalink);

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    private mcdu = undefined;

    constructor(mcdu) {
        this.mcdu = mcdu;
    }

    public async connectToNetworks(flightNo: string): Promise<AtsuStatusCodes> {
        if (flightNo.length === 0) {
            return AtsuStatusCodes.Ok;
        }

        let retvalAoc = await Aoc.connect(flightNo);
        if (retvalAoc === AtsuStatusCodes.Ok || retvalAoc === AtsuStatusCodes.TelexDisabled) {
            retvalAoc = AtsuStatusCodes.Ok;
        }

        let retvalAtc = AtsuStatusCodes.Ok;
        if (retvalAoc === AtsuStatusCodes.Ok) {
            retvalAtc = await this.atc.connect(flightNo);
            if (retvalAtc === AtsuStatusCodes.Ok || retvalAtc === AtsuStatusCodes.NoHoppieConnection) {
                retvalAtc = AtsuStatusCodes.Ok;
            } else {
                Aoc.disconnect();
            }
        }

        if (retvalAoc === AtsuStatusCodes.Ok && retvalAtc === AtsuStatusCodes.Ok) {
            console.log(`ATSU: Callsign switch from ${this.fltNo} to ${flightNo}`);
            this.fltNo = flightNo;
        }

        if (retvalAoc !== AtsuStatusCodes.Ok) {
            return retvalAoc;
        }
        return retvalAtc;
    }

    public async disconnectFromNetworks(): Promise<AtsuStatusCodes> {
        let retvalAoc = await Aoc.disconnect();
        if (retvalAoc === AtsuStatusCodes.Ok || retvalAoc === AtsuStatusCodes.NoTelexConnection) {
            retvalAoc = AtsuStatusCodes.Ok;
        }

        let retvalAtc = await this.atc.disconnect();
        if (retvalAtc === AtsuStatusCodes.Ok || retvalAtc === AtsuStatusCodes.NoHoppieConnection) {
            retvalAtc = AtsuStatusCodes.Ok;
        }

        if (retvalAoc === AtsuStatusCodes.Ok && retvalAtc === AtsuStatusCodes.Ok) {
            console.log('ATSU: Reset of callsign');
            this.fltNo = '';
        }

        if (retvalAoc !== AtsuStatusCodes.Ok) {
            return retvalAoc;
        }
        return retvalAtc;
    }

    public flightNumber(): string {
        return this.fltNo;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.UnknownMessage;

        if (Aoc.isRelevantMessage(message)) {
            retval = await this.aoc.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessage(message);
            }
        } else if (Atc.isRelevantMessage(message)) {
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

        if (Aoc.isRelevantMessage(message)) {
            this.aoc.insertMessage(message);
        } else if (Atc.isRelevantMessage(message)) {
            this.atc.insertMessage(message);
        }
    }

    public messageRead(uid: number): void {
        this.aoc.messageRead(uid);
        this.atc.messageRead(uid);
    }

    public publishAtsuStatusCode(code: AtsuStatusCodes): void {
        this.mcdu.addNewAtsuMessage(code);
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
