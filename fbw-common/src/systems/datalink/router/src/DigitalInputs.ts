//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
    AtisType,
    AtsuStatusCodes,
    CpdlcMessage,
    DclMessage,
    FmgcDataBusTypes,
    FreetextMessage,
    OclMessage,
    WeatherMessage,
    RmpDataBusTypes,
    Conversion,
    FlightPlanMessage,
    NotamMessage,
    FlightPerformanceMessage,
    AtsuMessage,
    FlightWeightsMessage,
    FlightFuelMessage,
    OutOffOnInMessage,
} from '@datalink/common';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, EventSubscriber, Publisher } from '@microsoft/msfs-sdk';
import { AtcAocRouterMessages, DatalinkRouterMessages, RouterAtcAocMessages, RouterDatalinkMessages } from './databus';
import { NXApiConnector } from './webinterfaces/NXApiConnector';

export type RouterDigitalInputCallbacks = {
    sendFreetextMessage: (message: FreetextMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendCpdlcMessage: (message: CpdlcMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendDclMessage: (message: DclMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendOclMessage: (message: OclMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendOooiMessage: (message: OutOffOnInMessage, force: boolean) => Promise<AtsuStatusCodes>;
    requestFlightPlan: (requestSent: () => void) => Promise<[AtsuStatusCodes, FlightPlanMessage]>;
    requestNotams: (requestSent: () => void) => Promise<[AtsuStatusCodes, NotamMessage[]]>;
    requestPerformance: (requestSent: () => void) => Promise<[AtsuStatusCodes, FlightPerformanceMessage]>;
    requestFuel: (requestSent: () => void) => Promise<[AtsuStatusCodes, FlightFuelMessage]>;
    requestWeights: (requestSent: () => void) => Promise<[AtsuStatusCodes, FlightWeightsMessage]>;
    requestAtis: (icao: string, type: AtisType, requestSent: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    requestWeather: (icaos: string[], metar: boolean, requestSent: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    connect: (callsign: string) => Promise<AtsuStatusCodes>;
    disconnect: () => Promise<AtsuStatusCodes>;
    stationAvailable: (callsign: string) => Promise<AtsuStatusCodes>;
}

export class DigitalInputs {
    private subscriber: EventSubscriber<AtcAocRouterMessages & FmgcDataBusTypes & DatalinkRouterMessages & RmpDataBusTypes> = null;

    private publisher: Publisher<RouterDatalinkMessages & RouterAtcAocMessages>;

    private poweredUp: boolean = false;

    private callbacks: RouterDigitalInputCallbacks = {
        sendFreetextMessage: null,
        sendCpdlcMessage: null,
        sendDclMessage: null,
        sendOclMessage: null,
        sendOooiMessage: null,
        requestFlightPlan: null,
        requestNotams: null,
        requestPerformance: null,
        requestFuel: null,
        requestWeights: null,
        requestAtis: null,
        requestWeather: null,
        connect: null,
        disconnect: null,
        stationAvailable: null,
    };

    public FlightPhase: FmgcFlightPhase = FmgcFlightPhase.Preflight;

    public Vhf3Powered: boolean = false;

    public Vhf3DataMode: boolean = false;

    private resetData(): void {
        this.FlightPhase = FmgcFlightPhase.Preflight;
        this.Vhf3Powered = false;
        this.Vhf3DataMode = false;
    }

    constructor(private readonly bus: EventBus, private readonly synchronizedAtc: boolean, private readonly synchronizedAoc: boolean) {
        this.resetData();
    }

    public initialize(): void {
        this.subscriber = this.bus.getSubscriber<AtcAocRouterMessages & FmgcDataBusTypes & DatalinkRouterMessages & RmpDataBusTypes>();
        this.publisher = this.bus.getPublisher<RouterDatalinkMessages & RouterAtcAocMessages>();
    }

    private sendMessage<Type extends AtsuMessage>(requestId: number, message: Type, force: boolean, sendFunction: (Type, boolean) => Promise<AtsuStatusCodes>): void {
        if (sendFunction !== null) {
            sendFunction(Conversion.messageDataToMessage(message) as FreetextMessage, force).then((status) => {
                this.publisher.pub('routerSendMessageResponse', { requestId, status }, this.synchronizedAoc, false);
            });
        } else {
            this.publisher.pub('routerSendMessageResponse', { requestId, status: AtsuStatusCodes.ComFailed }, this.synchronizedAoc, false);
        }
    }

    private requestData(
        requestId: number,
        publisherName: 'routerReceivedFlightplan' | 'routerReceivedNotams' | 'routerReceivedPerformance' | 'routerReceivedFuel' | 'routerReceivedWeights',
        requestFunction: (requestSent: () => void) => Promise<[AtsuStatusCodes, any]>,
    ): void {
        if (requestFunction !== null) {
            requestFunction(() => this.publisher.pub('routerRequestSent', requestId, this.synchronizedAoc, false)).then((response) => {
                this.publisher.pub(publisherName, { requestId, response }, this.synchronizedAoc, false);
            });
        } else {
            this.publisher.pub(publisherName, { requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedAoc, false);
        }
    }

    private requestWeatherData(icaos: string[], metar: boolean, requestId: number): void {
        if (this.callbacks.requestWeather !== null) {
            const synchronized = this.synchronizedAoc || this.synchronizedAtc;
            this.callbacks.requestWeather(icaos, metar, () => this.publisher.pub('routerRequestSent', requestId, synchronized, false)).then((response) => {
                this.publisher.pub('routerReceivedWeather', { requestId, response }, synchronized, false);
            });
        } else {
            this.publisher.pub('routerReceivedWeather', { requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedAtc, false);
        }
    }

    public connectedCallback(): void {
        this.subscriber.on('routerUpdateFromTo').handle((data) => NXApiConnector.updateFromTo(data.from, data.to));
        this.subscriber.on('routerSendFreetextMessage').handle(async (request) => {
            this.sendMessage(request.requestId, request.message, request.force, this.callbacks.sendFreetextMessage);
        });
        this.subscriber.on('routerSendCpdlcMessage').handle(async (request) => {
            this.sendMessage(request.requestId, request.message, request.force, this.callbacks.sendCpdlcMessage);
        });
        this.subscriber.on('routerSendDclMessage').handle(async (request) => {
            this.sendMessage(request.requestId, request.message, request.force, this.callbacks.sendDclMessage);
        });
        this.subscriber.on('routerSendOclMessage').handle(async (request) => {
            this.sendMessage(request.requestId, request.message, request.force, this.callbacks.sendOclMessage);
        });
        this.subscriber.on('routerSendOooiMessage').handle(async (request) => {
            this.sendMessage(request.requestId, request.message, request.force, this.callbacks.sendOooiMessage);
        });
        this.subscriber.on('routerRequestFlightplan').handle(async (request) => {
            this.requestData(request.requestId, 'routerReceivedFlightplan', this.callbacks.requestFlightPlan);
        });
        this.subscriber.on('routerRequestNotams').handle(async (request) => {
            this.requestData(request.requestId, 'routerReceivedNotams', this.callbacks.requestNotams);
        });
        this.subscriber.on('routerRequestPerformance').handle(async (request) => {
            this.requestData(request.requestId, 'routerReceivedPerformance', this.callbacks.requestPerformance);
        });
        this.subscriber.on('routerRequestFuel').handle(async (request) => {
            this.requestData(request.requestId, 'routerReceivedFuel', this.callbacks.requestFuel);
        });
        this.subscriber.on('routerRequestWeights').handle(async (request) => {
            this.requestData(request.requestId, 'routerReceivedWeights', this.callbacks.requestWeights);
        });
        this.subscriber.on('routerRequestAtis').handle(async (request) => {
            if (this.callbacks.requestAtis !== null) {
                const synchronized = this.synchronizedAoc || this.synchronizedAtc;
                this.callbacks.requestAtis(request.icao, request.type, () => this.publisher.pub('routerRequestSent', request.requestId, synchronized, false)).then((response) => {
                    this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response }, synchronized, false);
                });
            } else {
                this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedAtc, false);
            }
        });
        this.subscriber.on('routerRequestMetar').handle(async (request) => {
            this.requestWeatherData(request.icaos, true, request.requestId);
        });
        this.subscriber.on('routerRequestTaf').handle(async (request) => {
            this.requestWeatherData(request.icaos, false, request.requestId);
        });
        this.subscriber.on('routerConnect').handle(async (data) => {
            if (this.callbacks.connect !== null) {
                this.callbacks.connect(data.callsign).then((code) => {
                    this.publisher.pub('routerManagementResponse', { requestId: data.requestId, status: code }, true, false);
                });
            } else {
                this.publisher.pub('routerManagementResponse', { requestId: data.requestId, status: AtsuStatusCodes.ComFailed }, true, false);
            }
        });
        this.subscriber.on('routerDisconnect').handle(async (data) => {
            if (this.callbacks.disconnect !== null) {
                this.callbacks.disconnect().then((code) => {
                    this.publisher.pub('routerManagementResponse', { requestId: data, status: code }, true, false);
                });
            } else {
                this.publisher.pub('routerManagementResponse', { requestId: data, status: AtsuStatusCodes.ComFailed }, true, false);
            }
        });
        this.subscriber.on('routerRequestStationAvailable').handle(async (data) => {
            if (this.callbacks.stationAvailable !== null) {
                this.callbacks.stationAvailable(data.callsign).then((code) => {
                    this.publisher.pub('routerManagementResponse', { requestId: data.requestId, status: code }, true, false);
                });
            } else {
                this.publisher.pub('routerManagementResponse', { requestId: data.requestId, status: AtsuStatusCodes.ComFailed }, true, false);
            }
        });
        this.subscriber.on('flightPhase').handle((phase: Arinc429Word) => {
            if (this.poweredUp) {
                if (phase.isNormalOperation()) {
                    this.FlightPhase = phase.value as FmgcFlightPhase;
                } else {
                    this.FlightPhase = FmgcFlightPhase.Preflight;
                }
            }
        });
        this.subscriber.on('vhf3Powered').handle((powered: boolean) => this.Vhf3Powered = powered);
        this.subscriber.on('vhf3DataMode').handle((dataMode: boolean) => this.Vhf3DataMode = dataMode);
    }

    public powerUp(): void {
        this.poweredUp = true;
    }

    public powerDown(): void {
        this.poweredUp = false;
        this.resetData();
    }

    public addDataCallback<K extends keyof RouterDigitalInputCallbacks>(event: K, callback: RouterDigitalInputCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}
