//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
    DatalinkModeCode,
    DatalinkStatusCode,
    AtsuStatusCodes,
    CpdlcMessage,
    AtsuMessage,
    AtsuMessageNetwork,
    AtsuMessageType,
    AtisMessage,
    AtisType,
    MetarMessage,
    TafMessage,
    WeatherMessage,
} from '@atsu/common';
import { NXDataStore } from '@shared/persistence';
import { Vdl } from './vhf/VDL';
import { Atsu } from '../ATSU';
import { HoppieConnector } from './webinterfaces/HoppieConnector';
import { NXApiConnector } from './webinterfaces/NXApiConnector';

enum ActiveCommunicationInterface {
    None,
    VHF,
    HF,
    SATCOM,
};

export class Datalink {
    private communicationInterface: ActiveCommunicationInterface = ActiveCommunicationInterface.None;

    private vdl: Vdl = new Vdl();

    private waitedComUpdate = 0;

    private waitedTimeHoppie = 0;

    private waitedTimeNXApi = 0;

    private firstPollHoppie = true;

    private enqueueReceivedMessages(atsu: Atsu, messages: AtsuMessage[]): void {
        switch (this.communicationInterface) {
        case ActiveCommunicationInterface.VHF:
            messages.forEach((message) => {
                // ignore empty messages (happens sometimes in CPDLC with buggy ATC software)
                if (message.Message.length !== 0) {
                    const transmissionTime = this.vdl.enqueueInboundMessage(message);
                    setTimeout(() => {
                        this.vdl.dequeueInboundMessage(transmissionTime);
                        atsu.registerMessages([message]);
                    }, transmissionTime);
                }
            });
            break;
        case ActiveCommunicationInterface.HF:
        case ActiveCommunicationInterface.SATCOM:
        case ActiveCommunicationInterface.None:
        default:
            return;
        }
    }

    constructor(atsu: Atsu) {
        HoppieConnector.activateHoppie();

        setInterval(() => {
            // update the communication interface states
            this.vdl.vhf3.updateDatalinkStates(atsu.digitalInputs.RmpData.vhf3Powered, atsu.digitalInputs.RmpData.vhf3DataMode);

            // find the best communication
            if (this.vdl.vhf3.datalinkStatus === DatalinkStatusCode.DlkAvail) {
                this.communicationInterface = ActiveCommunicationInterface.VHF;
            } else {
                this.communicationInterface = ActiveCommunicationInterface.None;
            }

            if (this.waitedComUpdate <= 30000) {
                this.vdl.simulateTransmissionTimes(atsu.flightPhase());
                this.waitedComUpdate = 0;
            } else {
                this.waitedComUpdate += 5000;
            }

            atsu.digitalOutputs.FmsBus.sendDatalinkCommunicationStatus(
                this.vhfDatalinkStatus(),
                this.satcomDatalinkStatus(),
                this.hfDatalinkStatus(),
            );
            atsu.digitalOutputs.FmsBus.sendDatalinkCommunicationMode(
                this.vhfDatalinkMode(),
                this.satcomDatalinkMode(),
                this.hfDatalinkMode(),
            );

            if (HoppieConnector.pollInterval() <= this.waitedTimeHoppie) {
                HoppieConnector.poll().then((retval) => {
                    if (retval[0] === AtsuStatusCodes.Ok) {
                        // delete all data in the first call (Hoppie stores old data)
                        if (!this.firstPollHoppie) {
                            this.enqueueReceivedMessages(atsu, retval[1]);
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
                        this.enqueueReceivedMessages(atsu, retval[1]);
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
        if (this.communicationInterface === ActiveCommunicationInterface.None) {
            return [AtsuStatusCodes.ComFailed, null];
        }

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
        if (this.communicationInterface === ActiveCommunicationInterface.None) {
            return [AtsuStatusCodes.ComFailed, null];
        }

        const message = new AtisMessage();
        return NXApiConnector.receiveAtis(icao, type, message).then(() => this.simulateWeatherRequestResponse([AtsuStatusCodes.Ok, message], sentCallback));
    }

    public async sendMessage(message: AtsuMessage, force: boolean): Promise<AtsuStatusCodes> {
        if (this.communicationInterface === ActiveCommunicationInterface.None) {
            return AtsuStatusCodes.ComFailed;
        }

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

    public vhfDatalinkStatus(): DatalinkStatusCode {
        return this.vdl.vhf3.datalinkStatus;
    }

    public vhfDatalinkMode(): DatalinkModeCode {
        return this.vdl.vhf3.datalinkMode;
    }

    public satcomDatalinkStatus(): DatalinkStatusCode {
        if (NXDataStore.get('MODEL_SATCOM_ENABLED') === '1') {
            return DatalinkStatusCode.DlkNotAvail;
        }
        return DatalinkStatusCode.NotInstalled;
    }

    public satcomDatalinkMode(): DatalinkModeCode {
        return DatalinkModeCode.None;
    }

    public hfDatalinkStatus(): DatalinkStatusCode {
        return DatalinkStatusCode.NotInstalled;
    }

    public hfDatalinkMode(): DatalinkModeCode {
        return DatalinkModeCode.None;
    }
}
