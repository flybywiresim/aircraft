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
    MetarMessage,
    TafMessage,
    WeatherMessage,
    FreetextMessage,
} from '@atsu/common';
import { NXDataStore } from '@shared/persistence';
import { Vdl } from './vhf/VDL';
import { HoppieConnector } from './webinterfaces/HoppieConnector';
import { NXApiConnector } from './webinterfaces/NXApiConnector';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';
import { DatalinkMessages } from './databus/DatalinkBus';

enum ActiveCommunicationInterface {
    None,
    VHF,
    HF,
    SATCOM,
};

export class Datalink {
    private readonly subscriber: EventSubscriber<DatalinkMessages>;

    private readonly publisher: Publisher<DatalinkMessages>;

    private communicationInterface: ActiveCommunicationInterface = ActiveCommunicationInterface.None;

    private vdl: Vdl = new Vdl();

    private waitedComUpdate = 0;

    private waitedTimeHoppie = 0;

    private waitedTimeNXApi = 0;

    private firstPollHoppie = true;

    private transmissionSimulationTimeouts: NodeJS.Timeout[] = [];

    private poweredUp: boolean = false;

    private lastUpdateTime: number = -1;

    private removeTransmissionTimeout(timeout: NodeJS.Timeout): void {
        const index = this.transmissionSimulationTimeouts.findIndex((value) => value === timeout);
        if (index >= 0) this.transmissionSimulationTimeouts.splice(index, 1);
    }

    private enqueueReceivedMessages(messages: AtsuMessage[]): void {
        switch (this.communicationInterface) {
        case ActiveCommunicationInterface.VHF:
            messages.forEach((message) => {
                // ignore empty messages (happens sometimes in CPDLC with buggy ATC software)
                if (message.Message.length !== 0) {
                    const transmissionTime = this.vdl.enqueueInboundMessage(message);

                    const timeout = setTimeout(() => {
                        this.vdl.dequeueInboundMessage(transmissionTime);

                        if (this.poweredUp) {
                            if (message.Type === AtsuMessageType.Freetext) {
                                this.publisher.pub('receivedFreetextMessage', message as FreetextMessage, this.synchronizedBuses, false);
                            } else if (message.Type === AtsuMessageType.CPDLC) {
                                this.publisher.pub('receivedCpdlcMessage', message as CpdlcMessage, this.synchronizedBuses, false);
                            } else {
                                console.log('ERROR: Unknown message received in datalink');
                            }
                        }

                        this.removeTransmissionTimeout(timeout);
                    }, transmissionTime);
                    this.transmissionSimulationTimeouts.push(timeout);
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

    constructor(private readonly bus: EventBus, private readonly synchronizedBuses: boolean) {
        HoppieConnector.activateHoppie();

        this.subscriber = this.bus.getSubscriber<DatalinkMessages>();
        this.publisher = this.bus.getPublisher<DatalinkMessages>();

        this.subscriber.on('connect').handle((request) => {
            Datalink.connect(request.callsign).then((status) => this.publisher.pub('managementResponse', { requestId: request.requestId, status }, true, false));
        });
        this.subscriber.on('disconnect').handle((requestId: number) => {
            Datalink.disconnect().then((status) => this.publisher.pub('managementResponse', { requestId, status }, true, false));
        });
        this.subscriber.on('requestStationAvailable').handle((request) => {
            this.isStationAvailable(request.callsign).then((status) => {
                this.publisher.pub('managementResponse', { requestId: request.requestId, status }, true, false);
            });
        });
        this.subscriber.on('sendFreetextMessage').handle((request) => this.sendMessage(request.requestId, request.message, request.force));
        this.subscriber.on('sendCpdlcMessage').handle((request) => this.sendMessage(request.requestId, request.message, request.force));
        this.subscriber.on('sendDclMessage').handle((request) => this.sendMessage(request.requestId, request.message, request.force));
        this.subscriber.on('sendOclMessage').handle((request) => this.sendMessage(request.requestId, request.message, request.force));

        this.subscriber.on('requestAtis').handle((request) => {
            if (this.communicationInterface === ActiveCommunicationInterface.None || !this.poweredUp) {
                this.publisher.pub('receivedWeather', { requestId: request.requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedBuses, false);
            }

            const message = new AtisMessage();
            NXApiConnector.receiveAtis(request.icao, request.type, message).then(() => {
                this.simulateWeatherRequestResponse(
                    [AtsuStatusCodes.Ok, message],
                    () => this.publisher.pub('requestSent', request.requestId, this.synchronizedBuses, false),
                ).then((data) => this.publisher.pub('receivedWeather', { requestId: request.requestId, response: data }, this.synchronizedBuses, false));
            });
        });
        this.subscriber.on('requestMetar').handle((request) => this.receiveWeather(request.requestId, true, request.icaos));
        this.subscriber.on('requestTaf').handle((request) => this.receiveWeather(request.requestId, false, request.icaos));
    }

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.poweredUp = false;

        this.transmissionSimulationTimeouts.forEach((timeout) => clearTimeout(timeout));
        this.transmissionSimulationTimeouts = [];

        this.vdl.reinitialize();
    }

    public update(): void {
        const currentTimestamp = new Date().getTime();

        // update the communication interface states
        this.vdl.vhf3.updateDatalinkStates(this.digitalInputs.RmpData.vhf3Powered, this.digitalInputs.RmpData.vhf3DataMode);

        // find the best communication
        if (this.vdl.vhf3.datalinkStatus === DatalinkStatusCode.DlkAvail && this.poweredUp) {
            this.communicationInterface = ActiveCommunicationInterface.VHF;
        } else {
            this.communicationInterface = ActiveCommunicationInterface.None;
        }

        if (this.waitedComUpdate >= 30000) {
            this.vdl.simulateTransmissionTimes(this.digitalInputs.FlightPhase);
            this.waitedComUpdate = 0;
        } else if (this.lastUpdateTime >= 0) {
            this.waitedComUpdate += currentTimestamp - this.lastUpdateTime;
        }

        this.digitalOutputs.FmsBus.sendDatalinkCommunicationStatus(
            this.vhf3DatalinkStatus(),
            this.satcomDatalinkStatus(),
            DatalinkStatusCode.NotInstalled,
        );
        this.digitalOutputs.FmsBus.sendDatalinkCommunicationMode(
            this.vhf3DatalinkMode(),
            DatalinkModeCode.None,
            DatalinkModeCode.None,
        );

        if (HoppieConnector.pollInterval() <= this.waitedTimeHoppie) {
            HoppieConnector.poll().then((retval) => {
                if (retval[0] === AtsuStatusCodes.Ok) {
                    // delete all data in the first call (Hoppie stores old data)
                    if (!this.firstPollHoppie && this.poweredUp) {
                        this.enqueueReceivedMessages(retval[1]);
                    }
                    this.firstPollHoppie = false;
                }
            });
            this.waitedTimeHoppie = 0;
        } else if (this.lastUpdateTime >= 0) {
            this.waitedTimeHoppie += currentTimestamp - this.lastUpdateTime;
        }

        if (NXApiConnector.pollInterval() <= this.waitedTimeNXApi) {
            NXApiConnector.poll().then((retval) => {
                if (retval[0] === AtsuStatusCodes.Ok && this.poweredUp) {
                    this.enqueueReceivedMessages(retval[1]);
                }
            });
            this.waitedTimeNXApi = 0;
        } else if (this.lastUpdateTime >= 0) {
            this.waitedTimeNXApi += currentTimestamp - this.lastUpdateTime;
        }

        this.lastUpdateTime = currentTimestamp;
    }

    private static async connect(flightNo: string): Promise<AtsuStatusCodes> {
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

    private static async disconnect(): Promise<AtsuStatusCodes> {
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
            let timeout = setTimeout(() => {
                this.vdl.dequeueOutboundMessage(requestTimeout);
                this.removeTransmissionTimeout(timeout);

                if (!this.poweredUp) return;

                sentCallback();

                const processingTimeout = 300 + Math.floor(Math.random() * 500);

                // simulate some remote processing time
                timeout = setTimeout(() => {
                    this.removeTransmissionTimeout(timeout);

                    // simulate the response transmission
                    const responseTimeout = this.vdl.enqueueInboundMessage(data[1]);
                    timeout = setTimeout(() => {
                        this.vdl.dequeueInboundMessage(responseTimeout);
                        this.removeTransmissionTimeout(timeout);

                        if (this.poweredUp) resolve(data);
                    }, responseTimeout);

                    this.transmissionSimulationTimeouts.push(timeout);
                }, processingTimeout);

                this.transmissionSimulationTimeouts.push(timeout);
            }, requestTimeout);

            this.transmissionSimulationTimeouts.push(timeout);
        });
    }

    private receiveWeather(requestId: number, requestMetar: boolean, icaos: string[]): void {
        if (this.communicationInterface === ActiveCommunicationInterface.None || !this.poweredUp) {
            this.publisher.pub('receivedWeather', { requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedBuses, false);
        }

        let message = undefined;
        if (requestMetar === true) {
            message = new MetarMessage();
        } else {
            message = new TafMessage();
        }

        this.receiveWeatherData(requestMetar, icaos, 0, message)
            .then((code) => {
                this.simulateWeatherRequestResponse(
                    [code, message],
                    () => this.publisher.pub('requestSent', requestId, this.synchronizedBuses, false),
                ).then((data) => this.publisher.pub('receivedWeather', { requestId, response: data }, this.synchronizedBuses, false));
            });
    }

    private async isStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return HoppieConnector.isStationAvailable(callsign);
    }

    private sendMessage(requestId: number, message: AtsuMessage, force: boolean): void {
        if (this.communicationInterface === ActiveCommunicationInterface.None || !this.poweredUp) {
            this.publisher.pub('sendMessageResponse', { requestId, status: AtsuStatusCodes.ComFailed });
            return;
        }

        const transmissionTime = this.vdl.enqueueOutboundMessage(message);
        const timeout = setTimeout(() => {
            this.vdl.dequeueOutboundMessage(transmissionTime);
            if (message.Type < AtsuMessageType.AOC) {
                if (message.Network === AtsuMessageNetwork.FBW) {
                    NXApiConnector.sendTelexMessage(message).then((status) => {
                        this.publisher.pub('sendMessageResponse', { requestId, status });
                    });
                } else {
                    HoppieConnector.sendTelexMessage(message, force).then((status) => {
                        this.publisher.pub('sendMessageResponse', { requestId, status });
                    });
                }
            } else if (message.Type === AtsuMessageType.DCL) {
                HoppieConnector.sendTelexMessage(message, force).then((status) => {
                    this.publisher.pub('sendMessageResponse', { requestId, status });
                });
            } else if (message.Type < AtsuMessageType.ATC) {
                HoppieConnector.sendCpdlcMessage(message as CpdlcMessage, force).then((status) => {
                    this.publisher.pub('sendMessageResponse', { requestId, status });
                });
            } else {
                this.publisher.pub('sendMessageResponse', { requestId, status: AtsuStatusCodes.UnknownMessage });
            }

            this.removeTransmissionTimeout(timeout);
        }, transmissionTime);

        // register the transmission simulation for later management
        this.transmissionSimulationTimeouts.push(timeout);
    }

    private vhf3DatalinkStatus(): DatalinkStatusCode {
        if (!this.poweredUp) return DatalinkStatusCode.Inop;
        return this.vdl.vhf3.datalinkStatus;
    }

    private vhf3DatalinkMode(): DatalinkModeCode {
        if (!this.poweredUp) return DatalinkModeCode.None;
        return this.vdl.vhf3.datalinkMode;
    }

    private satcomDatalinkStatus(): DatalinkStatusCode {
        if (NXDataStore.get('MODEL_SATCOM_ENABLED') === '1') {
            return DatalinkStatusCode.DlkNotAvail;
        }
        return DatalinkStatusCode.NotInstalled;
    }
}
