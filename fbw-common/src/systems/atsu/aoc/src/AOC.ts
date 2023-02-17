//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes, AtsuMessageDirection, AtsuMessage, AtsuMessageType, WeatherMessage, AtisType } from '@atsu/common';
import { DatalinkInputBus, DatalinkOutputBus } from '@atsu/communication';
import { EventBus } from 'msfssdk';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';

/**
 * Defines the AOC
 */
export class Aoc {
    private poweredUp: boolean = false;

    private digitalInputs: DigitalInputs = null;

    private digitalOutputs: DigitalOutputs = null;

    private datalinkInput: DatalinkInputBus = null;

    private datalinkOutput: DatalinkOutputBus = null;

    private messageQueueUplink: AtsuMessage[] = [];

    private messageQueueDownlink: AtsuMessage[] = [];

    constructor(private bus: EventBus, private readonly synchronizedDatalink) {
        this.datalinkInput = new DatalinkInputBus(this.bus, this.synchronizedDatalink);
        this.datalinkOutput = new DatalinkOutputBus(this.bus);
        this.digitalInputs = new DigitalInputs(this.bus);
        this.digitalOutputs = new DigitalOutputs(this.bus);

        this.digitalInputs.fmsBus.addDataCallback('sendFreetextMessage', (message) => this.sendMessage(message));
        this.digitalInputs.fmsBus.addDataCallback('requestAtis', (icao, type, sentCallback) => this.receiveAtis(icao, type, sentCallback));
        this.digitalInputs.fmsBus.addDataCallback('requestWeather', (icaos, requestMetar, sentCallback) => this.receiveWeather(requestMetar, icaos, sentCallback));
        this.digitalInputs.fmsBus.addDataCallback('registerMessages', (messages) => this.insertMessages(messages));
        this.digitalInputs.fmsBus.addDataCallback('messageRead', (messageId) => this.messageRead(messageId));
        this.digitalInputs.fmsBus.addDataCallback('removeMessage', (messageId) => this.removeMessage(messageId));
        this.datalinkOutput.addDataCallback('receivedFreetextMessage', (message) => this.insertMessages([message]));
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
            return this.datalinkInput.sendMessage(message, false).then((code) => {
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
        if (requestMetar) return this.datalinkInput.receiveMetar(icaos, sentCallback);
        this.datalinkInput.receiveTaf(icaos, sentCallback);
    }

    private async receiveAtis(icao: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        if (!this.poweredUp) return [AtsuStatusCodes.ComFailed, null];
        return this.datalinkInput.receiveAtis(icao, type, sentCallback);
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
            if (message.Direction === AtsuMessageDirection.Uplink) {
                this.messageQueueUplink.unshift(message);

                // increase the company message counter
                const cMsgCnt = this.digitalInputs.CompanyMessageCount;
                this.digitalOutputs.FwcBus.setCompanyMessageCount(cMsgCnt + 1);
            } else {
                this.messageQueueDownlink.unshift(message);
            }

            this.digitalOutputs.FmsBus.resynchronizeAocMessage(message);
        });
    }
}
