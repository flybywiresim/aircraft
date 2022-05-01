//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { Datalink } from './com/Datalink';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { Atc } from './ATC';
import { Aoc } from './AOC';
import { AtsuMessage, AtsuMessageSerializationFormat } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { FlightStateObserver } from './components/FlightStateObserver';

/**
 * Defines the ATSU
 */
export class Atsu {
    private flightStateObserver: FlightStateObserver = undefined;

    private datalink = new Datalink(this);

    private fltNo: string = '';

    private messageCounter = 0;

    public aoc = new Aoc(this.datalink);

    public atc = new Atc(this, this.datalink);

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    private mcdu = undefined;

    constructor(mcdu) {
        this.flightStateObserver = new FlightStateObserver(mcdu);
        this.mcdu = mcdu;
    }

    public async connectToNetworks(flightNo: string): Promise<AtsuStatusCodes> {
        await this.disconnectFromNetworks();

        if (flightNo.length === 0) {
            return AtsuStatusCodes.Ok;
        }

        const code = await Datalink.connect(flightNo);
        if (code === AtsuStatusCodes.Ok) {
            console.log(`ATSU: Callsign switch from ${this.fltNo} to ${flightNo}`);
            this.fltNo = flightNo;
        }

        return code;
    }

    public flightPhase(): FmgcFlightPhase {
        if (this.mcdu !== undefined && this.mcdu.flightPhaseManager) {
            return this.mcdu.flightPhaseManager.phase;
        }
        return FmgcFlightPhase.Preflight;
    }

    public async disconnectFromNetworks(): Promise<AtsuStatusCodes> {
        await this.atc.disconnect();

        console.log('ATSU: Reset of callsign');
        this.fltNo = '';

        return Datalink.disconnect();
    }

    public flightNumber(): string {
        return this.fltNo;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.UnknownMessage;

        if (Aoc.isRelevantMessage(message)) {
            retval = await this.aoc.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessages([message]);
            }
        } else if (Atc.isRelevantMessage(message)) {
            retval = await this.atc.sendMessage(message);
            if (retval === AtsuStatusCodes.Ok) {
                this.registerMessages([message]);
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

    public registerMessages(messages: AtsuMessage[]): void {
        if (messages.length === 0) return;

        messages.forEach((message) => {
            message.UniqueMessageID = ++this.messageCounter;
            message.Timestamp = new AtsuTimestamp();
        });

        if (Aoc.isRelevantMessage(messages[0])) {
            this.aoc.insertMessages(messages);
        } else if (Atc.isRelevantMessage(messages[0])) {
            this.atc.insertMessages(messages);
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

    public lastWaypoint() {
        return this.flightStateObserver.LastWaypoint;
    }

    public activeWaypoint() {
        return this.flightStateObserver.ActiveWaypoint;
    }

    public nextWaypoint() {
        return this.flightStateObserver.NextWaypoint;
    }

    public destinationWaypoint() {
        return this.flightStateObserver.Destination;
    }

    public currentFlightState() {
        return this.flightStateObserver.PresentPosition;
    }

    public targetFlightState() {
        return this.flightStateObserver.FcuSettings;
    }
}
