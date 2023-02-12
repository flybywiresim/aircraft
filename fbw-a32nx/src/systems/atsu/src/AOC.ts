//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes } from './AtsuStatusCodes';
import { AtsuMessageDirection, AtsuMessage, AtsuMessageType } from './messages/AtsuMessage';
import { WeatherMessage } from './messages/WeatherMessage';
import { AtisType } from './messages/AtisMessage';
import { Datalink } from './com/Datalink';

/**
 * Defines the AOC
 */
export class Aoc {
    private datalink: Datalink = null;

    private messageQueue: AtsuMessage[] = [];

    constructor(datalink: Datalink) {
        this.datalink = datalink;
    }

    private async updateMessageCount(): Promise<unknown> {
        const msgCount = this.messageQueue.reduce((c, m) => (!m.Confirmed && m.Direction === AtsuMessageDirection.Uplink ? c + 1 : c), 0);
        return SimVar.SetSimVarValue('L:A32NX_COMPANY_MSG_COUNT', 'number', msgCount);
    }

    public static isRelevantMessage(message: AtsuMessage): boolean {
        return message.Type < AtsuMessageType.AOC;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        if (Aoc.isRelevantMessage(message)) {
            return this.datalink.sendMessage(message, false);
        }
        return AtsuStatusCodes.UnknownMessage;
    }

    public removeMessage(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueue.splice(index, 1);
        }
        this.updateMessageCount();
        return index !== -1;
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return this.datalink.receiveWeather(requestMetar, icaos, sentCallback);
    }

    public async receiveAtis(icao: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return this.datalink.receiveAtis(icao, type, sentCallback);
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Uplink) {
            this.messageQueue[index].Confirmed = true;
        }
        this.updateMessageCount();

        return index !== -1;
    }

    public messages(): AtsuMessage[] {
        return this.messageQueue;
    }

    public outputMessages(): AtsuMessage[] {
        return this.messageQueue.filter((entry) => entry.Direction === AtsuMessageDirection.Downlink);
    }

    public inputMessages(): AtsuMessage[] {
        return this.messageQueue.filter((entry) => entry.Direction === AtsuMessageDirection.Uplink);
    }

    public uidRegistered(uid: number): boolean {
        return this.messageQueue.findIndex((element) => uid === element.UniqueMessageID) !== -1;
    }

    public insertMessages(messages: AtsuMessage[]): void {
        messages.forEach((message) => {
            this.messageQueue.unshift(message);
        });
        this.updateMessageCount();
    }
}
