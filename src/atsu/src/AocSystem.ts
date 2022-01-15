//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { FreetextMessage, AtsuManager } from './AtsuManager';
import { AtsuMessageDirection, AtsuMessageNetwork, AtsuMessage, AtsuMessageComStatus, AtsuMessageType } from './messages/AtsuMessage';
import { AtisMessage } from './messages/AtisMessage';
import { MetarMessage } from './messages/MetarMessage';
import { TafMessage } from './messages/TafMessage';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { HoppieConnector } from './HoppieConnector';
import { wordWrap } from './Common';

const WeatherMap = {
    FAA: 'faa',
    IVAO: 'ivao',
    MSFS: 'ms',
    NOAA: 'aviationweather',
    PILOTEDGE: 'pilotedge',
    VATSIM: 'vatsim',
};

/**
 * Defines the AOC manager
 */
export class AocSystem {
    private connector : HoppieConnector = undefined;

    private messageQueue : AtsuMessage[] = [];

    constructor(parent: AtsuManager, connector: HoppieConnector) {
        this.connector = connector;

        setInterval(() => {
            // Update connection
            NXApi.updateTelex()
                .catch((err) => {
                    if (err !== NXApi.disconnectedError && err !== NXApi.disabledError) {
                        console.log('TELEX PING FAILED');
                    }
                });

            // Fetch new messages
            NXApi.getTelexMessages()
                .then((data) => {
                    let msgCounter = 0;

                    for (const msg of data) {
                        const message = new FreetextMessage();
                        message.Network = AtsuMessageNetwork.FBW;
                        message.Direction = AtsuMessageDirection.Input;
                        message.Station = msg.from.flight;
                        message.Lines = wordWrap(msg.message.replace(/;/i, ' '), 25);

                        parent.registerMessage(message);
                        msgCounter += 1;
                    }

                    const msgCount = SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number');
                    SimVar.SetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number', msgCount + msgCounter).then();
                })
                .catch((err) => {
                    if (err.status === 404 || err === NXApi.disabledError || err === NXApi.disconnectedError) {
                        return;
                    }
                    console.log('TELEX MSG FETCH FAILED');
                });
        }, NXApi.updateRate);
    }

    public static isRelevantMessage(message: AtsuMessage): boolean {
        return message.Type < AtsuMessageType.AOC;
    }

    private async sendFbwTelexMessage(message: FreetextMessage): Promise<string> {
        const content = message.Lines.join(';');
        return NXApi.sendTelexMessage(message.Station, content).then(() => {
            message.ComStatus = AtsuMessageComStatus.Sent;
            return '';
        }).catch(() => {
            message.ComStatus = AtsuMessageComStatus.Failed;
            return 'COM UNAVAILABLE';
        });
    }

    private async sendHoppieTelexMessage(message: AtsuMessage): Promise<string> {
        return this.connector.sendTelexMessage(message).then((retval) => {
            if (retval === '') {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }
            return retval;
        });
    }

    private async sendTelexMessage(message: AtsuMessage): Promise<string> {
        if (message.Network === AtsuMessageNetwork.Hoppie) {
            if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
                return this.sendHoppieTelexMessage(message);
            }
        } else if (message.Network === AtsuMessageNetwork.FBW) {
            if (NXApi.hasTelexConnection() === true && NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') === 'ENABLED') {
                return this.sendFbwTelexMessage(message as FreetextMessage);
            }
        }

        message.ComStatus = AtsuMessageComStatus.Failed;
        return 'COM UNAVAILABLE';
    }

    public async sendMessage(message: AtsuMessage): Promise<string> {
        if (AocSystem.isRelevantMessage(message)) {
            message.ComStatus = AtsuMessageComStatus.Sending;
            return this.sendTelexMessage(message);
        }

        return 'INVALID MSG';
    }

    public removeMessage(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue.splice(index, 1);
        }
        return index !== -1;
    }

    private static async receiveMetar(icao: string, message: WeatherMessage): Promise<boolean> {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        return NXApi.getMetar(icao, WeatherMap[storedMetarSrc])
            .then((data) => {
                const newLines = wordWrap(data.metar, 25);
                message.Reports.push({ airport: icao, report: newLines });
                return true;
            }).catch(() => false);
    }

    private static async receiveTaf(icao: string, message: WeatherMessage): Promise<boolean> {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        return NXApi.getTaf(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                const newLines = wordWrap(data.taf, 25);
                message.Reports.push({ airport: icao, report: newLines });
                return true;
            }).catch(() => false);
    }

    private static async receiveWeatherData(requestMetar: boolean, icaos: string[], index: number, message: WeatherMessage): Promise<boolean> {
        let retval = true;

        if (index < icaos.length) {
            if (requestMetar === true) {
                retval = await AocSystem.receiveMetar(icaos[index], message).then(() => AocSystem.receiveWeatherData(requestMetar, icaos, index + 1, message));
            } else {
                retval = await AocSystem.receiveTaf(icaos[index], message).then(() => AocSystem.receiveWeatherData(requestMetar, icaos, index + 1, message));
            }
        }

        return retval;
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[]): Promise<WeatherMessage> {
        let message = undefined;
        if (requestMetar === true) {
            message = new MetarMessage();
        } else {
            message = new TafMessage();
        }

        const error = await AocSystem.receiveWeatherData(requestMetar, icaos, 0, message);

        if (!error) {
            message = undefined;
        }

        return message;
    }

    public async receiveAtis(icao: string): Promise<WeatherMessage> {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');
        const message = new AtisMessage();

        await NXApi.getAtis(icao, WeatherMap[storedAtisSrc])
            .then((data) => {
                const newLines = wordWrap(data.combined, 25);
                message.Reports.push({ airport: icao, report: newLines });
            }).catch(() => {
                message.Reports.push({ airport: icao, report: ['D-ATIS NOT AVAILABLE'] });
            });

        return message;
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Input) {
            if (this.messageQueue[index].Confirmed === false) {
                const cMsgCnt = SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number');
                SimVar.SetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number', cMsgCnt <= 1 ? 0 : cMsgCnt - 1);
            }

            this.messageQueue[index].Confirmed = true;
        }

        return index !== -1;
    }

    public messages(): AtsuMessage[] {
        return this.messageQueue;
    }

    public outputMessages(): AtsuMessage[] {
        return this.messageQueue.filter((entry) => entry.Direction === AtsuMessageDirection.Output);
    }

    public inputMessages(): AtsuMessage[] {
        return this.messageQueue.filter((entry) => entry.Direction === AtsuMessageDirection.Input);
    }

    public uidRegistered(uid: number): boolean {
        return this.messageQueue.findIndex((element) => uid === element.UniqueMessageID) !== -1;
    }

    public insertMessage(message: AtsuMessage): void {
        this.messageQueue.unshift(message);

        if (message.Direction === AtsuMessageDirection.Input) {
        // increase the company message counter
            const cMsgCnt = SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number');
            SimVar.SetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number', cMsgCnt + 1);
        }
    }
}

export { AtsuMessage, AtsuTimestamp };
