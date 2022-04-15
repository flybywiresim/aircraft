//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes } from '../AtsuStatusCodes';
import { Atsu } from '../ATSU';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { AtsuMessage, AtsuMessageNetwork, AtsuMessageType } from '../messages/AtsuMessage';
import { AtisMessage, AtisType } from '../messages/AtisMessage';
import { MetarMessage } from '../messages/MetarMessage';
import { TafMessage } from '../messages/TafMessage';
import { Vdl } from './vhf/VDL';
import { WeatherMessage } from '../messages/WeatherMessage';
import { HoppieConnector } from './webinterfaces/HoppieConnector';
import { NXApiConnector } from './webinterfaces/NXApiConnector';

export class Datalink {
    private vdl: Vdl = new Vdl();

    private waitedComUpdate = 0;

    private waitedTimeHoppie = 0;

    private waitedTimeNXApi = 0;

    private firstPollHoppie = true;

    private enqueueReceivedMessages(parent: Atsu, messages: AtsuMessage[]): void {
        messages.forEach((message) => {
            // ignore empty messages (happens sometimes in CPDLC with buggy ATC software)
            if (message.Message.length !== 0) {
                const transmissionTime = this.vdl.enqueueInboundMessage(message);
                setTimeout(() => {
                    this.vdl.dequeueInboundMessage(transmissionTime);
                    parent.registerMessages([message]);
                }, transmissionTime);
            }
        });
    }

    constructor(parent: Atsu) {
        HoppieConnector.activateHoppie();

        setInterval(() => {
            if (this.waitedComUpdate <= 30000) {
                this.vdl.simulateTransmissionTimes(parent.flightPhase());
                this.waitedComUpdate = 0;
            } else {
                this.waitedComUpdate += 5000;
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
                this.waitedTimeHoppie += 5000;
            }

            if (NXApiConnector.pollInterval() <= this.waitedTimeNXApi) {
                NXApiConnector.poll().then((retval) => {
                    if (retval[0] === AtsuStatusCodes.Ok) {
                        this.enqueueReceivedMessages(parent, retval[1]);
                    }
                });
                this.waitedTimeNXApi = 0;
            } else {
                this.waitedTimeNXApi += 5000;
            }
        }, 5000);
    }

    public static async connect(flightNo: string): Promise<AtsuStatusCodes> {
        return NXApiConnector.connect(flightNo).then((code) => {
            if (code === AtsuStatusCodes.TelexDisabled) code = AtsuStatusCodes.Ok;

            if (code === AtsuStatusCodes.Ok) {
                return HoppieConnector.connect(flightNo).then((code) => {
                    if (code === AtsuStatusCodes.NoHoppieConnection) code = AtsuStatusCodes.Ok;
                    return code;
                });
            }

            return code;
        });
    }

    public static async disconnect(): Promise<AtsuStatusCodes> {
        let retvalNXApi = await NXApiConnector.disconnect();
        if (retvalNXApi === AtsuStatusCodes.TelexDisabled) retvalNXApi = AtsuStatusCodes.Ok;

        let retvalHoppie = HoppieConnector.disconnect();
        if (retvalHoppie === AtsuStatusCodes.NoHoppieConnection) retvalHoppie = AtsuStatusCodes.Ok;

        if (retvalNXApi !== AtsuStatusCodes.Ok) return retvalNXApi;
        return retvalHoppie;
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

    private async simulateWeatherRequestResponse(data: [AtsuStatusCodes, WeatherMessage], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise((resolve, _reject) => {
            // simulate the request transmission
            const requestTimeout = this.vdl.enqueueOutboundPacket();
            setTimeout(() => {
                this.vdl.dequeueOutboundMessage(requestTimeout);
                sentCallback();

                const processingTimeout = 300 + Math.floor(Math.random() * 500);

                // simulate some remote processing time
                setTimeout(() => {
                    // simulate the response transmission
                    const responseTimeout = this.vdl.enqueueInboundMessage(data[1]);
                    setTimeout(() => {
                        this.vdl.dequeueInboundMessage(responseTimeout);
                        resolve(data);
                    }, responseTimeout);
                }, processingTimeout);
            }, requestTimeout);
        });
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        let message = undefined;
        if (requestMetar === true) {
            message = new MetarMessage();
        } else {
            message = new TafMessage();
        }

        return this.receiveWeatherData(requestMetar, icaos, 0, message).then((code) => this.simulateWeatherRequestResponse([code, message], sentCallback));
    }

    public async isStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return HoppieConnector.isStationAvailable(callsign);
    }

    public async receiveAtis(icao: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        const message = new AtisMessage();
        return NXApiConnector.receiveAtis(icao, type, message).then(() => this.simulateWeatherRequestResponse([AtsuStatusCodes.Ok, message], sentCallback));
    }

    public async sendMessage(message: AtsuMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise((resolve, _reject) => {
            const timeout = this.vdl.enqueueOutboundMessage(message);
            setTimeout(() => {
                this.vdl.dequeueOutboundMessage(timeout);

                if (message.Type < AtsuMessageType.AOC) {
                    if (message.Network === AtsuMessageNetwork.FBW) {
                        NXApiConnector.sendTelexMessage(message).then((code) => resolve(code));
                    } else {
                        HoppieConnector.sendTelexMessage(message, force).then((code) => resolve(code));
                    }
                } else if (message.Type === AtsuMessageType.DCL) {
                    HoppieConnector.sendTelexMessage(message, force).then((code) => resolve(code));
                } else if (message.Type < AtsuMessageType.ATC) {
                    HoppieConnector.sendCpdlcMessage(message as CpdlcMessage, force).then((code) => resolve(code));
                } else {
                    resolve(AtsuStatusCodes.UnknownMessage);
                }
            }, timeout);
        });
    }
}
