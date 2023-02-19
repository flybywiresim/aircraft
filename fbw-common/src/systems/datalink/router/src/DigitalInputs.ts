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
} from '@datalink/common';
import { Arinc429Word } from '@shared/arinc429';
import { FmgcFlightPhase } from '@shared/flightphase';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';
import { AtcAocRouterMessages, FmsRouterBus } from './databus';

export type DigitalInputCallbacks = {
    sendFreetextMessage: (message: FreetextMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendCpdlcMessage: (message: CpdlcMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendDclMessage: (message: DclMessage, force: boolean) => Promise<AtsuStatusCodes>;
    sendOclMessage: (message: OclMessage, force: boolean) => Promise<AtsuStatusCodes>;
    requestAtis: (icao: string, type: AtisType, requestSent: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    requestWeather: (icaos: string[], metar: boolean, requestSent: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
}

export class DigitalInputs {
    private subscriber: EventSubscriber<AtcAocRouterMessages & FmgcDataBusTypes & RmpDataBusTypes> = null;

    private publisher: Publisher<AtcAocRouterMessages>;

    private poweredUp: boolean = false;

    private callbacks: DigitalInputCallbacks = {
        sendFreetextMessage: null,
        sendCpdlcMessage: null,
        sendDclMessage: null,
        sendOclMessage: null,
        requestAtis: null,
        requestWeather: null,
    };

    public FlightPhase: FmgcFlightPhase = FmgcFlightPhase.Preflight;

    public Vhf3Powered: boolean = false;

    public Vhf3DataMode: boolean = false;

    public readonly fmsBus: FmsRouterBus;

    private resetData(): void {
        this.FlightPhase = FmgcFlightPhase.Preflight;
        this.Vhf3Powered = false;
        this.Vhf3DataMode = false;
    }

    constructor(private readonly bus: EventBus, private readonly synchronizedAtc: boolean, private readonly synchronizedAoc: boolean) {
        this.resetData();
        this.fmsBus = new FmsRouterBus(this.bus);
    }

    public initialize(): void {
        this.fmsBus.initialize();

        this.subscriber = this.bus.getSubscriber<AtcAocRouterMessages & FmgcDataBusTypes & RmpDataBusTypes>();
        this.publisher = this.bus.getPublisher<AtcAocRouterMessages>();
    }

    public connectedCallback(): void {
        this.subscriber.on('routerSendFreetextMessage').handle((request) => {
            if (this.callbacks.sendFreetextMessage !== null) {
                this.callbacks.sendFreetextMessage(Conversion.messageDataToMessage(request.message) as FreetextMessage, request.force).then((status) => {
                    this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status }, this.synchronizedAoc, false);
                });
            } else {
                this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status: AtsuStatusCodes.ComFailed }, this.synchronizedAoc, false);
            }
        });
        this.subscriber.on('routerSendCpdlcMessage').handle((request) => {
            if (this.callbacks.sendCpdlcMessage !== null) {
                this.callbacks.sendCpdlcMessage(Conversion.messageDataToMessage(request.message) as CpdlcMessage, request.force).then((status) => {
                    this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status }, this.synchronizedAtc, false);
                });
            } else {
                this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status: AtsuStatusCodes.ComFailed }, this.synchronizedAtc, false);
            }
        });
        this.subscriber.on('routerSendDclMessage').handle((request) => {
            if (this.callbacks.sendDclMessage !== null) {
                this.callbacks.sendDclMessage(Conversion.messageDataToMessage(request.message) as DclMessage, request.force).then((status) => {
                    this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status }, this.synchronizedAtc, false);
                });
            } else {
                this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status: AtsuStatusCodes.ComFailed }, this.synchronizedAtc, false);
            }
        });
        this.subscriber.on('routerSendOclMessage').handle((request) => {
            if (this.callbacks.sendOclMessage !== null) {
                this.callbacks.sendOclMessage(Conversion.messageDataToMessage(request.message) as OclMessage, request.force).then((status) => {
                    this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status }, this.synchronizedAtc, false);
                });
            } else {
                this.publisher.pub('routerSendMessageResponse', { requestId: request.requestId, status: AtsuStatusCodes.ComFailed }, this.synchronizedAtc, false);
            }
        });
        this.subscriber.on('routerRequestAtis').handle((request) => {
            if (this.callbacks.requestAtis !== null) {
                const synchronized = this.synchronizedAoc || this.synchronizedAtc;
                this.callbacks.requestAtis(request.icao, request.type, () => this.publisher.pub('routerRequestSent', request.requestId, synchronized, false)).then((response) => {
                    this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response }, synchronized, false);
                });
            } else {
                this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedAtc, false);
            }
        });
        this.subscriber.on('routerRequestMetar').handle((request) => {
            if (this.callbacks.requestAtis !== null) {
                const synchronized = this.synchronizedAoc || this.synchronizedAtc;
                this.callbacks.requestWeather(request.icaos, true, () => this.publisher.pub('routerRequestSent', request.requestId, synchronized, false)).then((response) => {
                    this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response }, synchronized, false);
                });
            } else {
                this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedAtc, false);
            }
        });
        this.subscriber.on('routerRequestTaf').handle((request) => {
            if (this.callbacks.requestAtis !== null) {
                const synchronized = this.synchronizedAoc || this.synchronizedAtc;
                this.callbacks.requestWeather(request.icaos, false, () => this.publisher.pub('routerRequestSent', request.requestId, synchronized, false)).then((response) => {
                    this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response }, synchronized, false);
                });
            } else {
                this.publisher.pub('routerReceivedWeather', { requestId: request.requestId, response: [AtsuStatusCodes.ComFailed, null] }, this.synchronizedAtc, false);
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

    public addDataCallback<K extends keyof DigitalInputCallbacks>(event: K, callback: DigitalInputCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}
