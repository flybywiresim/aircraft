//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
    AtsuStatusCodes,
    AtsuMessageDirection,
    AtsuMessage,
    WeatherMessage,
    AtisType,
    AtsuTimestamp,
} from '@datalink/common';
import { EventBus } from 'msfssdk';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';

/**
 * Defines the AOC
 */
export class Aoc {
    private poweredUp: boolean = false;

    private messageCounter: number = 0;

    private digitalInputs: DigitalInputs = null;

    private digitalOutputs: DigitalOutputs = null;

    private messageQueueUplink: AtsuMessage[] = [];

    private messageQueueDownlink: AtsuMessage[] = [];

    private blacklistedMessageIds: number[] = [];

    constructor(private bus: EventBus, synchronizedRouter: boolean, synchronizedAtc: boolean) {
        this.digitalInputs = new DigitalInputs(this.bus, synchronizedAtc);
        this.digitalOutputs = new DigitalOutputs(this.bus, synchronizedRouter);

        this.digitalInputs.fmsBus.addDataCallback('sendFreetextMessage', (message) => this.sendMessage(message));
        this.digitalInputs.fmsBus.addDataCallback('requestAtis', (icao, type, sentCallback) => this.receiveAtis(icao, type, sentCallback));
        this.digitalInputs.fmsBus.addDataCallback('requestWeather', (icaos, requestMetar, sentCallback) => this.receiveWeather(requestMetar, icaos, sentCallback));
        this.digitalInputs.fmsBus.addDataCallback('registerMessages', (messages) => this.insertMessages(messages));
        this.digitalInputs.fmsBus.addDataCallback('messageRead', (messageId) => this.messageRead(messageId));
        this.digitalInputs.fmsBus.addDataCallback('removeMessage', (messageId) => this.removeMessage(messageId));
        this.digitalInputs.routerBus.addDataCallback('receivedFreetextMessage', (message) => this.insertMessages([message]));
        this.digitalInputs.atcAocBus.addDataCallback('ignoreIncomingMessage', (uid: number) => {
            const index = this.messageQueueUplink.findIndex((message) => message.UniqueMessageID === uid);
            if (index !== -1) {
                this.removeMessage(uid);
            } else {
                this.blacklistedMessageIds.push(uid);
            }
        });
    }

    public powerUp(): void {
        this.digitalInputs.powerUp();
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.digitalOutputs.FmsBus.powerDown();
        this.digitalInputs.powerDown();
        this.messageQueueUplink = [];
        this.messageQueueDownlink = [];
        this.poweredUp = false;
    }

    public initialize(): void {
        this.digitalInputs.initialize();
        this.digitalInputs.connectedCallback();
    }

    public startPublish(): void {
        this.digitalInputs.startPublish();
    }

    public update(): void {
        this.digitalInputs.update();
    }

    private async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        if (this.poweredUp) {
            return this.digitalOutputs.RouterBus.sendMessage(message, false).then((code) => {
                if (code === AtsuStatusCodes.Ok) this.insertMessages([message]);
                return code;
            });
        }

        return AtsuStatusCodes.ComFailed;
    }

    private removeMessage(uid: number): void {
        let index = this.messageQueueUplink.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            // decrease the company message counter
            if (this.messageQueueUplink.at(index).Confirmed === false) {
                const cMsgCnt = this.digitalInputs.CompanyMessageCount;
                this.digitalOutputs.FwcBus.setCompanyMessageCount(Math.max(0, cMsgCnt - 1));
            }

            this.messageQueueUplink.splice(index, 1);
            this.digitalOutputs.FmsBus.deleteMessage(uid);
        } else {
            index = this.messageQueueDownlink.findIndex((element) => element.UniqueMessageID === uid);
            if (index !== -1) {
                this.messageQueueDownlink.splice(index, 1);
                this.digitalOutputs.FmsBus.deleteMessage(uid);
            }
        }
    }

    private async receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        if (!this.poweredUp) return [AtsuStatusCodes.ComFailed, null];
        if (requestMetar) return this.digitalOutputs.RouterBus.receiveMetar(icaos, sentCallback);
        this.digitalOutputs.RouterBus.receiveTaf(icaos, sentCallback);
    }

    private async receiveAtis(icao: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        if (!this.poweredUp) return [AtsuStatusCodes.ComFailed, null];
        return this.digitalOutputs.RouterBus.receiveAtis(icao, type, sentCallback);
    }

    private messageRead(uid: number): void {
        const index = this.messageQueueUplink.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1) {
            if (this.messageQueueUplink[index].Confirmed === false) {
                const cMsgCnt = this.digitalInputs.CompanyMessageCount;
                this.digitalOutputs.FwcBus.setCompanyMessageCount(cMsgCnt <= 1 ? 0 : cMsgCnt - 1);
            }

            this.messageQueueUplink[index].Confirmed = true;
            this.digitalOutputs.FmsBus.resynchronizeAocMessage(this.messageQueueUplink[index]);
        }
    }

    private insertMessages(messages: AtsuMessage[]): void {
        messages.forEach((message) => {
            message.UniqueMessageID = ++this.messageCounter;
            message.Timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);

            if (message.Direction === AtsuMessageDirection.Uplink) {
                const index = this.blacklistedMessageIds.findIndex((uid) => uid === message.UniqueMessageID);

                if (index === -1) {
                    this.messageQueueUplink.unshift(message);

                    // increase the company message counter
                    const cMsgCnt = this.digitalInputs.CompanyMessageCount;
                    this.digitalOutputs.FwcBus.setCompanyMessageCount(cMsgCnt + 1);
                } else {
                    this.blacklistedMessageIds.splice(index, 1);
                }
            } else {
                this.messageQueueDownlink.unshift(message);
            }

            this.digitalOutputs.FmsBus.resynchronizeAocMessage(message);
        });
    }
}
