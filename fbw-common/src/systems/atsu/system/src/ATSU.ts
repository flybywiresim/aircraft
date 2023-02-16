//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FmgcFlightPhase } from '@shared/flightphase';
import {
    CpdlcMessage,
    AtsuStatusCodes,
    AtsuMessage,
    CpdlcMessagesDownlink,
    coordinateToString,
    timestampToString,
    InputValidation,
    FmsRouteData,
    PositionReportData,
    AtsuTimestamp,
} from '@atsu/common';
import { DatalinkInputBus, DatalinkOutputBus } from '@atsu/communication';
import { EventBus } from 'msfssdk';
import { Aoc } from './AOC';
import { Atc } from './ATC';
import { ATS623 } from './components/ATS623';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';

/**
 * Defines the ATSU
 */
export class Atsu {
    public datalink: DatalinkInputBus = null;

    private datalinkOutputBus: DatalinkOutputBus = null;

    private poweredUp: boolean = false;

    private fltNo: string = '';

    private messageCounter = 0;

    public digitalInputs: DigitalInputs = null;

    public digitalOutputs: DigitalOutputs = null;

    private ats623: ATS623 = null;

    public aoc: Aoc = null;

    public atc: Atc = null;

    destinationWaypoint(): any {
        if (this.digitalInputs.FlightRoute && this.digitalInputs.FlightRoute.destination) {
            return this.digitalInputs.FlightRoute.destination;
        } else {
            return {};
        }
    }

    public powerUp(): void {
        this.digitalOutputs.FmsBus.powerUp();
        this.aoc.powerUp();
        this.atc.powerUp();
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.digitalOutputs.FwcBus.setCompanyMessageCount(0);
        this.digitalOutputs.FmsBus.powerDown();
        this.aoc.powerDown();
        this.atc.powerDown();
        this.poweredUp = false;
    }

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

    private newRouteReceived(route: FmsRouteData): void {
        const lastWaypoint = this.digitalInputs.FlightRoute.lastWaypoint;
        const passedWaypoint = route.lastWaypoint !== null && (lastWaypoint === null || lastWaypoint.ident !== route.lastWaypoint.ident);

        if (this.atc.automaticPositionReportActive() && this.atc.currentStation() !== '' && passedWaypoint) {
            const message = this.createAutomatedPositionReport();

            // skip the Mailbox
            message.MailboxRelevantMessage = false;

            this.sendMessage(message);
        }
    }

    private createPositionReportData(): PositionReportData {
        const machMode = this.digitalInputs.AutopilotData.machMode;

        return {
            flightState: {
                lat: this.digitalInputs.PresentPosition.latitude.value,
                lon: this.digitalInputs.PresentPosition.longitude.value,
                altitude: Math.round(this.digitalInputs.PresentPosition.altitude.value),
                heading: Math.round(this.digitalInputs.PresentPosition.heading.value),
                track: Math.round(this.digitalInputs.PresentPosition.track.value),
                indicatedAirspeed: machMode ? this.digitalInputs.PresentDynamics.mach.value : Math.round(this.digitalInputs.PresentDynamics.computedAirspeed.value),
                groundSpeed: Math.round(this.digitalInputs.PresentDynamics.groundSpeed.value),
                verticalSpeed: Math.round(this.digitalInputs.PresentDynamics.verticalSpeed.value),
            },
            autopilot: {
                apActive: this.digitalInputs.AutopilotData.active.value !== 0,
                speed: machMode ? this.digitalInputs.AutopilotData.selectedMach.value : this.digitalInputs.AutopilotData.selectedSpeed.value,
                machMode,
                altitude: this.digitalInputs.AutopilotData.selectedAltitude,
            },
            environment: {
                windDirection: this.digitalInputs.MeteoData.windDirection.value,
                windSpeed: this.digitalInputs.MeteoData.windSpeed.value,
                temperature: this.digitalInputs.MeteoData.staticAirTemperature.value,
            },
            lastWaypoint: this.digitalInputs.FlightRoute.lastWaypoint,
            activeWaypoint: this.digitalInputs.FlightRoute.activeWaypoint,
            nextWaypoint: this.digitalInputs.FlightRoute.nextWaypoint,
            destination: this.digitalInputs.FlightRoute.destination,
        };
    }

    constructor(bus: EventBus, digitalInputs: DigitalInputs, digitalOutputs: DigitalOutputs) {
        this.digitalInputs = digitalInputs;
        this.digitalOutputs = digitalOutputs;

        this.datalink = new DatalinkInputBus(bus, false);
        this.datalinkOutputBus = new DatalinkOutputBus(bus);
        this.ats623 = new ATS623(this);
        this.aoc = new Aoc(this);
        this.atc = new Atc(bus, this);

        // register all input callbacks
        this.digitalInputs.fmsBus.addDataCallback('routeData', (route) => this.newRouteReceived(route));
        this.digitalInputs.fmsBus.addDataCallback('sendMessage', (message) => this.sendMessage(message));
        this.digitalInputs.fmsBus.addDataCallback('updateMessage', (message) => this.atc.updateMessage(message as CpdlcMessage));
        this.digitalInputs.fmsBus.addDataCallback('remoteStationAvailable', (station) => this.isRemoteStationAvailable(station));
        this.digitalInputs.fmsBus.addDataCallback('atcLogon', (station) => this.atc.logon(station));
        this.digitalInputs.fmsBus.addDataCallback('atcLogoff', () => this.atc.logoff());
        this.digitalInputs.fmsBus.addDataCallback('connectToNetworks', (callsign) => this.connectToNetworks(callsign));
        this.digitalInputs.fmsBus.addDataCallback('activateAtisAutoUpdate', (data) => this.atc.activateAtisAutoUpdate(data));
        this.digitalInputs.fmsBus.addDataCallback('deactivateAtisAutoUpdate', (icao) => this.atc.deactivateAtisAutoUpdate(icao));
        this.digitalInputs.fmsBus.addDataCallback('togglePrintAtisReportsPrint', () => this.atc.togglePrintAtisReports());
        this.digitalInputs.fmsBus.addDataCallback('setMaxUplinkDelay', (delay) => this.atc.setMaxUplinkDelay(delay));
        this.digitalInputs.fmsBus.addDataCallback('toggleAutomaticPositionReport', () => this.atc.toggleAutomaticPositionReportActive());
        this.digitalInputs.fmsBus.addDataCallback('requestAocAtis', (icao, type, sentCallback) => this.aoc.receiveAtis(icao, type, sentCallback));
        this.digitalInputs.fmsBus.addDataCallback('requestAtcAtis', (icao, type) => this.atc.receiveAtis(icao, type));
        this.digitalInputs.fmsBus.addDataCallback('requestWeather', (icaos, requestMetar, sentCallback) => this.aoc.receiveWeather(requestMetar, icaos, sentCallback));
        this.digitalInputs.fmsBus.addDataCallback('positionReportData', () => this.createPositionReportData());
        this.digitalInputs.fmsBus.addDataCallback('registerMessages', (messages) => this.registerMessages(messages));
        this.digitalInputs.fmsBus.addDataCallback('messageRead', (uid) => this.messageRead(uid));
        this.digitalInputs.fmsBus.addDataCallback('removeMessage', (uid) => this.removeMessage(uid));
        this.digitalInputs.fmsBus.addDataCallback('cleanupAtcMessages', () => this.atc.cleanupMessages());
        this.digitalInputs.fmsBus.addDataCallback('resetAtisAutoUpdate', () => this.atc.resetAtisAutoUpdate());

        this.datalinkOutputBus.addDataCallback('receivedFreetextMessage', (message) => this.registerMessages([message]));
        this.datalinkOutputBus.addDataCallback('receivedCpdlcMessage', (message) => this.registerMessages([message]));
    }

    public async connectToNetworks(flightNo: string): Promise<AtsuStatusCodes> {
        await this.disconnectFromNetworks();

        if (flightNo.length === 0) {
            return AtsuStatusCodes.Ok;
        }

        const code = await this.datalink.connect(flightNo);
        if (code === AtsuStatusCodes.Ok) {
            console.log(`ATSU: Callsign switch from ${this.fltNo} to ${flightNo}`);
            this.fltNo = flightNo;
        }

        return code;
    }

    public flightPhase(): FmgcFlightPhase {
        return this.digitalInputs.FlightPhase;
    }

    public async disconnectFromNetworks(): Promise<AtsuStatusCodes> {
        await this.atc.disconnect();

        console.log('ATSU: Reset of callsign');
        this.fltNo = '';

        return this.datalink.disconnect();
    }

    public flightNumber(): string {
        return this.fltNo;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.UnknownMessage;

        message.Timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);

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
        if (!this.poweredUp || messages.length === 0) return;

        messages.forEach((message) => {
            message.UniqueMessageID = ++this.messageCounter;
            message.Timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
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
        if (this.poweredUp) this.digitalOutputs.FmsBus.sendAtsuSystemStatus(code);
    }

    public modifyMailboxMessage(message: CpdlcMessage): void {
        if (this.poweredUp) this.digitalOutputs.FmsBus.sendMessageModify(message);
    }

    public async isRemoteStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        if (!this.poweredUp) return AtsuStatusCodes.Ok;
        return this.datalink.isStationAvailable(callsign);
    }

    public printMessage(message: AtsuMessage): void {
        if (this.poweredUp) this.digitalOutputs.FmsBus.sendPrintMessage(message);
    }
}
