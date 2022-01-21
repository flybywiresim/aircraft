//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { NXDataStore } from '@shared/persistence';
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
    private hoppieNetwork: HoppieConnector;

    private nxNetwork: NXApiConnector;

    private overallDelay = 0;

    constructor(parent: AtsuManager) {
        // copy the datalink transmission time data
        switch (NXDataStore.get('CONFIG_DATALINK_TRANSMISSION_TIME', 'REAL')) {
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

        this.hoppieNetwork = new HoppieConnector(parent);
        this.nxNetwork = new NXApiConnector(parent);

        // update the internal timer
        setInterval(() => {
            if (this.overallDelay <= 1000) {
                this.overallDelay = 0;
            } else {
                this.overallDelay -= 1000;
            }
        }, 1000);
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
        this.estimateTransmissionTime();

        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                let message = undefined;
                if (requestMetar === true) {
                    message = new MetarMessage();
                } else {
                    message = new TafMessage();
                }

                this.receiveWeatherData(requestMetar, icaos, 0, message).then((error) => {
                    if (!error) {
                        message = undefined;
                    }
                    resolve(message);
                });
            }, this.overallDelay);
        });
    }

    public async receiveAtis(icao: string): Promise<WeatherMessage> {
        this.estimateTransmissionTime();

        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                const message = new AtisMessage();
                this.nxNetwork.receiveAtis(icao, message).then(() => resolve(message));
            }, this.overallDelay);
        });
    }

    public async sendMessage(message: AtsuMessage): Promise<string> {
        this.estimateTransmissionTime();

        return new Promise((resolve, _reject) => {
            setTimeout(() => {
                if (message.Type < AtsuMessageType.AOC) {
                    let network: HoppieConnector | NXApiConnector = this.hoppieNetwork;
                    if (message.Network === AtsuMessageNetwork.FBW) {
                        network = this.nxNetwork;
                    }

                    network.sendTelexMessage(message as FreetextMessage).then((error) => resolve(error));
                } else if (message.Type < AtsuMessageType.ATC) {
                    this.hoppieNetwork.sendCpdlcMessage(message as CpdlcMessage).then((error) => resolve(error));
                } else {
                    resolve('INVALID MSG');
                }
            }, this.overallDelay);
        });
    }
}
