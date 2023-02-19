//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
    AtisType,
    AtsuMessage,
    AtsuMessageType,
    AtsuStatusCodes,
    CpdlcMessage,
    DclMessage,
    FreetextMessage,
    OclMessage,
    WeatherMessage,
} from '@datalink/common';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export interface AtcAocRouterMessages {
    // streams to send several messages
    routerSendFreetextMessage: { requestId: number, message: FreetextMessage, force: boolean };
    routerSendCpdlcMessage: { requestId: number, message: CpdlcMessage, force: boolean };
    routerSendDclMessage: { requestId: number, message: DclMessage, force: boolean };
    routerSendOclMessage: { requestId: number, message: OclMessage, force: boolean };
    routerSendMessageResponse: { requestId: number, status: AtsuStatusCodes };

    // streams to request specific data
    routerRequestAtis: { requestId: number, icao: string, type: AtisType };
    routerRequestMetar: { requestId: number, icaos: string[] };
    routerRequestTaf: { requestId: number, icaos: string[] };
    routerRequestSent: number;
    routerReceivedWeather: { requestId: number, response: [AtsuStatusCodes, WeatherMessage] };
};

export interface RouterAtcAocMessages {
    // streams to read specific messages
    routerReceivedFreetextMessage: FreetextMessage;
    routerReceivedCpdlcMessage: CpdlcMessage;
}

export class AtcAocRouterBus {
    private requestId: number = 0;

    private publisher: Publisher<AtcAocRouterMessages>;

    private subscriber: EventSubscriber<AtcAocRouterMessages>;

    private sendMessageCallbacks: ((requestId: number, code: AtsuStatusCodes) => boolean)[] = [];

    private requestSentCallbacks: ((requestId: number) => boolean)[] = [];

    private weatherResponseCallbacks: ((requestId: number, response: [AtsuStatusCodes, WeatherMessage]) => boolean)[] = [];

    constructor(private readonly bus: EventBus, private readonly synchronized: boolean) {
        this.publisher = this.bus.getPublisher<AtcAocRouterMessages>();
        this.subscriber = this.bus.getSubscriber<AtcAocRouterMessages>();

        this.subscriber.on('routerSendMessageResponse').handle((response) => {
            this.sendMessageCallbacks.every((callback, index) => {
                if (callback(response.requestId, response.status)) {
                    this.sendMessageCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });

        this.subscriber.on('routerRequestSent').handle((response) => {
            this.requestSentCallbacks.every((callback, index) => {
                if (callback(response)) {
                    this.requestSentCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });

        this.subscriber.on('routerReceivedWeather').handle((response) => {
            this.weatherResponseCallbacks.every((callback, index) => {
                if (callback(response.requestId, response.response)) {
                    this.weatherResponseCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
    }

    private sendFreetextMessage(message: FreetextMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerSendFreetextMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendCpdlcMessage(message: CpdlcMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerSendCpdlcMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendDclMessage(message: DclMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerSendDclMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendOclMessage(message: OclMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerSendOclMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public sendMessage(message: AtsuMessage, force: boolean): Promise<AtsuStatusCodes> {
        switch (message.Type) {
        case AtsuMessageType.Freetext:
            return this.sendFreetextMessage(message as FreetextMessage, force);
        case AtsuMessageType.CPDLC:
            return this.sendCpdlcMessage(message as CpdlcMessage, force);
        case AtsuMessageType.DCL:
            return this.sendDclMessage(message as DclMessage, force);
        case AtsuMessageType.OCL:
            return this.sendOclMessage(message as OclMessage, force);
        default:
            return new Promise<AtsuStatusCodes>((resolve, _reject) => resolve(AtsuStatusCodes.UnknownMessage));
        }
    }

    public receiveAtis(icao: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerRequestAtis', { requestId, icao, type }, this.synchronized, false);
            this.requestSentCallbacks.push((id: number) => {
                if (id === requestId) sentCallback();
                return id === requestId;
            });
            this.weatherResponseCallbacks.push((id, response) => {
                if (id === requestId) resolve(response);
                return requestId === id;
            })
        });
    }

    public receiveMetar(icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerRequestMetar', { requestId, icaos }, this.synchronized, false);
            this.requestSentCallbacks.push((id: number) => {
                if (id === requestId) sentCallback();
                return id === requestId;
            });
            this.weatherResponseCallbacks.push((id, response) => {
                if (id === requestId) resolve(response);
                return requestId === id;
            })
        });
    }

    public receiveTaf(icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerRequestTaf', { requestId, icaos }, this.synchronized, false);
            this.requestSentCallbacks.push((id: number) => {
                if (id === requestId) sentCallback();
                return id === requestId;
            });
            this.weatherResponseCallbacks.push((id, response) => {
                if (id === requestId) resolve(response);
                return requestId === id;
            })
        });
    }
}

export type RouterOutpuBusCallbacks = {
    receivedFreetextMessage: (message: FreetextMessage) => void;
    receivedCpdlcMessage: (message: CpdlcMessage) => void;
}

export class RouterAtcAocBus {
    private subscriber: EventSubscriber<RouterAtcAocMessages>;

    private callbacks: RouterOutpuBusCallbacks = {
        receivedFreetextMessage: null,
        receivedCpdlcMessage: null,
    };

    constructor(private readonly bus: EventBus) {
        this.subscriber = this.bus.getSubscriber<RouterAtcAocMessages>();

        this.subscriber.on('routerReceivedFreetextMessage').handle((data) => {
            if (this.callbacks.receivedFreetextMessage !== null) {
                this.callbacks.receivedFreetextMessage(data);
            }
        });
        this.subscriber.on('routerReceivedCpdlcMessage').handle((data) => {
            if (this.callbacks.receivedCpdlcMessage !== null) {
                this.callbacks.receivedCpdlcMessage(data);
            }
        });
    }

    public addDataCallback<K extends keyof RouterOutpuBusCallbacks>(event: K, callback: RouterOutpuBusCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}
