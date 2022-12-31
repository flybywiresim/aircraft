//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import { CpdlcMessage } from '@atsu/common/messages/CpdlcMessage';
import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import { AtsuMessage, AtsuMessageSerializationFormat } from '@atsu/common/messages/AtsuMessage';
import { CpdlcMessagesDownlink } from '@atsu/common/messages/CpdlcMessageElements';
import { coordinateToString, timestampToString } from '@atsu/common/components/Convert';
import { InputValidation } from '@atsu/common/components/InputValidation';
import { EventBus } from 'msfssdk';
import { Aoc } from './AOC';
import { Atc } from './ATC';
import { Datalink } from './com/Datalink';
import { ATS623 } from './components/ATS623';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';

/**
 * Defines the ATSU
 */
export class Atsu {
    private datalink = new Datalink(this);

    private fltNo: string = '';

    private messageCounter = 0;

    private eventBus = new EventBus();

    public digitalInputs = new DigitalInputs(this.eventBus);

    public digitalOutputs = new DigitalOutputs(this.eventBus);

    private ats623 = new ATS623(this);

    public aoc = new Aoc(this.datalink, this.digitalOutputs);

    public atc = new Atc(this, this.datalink);

    public modificationMessage: CpdlcMessage = null;

    private mcdu = undefined;

    public createAutomatedPositionReport(): CpdlcMessage {
        const message = new CpdlcMessage();
        message.Station = this.atc.currentStation();
        message.Content.push(CpdlcMessagesDownlink.DM48[1].deepCopy());

        let targetAltitude: string = '';
        let passedAltitude: string = '';
        let currentAltitude: string = '';
        if (Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === 'STD') {
            if (this.digitalInputs.FlightRoute.lastWaypoint) {
                passedAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(this.digitalInputs.FlightRoute.lastWaypoint.altitude / 100)}`);
            } else {
                passedAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(this.digitalInputs.PresentPosition.altitude.value / 100)}`);
            }
            currentAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(this.digitalInputs.PresentPosition.altitude.value / 100)}`);

            if (this.digitalInputs.AutopilotData.active.isNormalOperation() && this.digitalInputs.AutopilotData.active.value !== 0) {
                if (this.digitalInputs.AutopilotData.selectedAltitude !== this.digitalInputs.PresentPosition.altitude.value) {
                    targetAltitude = InputValidation.formatScratchpadAltitude(`FL${Math.round(this.digitalInputs.AutopilotData.selectedAltitude / 100)}`);
                } else {
                    targetAltitude = currentAltitude;
                }
            }
        } else {
            if (this.digitalInputs.FlightRoute.lastWaypoint) {
                passedAltitude = InputValidation.formatScratchpadAltitude(this.digitalInputs.FlightRoute.lastWaypoint.altitude.toString());
            } else {
                passedAltitude = InputValidation.formatScratchpadAltitude(this.digitalInputs.PresentPosition.altitude.value.toString());
            }
            currentAltitude = InputValidation.formatScratchpadAltitude(this.digitalInputs.PresentPosition.altitude.value.toString());

            if (this.digitalInputs.AutopilotData.active.isNormalOperation() && this.digitalInputs.AutopilotData.active.value !== 0) {
                if (this.digitalInputs.AutopilotData.selectedAltitude) {
                    targetAltitude = InputValidation.formatScratchpadAltitude(this.digitalInputs.AutopilotData.selectedAltitude.toString());
                } else {
                    targetAltitude = currentAltitude;
                }
            }
        }

        let extension = null;
        if (this.digitalInputs.FlightRoute.lastWaypoint) {
            // define the overhead
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `OVHD: ${this.digitalInputs.FlightRoute.lastWaypoint.ident}`;
            message.Content.push(extension);
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `AT ${timestampToString(this.digitalInputs.FlightRoute.lastWaypoint.utc)}Z/${passedAltitude}`;
            message.Content.push(extension);
        }

        // define the present position
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `PPOS: ${coordinateToString({ lat: this.digitalInputs.PresentPosition.latitude.value, lon: this.digitalInputs.PresentPosition.longitude.value }, false)}`;
        message.Content.push(extension);
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `AT ${timestampToString(this.digitalInputs.UtcClock.secondsOfDay)}Z/${currentAltitude}`;
        message.Content.push(extension);

        if (this.digitalInputs.FlightRoute.activeWaypoint) {
            // define the active position
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `TO: ${this.digitalInputs.FlightRoute.activeWaypoint.ident} AT ${timestampToString(this.digitalInputs.FlightRoute.activeWaypoint.utc)}Z`;
            message.Content.push(extension);
        }

        if (this.digitalInputs.FlightRoute.nextWaypoint) {
            // define the next position
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `NEXT: ${this.digitalInputs.FlightRoute.nextWaypoint.ident}`;
            message.Content.push(extension);
        }

        // define wind and SAT
        if (this.digitalInputs.MeteoData.windDirection.isNormalOperation()
            && this.digitalInputs.MeteoData.windSpeed.isNormalOperation()
            && this.digitalInputs.MeteoData.staticAirTemperature.isNormalOperation()
        ) {
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            const windInput = `${this.digitalInputs.MeteoData.windDirection.value}/${this.digitalInputs.MeteoData.windSpeed.value}KT`;
            extension.Content[0].Value = `WIND: ${InputValidation.formatScratchpadWind(windInput)}`;
            extension.Content[0].Value = `${extension.Content[0].Value} SAT: ${this.digitalInputs.MeteoData.staticAirTemperature.value}C`;
            message.Content.push(extension);
        }

        if (this.digitalInputs.FlightRoute.destination) {
            // define ETA
            extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
            extension.Content[0].Value = `DEST ETA: ${timestampToString(this.digitalInputs.FlightRoute.destination.utc)}Z`;
            message.Content.push(extension);
        }

        // define descending/climbing and VS
        if (this.digitalInputs.AutopilotData.active.isNormalOperation() && this.digitalInputs.AutopilotData.active.value !== 0) {
            if (Math.abs(this.digitalInputs.AutopilotData.selectedAltitude - this.digitalInputs.PresentPosition.altitude.value) >= 500) {
                if (this.digitalInputs.AutopilotData.selectedAltitude > this.digitalInputs.PresentPosition.altitude.value) {
                    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
                    extension.Content[0].Value = `CLIMBING TO: ${targetAltitude}`;
                    message.Content.push(extension);
                } else {
                    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
                    extension.Content[0].Value = `DESCENDING TO: ${targetAltitude}`;
                    message.Content.push(extension);
                }

                extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
                extension.Content[0].Value = `VS: ${InputValidation.formatScratchpadVerticalSpeed(`${this.digitalInputs.PresentDynamics.verticalSpeed.value}FTM`)}`;
                message.Content.push(extension);
            }
        }

        // define speed
        const ias = InputValidation.formatScratchpadSpeed(this.digitalInputs.PresentDynamics.computedAirspeed.value.toString());
        const gs = InputValidation.formatScratchpadSpeed(this.digitalInputs.PresentDynamics.groundSpeed.value.toString());
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `SPD: ${ias} GS: ${gs}`;
        message.Content.push(extension);

        // define HDG
        const hdg = this.digitalInputs.PresentPosition.heading.value.toString();
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `HDG: ${hdg}°TRUE`;
        message.Content.push(extension);

        // define track
        const trk = this.digitalInputs.PresentPosition.track.value.toString();
        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `TRK: ${trk}°`;
        message.Content.push(extension);

        // TODO define deviating

        return message;
    }

    // TODO after a new last is received
    private waypointPassedCallback(): void {
        if (this.atc.automaticPositionReportActive() && this.atc.currentStation() !== '' && this.digitalInputs.FlightRoute.lastWaypoint
            && this.digitalInputs.FlightRoute.activeWaypoint && this.digitalInputs.FlightRoute.nextWaypoint
        ) {
            const message = this.createAutomatedPositionReport();

            // skip the Mailbox
            message.MailboxRelevantMessage = false;

            this.sendMessage(message);
        }
    }

    constructor(mcdu) {
        this.digitalInputs.addDataCallback('onRouteData', () => this.waypointPassedCallback);

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

    private timestampMessage(message:AtsuMessage): void {
        message.Timestamp.Year = this.digitalInputs.UtcClock.year;
        message.Timestamp.Month = this.digitalInputs.UtcClock.month;
        message.Timestamp.Day = this.digitalInputs.UtcClock.dayOfMonth;
        message.Timestamp.Seconds = this.digitalInputs.UtcClock.secondsOfDay;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.UnknownMessage;

        this.timestampMessage(message);

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
            this.atc.mailboxBus.dequeue(uid);
        } else {
            this.aoc.removeMessage(uid);
        }
    }

    public registerMessages(messages: AtsuMessage[]): void {
        if (messages.length === 0) return;

        messages.forEach((message) => {
            message.UniqueMessageID = ++this.messageCounter;
            this.timestampMessage(message);
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

    public modifyMailboxMessage(message: CpdlcMessage): void {
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
}
