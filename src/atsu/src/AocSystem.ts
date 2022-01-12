//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuMessageDirection, AtsuMessage, AtsuMessageComStatus, AtsuMessageType } from './messages/AtsuMessage';
import { AtisMessage } from './messages/AtisMessage';
import { MetarMessage } from './messages/MetarMessage';
import { TafMessage } from './messages/TafMessage';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { HoppieConnector } from './HoppieConnector';

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

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    constructor(connector: HoppieConnector) {
        this.connector = connector;
    }

    public static isRelevantMessage(message: AtsuMessage) {
        return message.Type < AtsuMessageType.AOC;
    }

    public static isDcduMessage(message: AtsuMessage) {
        return message.Type === AtsuMessageType.PDC;
    }

    public registerMessage(message: AtsuMessage) {
        this.messageQueue.unshift(message);
    }

    private async sendFbwTelexMessage(index: number) {
        const content = this.messageQueue[index].Lines.join(';');
        return NXApi.sendTelexMessage(this.messageQueue[index].Station, content).then(() => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sent;
            return Promise.resolve();
        }).catch(() => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
            return Promise.reject(Error('COM UNAVAILABLE'));
        });
    }

    private async sendHoppieTelexMessage(index: number) {
        this.connector.sendTelexMessage(this.messageQueue[index]).then(() => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sent;
            if (this.messageQueue[index].Type === AtsuMessageType.PDC) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
            }
            return Promise.resolve();
        }).catch((err) => {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
            return Promise.reject(Error(err.message));
        });
    }

    private async sendTelexMessage(index: number) {
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return this.sendHoppieTelexMessage(index);
        }
        if (NXApi.hasTelexConnection() === true && NXDataStore.get('CONFIG_ONLINE_FEATURES_STATUS', 'DISABLED') === 'ENABLED') {
            return this.sendFbwTelexMessage(index);
        }
        this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
        return Promise.reject(Error('COM UNAVAILABLE'));
    }

    private async sendPdcMessage(index: number) {
        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', this.messageQueue[index]);
        if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') === 1) {
            return this.sendHoppieTelexMessage(index);
        }
        this.messageQueue[index].ComStatus = AtsuMessageComStatus.Failed;
        return Promise.reject(Error('COM UNAVAILABLE'));
    }

    public async sendMessage(uid: number) {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue[index].ComStatus = AtsuMessageComStatus.Sending;
            if (this.messageQueue[index].Type === AtsuMessageType.Freetext) {
                return this.sendTelexMessage(index);
            }
            if (this.messageQueue[index].Type === AtsuMessageType.PDC) {
                return this.sendPdcMessage(index);
            }
        }
        return Promise.reject(Error('INVALID MSG'));
    }

    public removeMessage(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue.splice(index, 1);
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_REMOVE', uid);
        }
        return index !== -1;
    }

    private static wordWrap(text: string, maxLength: number) {
        const result = [];
        let line = [];
        let length = 0;

        text.split(' ').forEach((word) => {
            if ((length + word.length) >= maxLength) {
                result.push(line.join(' '));
                line = []; length = 0;
            }
            length += word.length + 1;
            line.push(word);
        });

        if (line.length > 0) {
            result.push(line.join(' '));
        }

        return result;
    }

    private static async receiveMetar(icao: string, message: WeatherMessage) {
        const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');

        await NXApi.getMetar(icao, WeatherMap[storedMetarSrc])
            .then((data) => {
                const newLines = AocSystem.wordWrap(data.metar, 25);
                message.Reports.push({ airport: icao, report: newLines });
            }).catch(() => Promise.reject(Error('COM UNAVAILABLE')));
    }

    private static async receiveTaf(icao: string, message: WeatherMessage) {
        const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');

        await NXApi.getTaf(icao, WeatherMap[storedTafSrc])
            .then((data) => {
                const newLines = AocSystem.wordWrap(data.taf, 25);
                message.Reports.push({ airport: icao, report: newLines });
            }).catch(() => Promise.reject(Error('COM UNAVAILABLE')));
    }

    private static async receiveWeatherData(requestMetar: boolean, icaos: string[], index: number, message: WeatherMessage) {
        if (index < icaos.length) {
            if (requestMetar === true) {
                await AocSystem.receiveMetar(icaos[index], message).then(() => AocSystem.receiveWeatherData(requestMetar, icaos, index + 1, message));
            } else {
                await AocSystem.receiveTaf(icaos[index], message).then(() => AocSystem.receiveWeatherData(requestMetar, icaos, index + 1, message));
            }
        }
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[]) {
        let message = undefined;
        if (requestMetar === true) {
            message = new MetarMessage();
        } else {
            message = new TafMessage();
        }

        return AocSystem.receiveWeatherData(requestMetar, icaos, 0, message).then(() => message);
    }

    public async receiveAtis(icao: string) {
        const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');

        return NXApi.getAtis(icao, WeatherMap[storedAtisSrc])
            .then((data) => {
                const message = new AtisMessage();
                const newLines = AocSystem.wordWrap(data.combined, 25);
                message.Reports.push({ airport: icao, report: newLines });
                return message;
            }).catch(() => {
                const message = new AtisMessage();
                message.Reports.push({ airport: icao, report: ['D-ATIS NOT AVAILABLE'] });
                return message;
            });
    }

    public messageRead(uid: number) {
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

    public messages() {
        return this.messageQueue;
    }

    public outputMessages() {
        return this.messageQueue.filter((entry) => entry.Direction === AtsuMessageDirection.Output);
    }

    public inputMessages() {
        return this.messageQueue.filter((entry) => entry.Direction === AtsuMessageDirection.Input);
    }

    public uidRegistered(uid: number) {
        return this.messageQueue.findIndex((element) => uid === element.UniqueMessageID) !== -1;
    }

    public setOwnCallsign(callsign: string) {
        this.connector.setCallsign(callsign);
    }

    public receiveMessage(message: AtsuMessage) {
        this.messageQueue.unshift(message);

        // increase the company message counter
        const cMsgCnt = SimVar.GetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number');
        SimVar.SetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'Number', cMsgCnt + 1);
    }
}

export { AtsuMessage, AtsuTimestamp };
