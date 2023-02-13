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
} from '@atsu/common';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export interface DatalinkMessages {
    // general management messages
    connect: { requestId: number, callsign: string };
    disconnect: number;
    requestStationAvailable: { requestId: number, callsign: string };
    managementResponse: { requestId: number, status: AtsuStatusCodes };

    // streams to send several messages
    sendFreetextMessage: { requestId: number, message: FreetextMessage, force: boolean };
    sendCpdlcMessage: { requestId: number, message: CpdlcMessage, force: boolean };
    sendDclMessage: { requestId: number, message: DclMessage, force: boolean };
    sendOclMessage: { requestId: number, message: OclMessage, force: boolean };
    sendMessageResponse: { requestId: number, status: AtsuStatusCodes };

    // streams to request specific data
    requestAtis: { requestId: number, icao: string, type: AtisType };
    requestMetar: { requestId: number, icaos: string[] };
    requestTaf: { requestId: number, icaos: string[] };
    requestSent: number;
    receivedWeather: { requestId: number, response: [AtsuStatusCodes, WeatherMessage] };

    // streams to read specific messages
    receivedFreetextMessage: FreetextMessage;
    receivedCpdlcMessage: CpdlcMessage;
};

export class DatalinkInputBus {
    private requestId: number = 0;

    private publisher: Publisher<DatalinkMessages>;

    private subscriber: EventSubscriber<DatalinkMessages>;

    private managementCallbacks: ((requestId: number, code: AtsuStatusCodes) => boolean)[] = [];

    private sendMessageCallbacks: ((requestId: number, code: AtsuStatusCodes) => boolean)[] = [];

    private requestSentCallbacks: ((requestId: number) => boolean)[] = [];

    private weatherResponseCallbacks: ((requestId: number, response: [AtsuStatusCodes, WeatherMessage]) => boolean)[] = [];

    constructor(private readonly bus: EventBus, private readonly synchronized: boolean) {
        this.publisher = this.bus.getPublisher<DatalinkMessages>();
        this.subscriber = this.bus.getSubscriber<DatalinkMessages>();

        this.subscriber.on('managementResponse').handle((response) => {
            this.managementCallbacks.every((callback, index) => {
                if (callback(response.requestId, response.status)) {
                    this.managementCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });

        this.subscriber.on('sendMessageResponse').handle((response) => {
            this.sendMessageCallbacks.every((callback, index) => {
                if (callback(response.requestId, response.status)) {
                    this.sendMessageCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });

        this.subscriber.on('requestSent').handle((response) => {
            this.requestSentCallbacks.every((callback, index) => {
                if (callback(response)) {
                    this.requestSentCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });

        this.subscriber.on('receivedWeather').handle((response) => {
            this.weatherResponseCallbacks.every((callback, index) => {
                if (callback(response.requestId, response.response)) {
                    this.weatherResponseCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
    }

    public connect(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('connect', { requestId, callsign }, this.synchronized, false);
            this.managementCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public disconnect(): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('disconnect', requestId, this.synchronized, false);
            this.managementCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public isStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestStationAvailable', { requestId, callsign }, this.synchronized, false);
            this.managementCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendFreetextMessage(message: FreetextMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('sendFreetextMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendCpdlcMessage(message: CpdlcMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('sendCpdlcMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendDclMessage(message: DclMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('sendDclMessage', { requestId, message, force }, this.synchronized, false);
            this.sendMessageCallbacks.push((id: number, code: AtsuStatusCodes) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    private sendOclMessage(message: OclMessage, force: boolean): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('sendOclMessage', { requestId, message, force }, this.synchronized, false);
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
            this.publisher.pub('requestAtis', { requestId, icao, type }, this.synchronized, false);
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
            this.publisher.pub('requestMetar', { requestId, icaos }, this.synchronized, false);
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
            this.publisher.pub('requestTaf', { requestId, icaos }, this.synchronized, false);
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

export type DatalinkOutpuBusCallbacks = {
    receivedFreetextMessage: (message: FreetextMessage) => void;
    receivedCpdlcMessage: (message: CpdlcMessage) => void;
}

export class DatalinkOutputBus {
    private subscriber: EventSubscriber<DatalinkMessages>;

    private callbacks: DatalinkOutpuBusCallbacks = {
        receivedFreetextMessage: null,
        receivedCpdlcMessage: null,
    };

    constructor(private readonly bus: EventBus, private readonly synchronized: boolean) {
        this.subscriber = this.bus.getSubscriber<DatalinkMessages>();

        this.subscriber.on('receivedFreetextMessage').handle((data) => {
            if (this.callbacks.receivedFreetextMessage !== null) {
                this.callbacks.receivedFreetextMessage(data);
            }
        });
        this.subscriber.on('receivedCpdlcMessage').handle((data) => {
            if (this.callbacks.receivedCpdlcMessage !== null) {
                this.callbacks.receivedCpdlcMessage(data);
            }
        });
    }

    public addDataCallback<K extends keyof DatalinkOutpuBusCallbacks>(event: K, callback: DatalinkOutpuBusCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}
