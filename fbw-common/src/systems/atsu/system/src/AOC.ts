//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, AtsuMessageDirection, AtsuMessage, AtsuMessageType, WeatherMessage, AtisType } from '@atsu/common';
import { Atsu } from './ATSU';

/**
 * Defines the AOC
 */
export class Aoc {
    private poweredUp: boolean = false;

    private atsu: Atsu = null;

    private messageQueueUplink: AtsuMessage[] = [];

    private messageQueueDownlink: AtsuMessage[] = [];

    constructor(atsu: Atsu) {
        this.atsu = atsu;
    }

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.messageQueueUplink = [];
        this.messageQueueDownlink = [];
        this.poweredUp = false;
    }

    public static isRelevantMessage(message: AtsuMessage): boolean {
        return message.Type < AtsuMessageType.AOC;
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        if (Aoc.isRelevantMessage(message)) {
            return this.atsu.datalink.sendMessage(message, false);
        }
        return AtsuStatusCodes.UnknownMessage;
    }

    public removeMessage(uid: number): boolean {
        let index = this.messageQueueUplink.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            this.messageQueueUplink.splice(index, 1);
            this.atsu.digitalOutputs.FmsBus.deleteMessage(uid);
        } else {
            index = this.messageQueueDownlink.findIndex((element) => element.UniqueMessageID === uid);
            if (index !== -1) {
                this.messageQueueDownlink.splice(index, 1);
                this.atsu.digitalOutputs.FmsBus.deleteMessage(uid);
            }
        }

        return index !== -1;
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        if (requestMetar) return this.atsu.datalink.receiveMetar(icaos, sentCallback);
        this.atsu.datalink.receiveTaf(icaos, sentCallback);
    }

    public async receiveAtis(icao: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return this.atsu.datalink.receiveAtis(icao, type, sentCallback);
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueueUplink.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            if (this.messageQueueUplink[index].Confirmed === false) {
                const cMsgCnt = this.atsu.digitalInputs.CompanyMessageCount;
                this.atsu.digitalOutputs.FwcBus.setCompanyMessageCount(cMsgCnt <= 1 ? 0 : cMsgCnt - 1);
            }

            this.messageQueueUplink[index].Confirmed = true;
            this.atsu.digitalOutputs.FmsBus.resynchronizeAocMessage(this.messageQueueUplink[index]);
        }

        return index !== -1;
    }

    public downlinkMessages(): AtsuMessage[] {
        return this.messageQueueDownlink;
    }

    public uplinkMessages(): AtsuMessage[] {
        return this.messageQueueUplink;
    }

    public insertMessages(messages: AtsuMessage[]): void {
        messages.forEach((message) => {
            if (message.Direction === AtsuMessageDirection.Uplink) {
                this.messageQueueUplink.unshift(message);

                // increase the company message counter
                const cMsgCnt = this.atsu.digitalInputs.CompanyMessageCount;
                this.atsu.digitalOutputs.FwcBus.setCompanyMessageCount(cMsgCnt + 1);
            } else {
                this.messageQueueDownlink.unshift(message);
            }

            this.atsu.digitalOutputs.FmsBus.resynchronizeAocMessage(message);
        });
    }
}
