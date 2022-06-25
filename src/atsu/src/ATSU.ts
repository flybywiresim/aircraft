//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { CpdlcMessage } from './messages/CpdlcMessage';
import { Datalink } from './com/Datalink';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { Atc } from './ATC';
import { Aoc } from './AOC';
import { AtsuMessage, AtsuMessageSerializationFormat } from './messages/AtsuMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { FlightStateObserver } from './components/FlightStateObserver';
import { CpdlcMessagesDownlink } from './messages/CpdlcMessageElements';
import { coordinateToString, timestampToString } from './Common';
import { InputValidation } from './InputValidation';
import { ATS623 } from './components/ATS623';

/**
 * Defines the ATSU
 */
export class Atsu {
    private flightStateObserver: FlightStateObserver = null;

    private datalink = new Datalink(this);

    private fltNo: string = '';

    private messageCounter = 0;

    private ats623 = new ATS623(this);

    public aoc = new Aoc(this.datalink);

    public atc = new Atc(this, this.datalink);

    public modificationMessage: CpdlcMessage = null;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    private mcdu = undefined;

    public static createAutomatedPositionReport(atsu: Atsu): CpdlcMessage {
        const message = new CpdlcMessage();
        message.Station = atsu.atc.currentStation();
        message.Content.push(CpdlcMessagesDownlink.DM48[1].deepCopy());

        let targetAltitude: string = '';
        let passedAltitude: string = '';
        let currentAltitude: string = '';
        if (Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === 'STD') {
            if (atsu.flightStateObserver.LastWaypoint) {
                passedAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(atsu.flightStateObserver.LastWaypoint.altitude / 100)}`);
            } else {
                passedAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(atsu.flightStateObserver.PresentPosition.altitude / 100)}`);
            }
            currentAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(atsu.flightStateObserver.PresentPosition.altitude / 100)}`);
            if (atsu.flightStateObserver.FcuSettings.altitude) {
                targetAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(atsu.flightStateObserver.FcuSettings.altitude / 100)}`);
            } else {
                targetAltitude = currentAltitude;
            }
        } else {
            if (atsu.flightStateObserver.LastWaypoint) {
                passedAltitude = InputValidation.formatScratchpadAltitude(atsu.flightStateObserver.LastWaypoint.altitude.toString());
            } else {
                passedAltitude = InputValidation.formatScratchpadAltitude(atsu.flightStateObserver.PresentPosition.altitude.toString());
            }
            currentAltitude = InputValidation.formatScratchpadAltitude(atsu.flightStateObserver.PresentPosition.altitude.toString());
            if (atsu.flightStateObserver.FcuSettings.altitude) {
                targetAltitude = InputValidation.formatScratchpadAltitude(atsu.flightStateObserver.FcuSettings.altitude.toString());
            } else {
                targetAltitude = currentAltitude;
            }
        }

        let extension = null;
        if (atsu.flightStateObserver.LastWaypoint) {
            // define the overhead
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `OVHD:${atsu.flightStateObserver.LastWaypoint.ident}`;
            message.Content.push(extension);
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `AT ${timestampToString(atsu.flightStateObserver.LastWaypoint.utc)}Z/${passedAltitude}`;
            message.Content.push(extension);
        }

        // define the present position
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `PPOS:${coordinateToString({ lat: atsu.flightStateObserver.PresentPosition.lat, lon: atsu.flightStateObserver.PresentPosition.lon }, false)}`;
        message.Content.push(extension);
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `AT ${timestampToString(SimVar.GetSimVarValue('E:ZULU TIME', 'seconds'))}Z/${currentAltitude}`;
        message.Content.push(extension);

        if (atsu.flightStateObserver.ActiveWaypoint) {
        // define the active position
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `NEXT:${atsu.flightStateObserver.ActiveWaypoint.ident}`;
            message.Content.push(extension);
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `AT ${timestampToString(atsu.flightStateObserver.ActiveWaypoint.utc)}Z`;
            message.Content.push(extension);
        }

        if (atsu.flightStateObserver.NextWaypoint) {
        // define the next position
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `ENSUING:${atsu.flightStateObserver.NextWaypoint.ident}`;
            message.Content.push(extension);
        }

        if (atsu.destinationWaypoint()) {
        // define ETA
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `DEST ETA:${timestampToString(atsu.destinationWaypoint().utc)}Z`;
            message.Content.push(extension);
        }

        // TODO define deviating

        // define descending/climbing and VS
        if (Math.abs(atsu.flightStateObserver.FcuSettings.altitude - atsu.flightStateObserver.PresentPosition.altitude) >= 500) {
            if (atsu.flightStateObserver.FcuSettings.altitude > atsu.flightStateObserver.PresentPosition.altitude) {
                extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
                extension.Content[0].Value = `CLIMBING TO ${targetAltitude}`;
                message.Content.push(extension);
            } else {
                extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
                extension.Content[0].Value = `DESCENDING TO ${targetAltitude}`;
                message.Content.push(extension);
            }

            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `VS:${InputValidation.formatScratchpadVerticalSpeed(`${atsu.flightStateObserver.PresentPosition.verticalSpeed}FTM`)}`;
            message.Content.push(extension);
        }

        // define speed
        const ias = InputValidation.formatScratchpadSpeed(atsu.flightStateObserver.PresentPosition.indicatedAirspeed.toString());
        const gs = InputValidation.formatScratchpadSpeed(atsu.flightStateObserver.PresentPosition.groundSpeed.toString());
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `SPD: ${ias} GS: ${gs}`;
        message.Content.push(extension);

        return message;
    }

    private static waypointPassedCallback(atsu: Atsu): void {
        if (atsu.atc.automaticPositionReportActive() && atsu.atc.currentStation() !== '' && atsu.flightStateObserver.LastWaypoint
        && atsu.flightStateObserver.ActiveWaypoint && atsu.flightStateObserver.NextWaypoint) {
            const message = Atsu.createAutomatedPositionReport(atsu);

            // skip the DCDU
            message.DcduRelevantMessage = false;

            atsu.sendMessage(message);
        }
    }

    constructor(mcdu) {
        this.flightStateObserver = new FlightStateObserver(mcdu, Atsu.waypointPassedCallback);
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

        if (this.ats623.isRelevantMessage(messages[0])) {
            this.ats623.insertMessages(messages);
        } else if (Aoc.isRelevantMessage(messages[0])) {
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

    public modifyDcduMessage(message: CpdlcMessage): void {
        this.modificationMessage = message;
        this.mcdu.tryToShowAtcModifyPage();
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
