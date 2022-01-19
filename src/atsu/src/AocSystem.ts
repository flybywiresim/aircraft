//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { FreetextMessage, AtsuManager } from './AtsuManager';
import { AtsuMessageDirection, AtsuMessageNetwork, AtsuMessage, AtsuMessageType } from './messages/AtsuMessage';
import { AtisMessage } from './messages/AtisMessage';
import { MetarMessage } from './messages/MetarMessage';
import { TafMessage } from './messages/TafMessage';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { HoppieConnector } from './HoppieConnector';
import { NXApiConnector } from './NXApiConnector';

/**
 * Defines the AOC manager
 */
export class AocSystem {
    private hoppieNetwork: HoppieConnector | undefined = undefined;

    private nxNetwork: NXApiConnector | undefined = undefined;

    private messageQueue: AtsuMessage[] = [];

    constructor(parent: AtsuManager, hoppie: HoppieConnector, nxapi: NXApiConnector) {
        this.hoppieNetwork = hoppie;
        this.nxNetwork = nxapi;
    }

    public static isRelevantMessage(message: AtsuMessage): boolean {
        return message.Type < AtsuMessageType.AOC;
    }

    public async sendMessage(message: AtsuMessage): Promise<string> {
        if (AocSystem.isRelevantMessage(message)) {
            let network: HoppieConnector | NXApiConnector = this.hoppieNetwork;
            if (message.Network === AtsuMessageNetwork.FBW) {
                network = this.nxNetwork;
            }
            return network.sendTelexMessage(message as FreetextMessage);
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

    private async receiveWeatherData(requestMetar: boolean, icaos: string[], index: number, message: WeatherMessage): Promise<boolean> {
        let retval = true;

        if (index < icaos.length) {
            if (requestMetar === true) {
                retval = await this.nxNetwork.receiveMetar(icaos[index], message).then(() => this.receiveWeatherData(requestMetar, icaos, index + 1, message));
            } else {
                retval = await this.nxNetwork.receiveTaf(icaos[index], message).then(() => this.receiveWeatherData(requestMetar, icaos, index + 1, message));
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

        const error = await this.receiveWeatherData(requestMetar, icaos, 0, message);

        if (!error) {
            message = undefined;
        }

        return message;
    }

    public async receiveAtis(icao: string): Promise<WeatherMessage> {
        const message = new AtisMessage();
        await this.nxNetwork.receiveAtis(icao, message);
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
