//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { AtsuManager } from '../AtsuManager';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { FreetextMessage } from '../messages/FreetextMessage';
import { AtsuMessage, AtsuMessageNetwork, AtsuMessageType } from '../messages/AtsuMessage';
import { AtisMessage } from '../messages/AtisMessage';
import { MetarMessage } from '../messages/MetarMessage';
import { TafMessage } from '../messages/TafMessage';
import { WeatherMessage } from '../messages/WeatherMessage';
import { HoppieConnector } from './HoppieConnector';
import { NXApiConnector } from './NXApiConnector';

export class Datalink {
    private overallDelay = 0;

    private waitedTimeHoppie = 0;

    private waitedTimeNXApi = 0;

    private firstPollHoppie = true;

    private enqueueReceivedMessages(parent: AtsuManager, messages: AtsuMessage[]): void {
        messages.forEach((message) => {
            this.estimateTransmissionTime();
            setTimeout(() => parent.registerMessage(message), this.overallDelay);
        });
    }

    constructor(parent: AtsuManager) {
        // copy the datalink transmission time data
        switch (NXDataStore.get('CONFIG_DATALINK_TRANSMISSION_TIME', 'FAST')) {
        case 'REAL':
            SimVar.SetSimVarValue('L:A32NX_CONFIG_DATALINK_TIME', 'number', 0);
            break;
        case 'FAST':
            SimVar.SetSimVarValue('L:A32NX_CONFIG_DATALINK_TIME', 'number', 2);
            break;
        default:
            SimVar.SetSimVarValue('L:A32NX_CONFIG_DATALINK_TIME', 'number', 1);
            break;
        }

        setInterval(() => {
            // update the internal timer
            if (this.overallDelay <= 200) {
                this.overallDelay = 0;
            } else {
                this.overallDelay -= 200;
            }

            if (HoppieConnector.pollInterval() <= this.waitedTimeHoppie) {
                HoppieConnector.poll().then((retval) => {
                    if (retval[0] === AtsuStatusCodes.Ok) {
                        // delete all data in the first call (Hoppie stores old data)
                        if (!this.firstPollHoppie) {
                            this.enqueueReceivedMessages(parent, retval[1]);
                        }
                        this.firstPollHoppie = false;
                    }
                });
                this.waitedTimeHoppie = 0;
            } else {
                this.waitedTimeHoppie += 200;
            }

            if (NXApiConnector.pollInterval() <= this.waitedTimeNXApi) {
                NXApiConnector.poll().then((retval) => {
                    if (retval[0] === AtsuStatusCodes.Ok) {
                        this.enqueueReceivedMessages(parent, retval[1]);
                    }
                });
                this.waitedTimeNXApi = 0;
            } else {
                this.waitedTimeNXApi += 200;
            }
        }, 200);
    }

    private estimateTransmissionTime(): void {
        let timeout = 0;

        switch (SimVar.GetSimVarValue('L:A32NX_CONFIG_DATALINK_TIME', 'number')) {
        // realistic transmission
        case 0:
            timeout = 60;
            break;
        // fast transmission
        case 2:
            timeout = 10;
            break;
        // instant transmission
        default:
            timeout = 1;
            break;
        }

        // update the timeout and overall delay
        timeout += Math.floor(Math.random() * timeout);
        timeout *= 1000;
        this.overallDelay += timeout;
    }

    private async receiveWeatherData(requestMetar: boolean, icaos: string[], index: number, message: WeatherMessage): Promise<AtsuStatusCodes> {
        let retval = AtsuStatusCodes.Ok;

        if (index < icaos.length) {
            if (requestMetar === true) {
                retval = await NXApiConnector.receiveMetar(icaos[index], message).then(() => this.receiveWeatherData(requestMetar, icaos, index + 1, message));
            } else {
                retval = await NXApiConnector.receiveTaf(icaos[index], message).then(() => this.receiveWeatherData(requestMetar, icaos, index + 1, message));
            }
        }

        return retval;
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[]): Promise<[AtsuStatusCodes, WeatherMessage | undefined]> {
        this.estimateTransmissionTime();

        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                let message = undefined;
                if (requestMetar === true) {
                    message = new MetarMessage();
                } else {
                    message = new TafMessage();
                }

                this.receiveWeatherData(requestMetar, icaos, 0, message).then((code) => {
                    if (code !== AtsuStatusCodes.Ok) {
                        resolve([AtsuStatusCodes.ComFailed, undefined]);
                    }
                    resolve([AtsuStatusCodes.Ok, message]);
                });
            }, this.overallDelay);
        });
    }

    public async isStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return HoppieConnector.isStationAvailable(callsign);
    }

    public async receiveAtis(icao: string): Promise<[AtsuStatusCodes, WeatherMessage | undefined]> {
        this.estimateTransmissionTime();

        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                const message = new AtisMessage();
                NXApiConnector.receiveAtis(icao, message).then(() => resolve([AtsuStatusCodes.Ok, message]));
            }, this.overallDelay);
        });
    }

    public async sendMessage(message: AtsuMessage, force: boolean): Promise<AtsuStatusCodes> {
        this.estimateTransmissionTime();

        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                if (message.Type < AtsuMessageType.AOC) {
                    if (message.Network === AtsuMessageNetwork.FBW) {
                        NXApiConnector.sendTelexMessage(message as FreetextMessage).then((code) => resolve(code));
                    } else {
                        HoppieConnector.sendTelexMessage(message as FreetextMessage, force).then((code) => resolve(code));
                    }
                } else if (message.Type < AtsuMessageType.ATC) {
                    HoppieConnector.sendCpdlcMessage(message as CpdlcMessage, force).then((code) => resolve(code));
                } else {
                    resolve(AtsuStatusCodes.UnknownMessage);
                }
            }, this.overallDelay);
        });
    }
}
