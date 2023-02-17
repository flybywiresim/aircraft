import {
    AtsuStatusCodes,
    AtisType,
    AtsuMessage,
    AtsuMessageType,
    FreetextMessage,
    WeatherMessage,
} from '@atsu/common';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export interface AocFmsMessages {
    aocResetData: boolean;

    aocRequestSentToGround: number;
    aocWeatherResponse: { requestId: number; data: [AtsuStatusCodes, WeatherMessage] };

    aocSystemStatus: AtsuStatusCodes;
    aocTransmissionResponse: { requestId: number; status: AtsuStatusCodes };

    aocResynchronizeWeatherMessage: WeatherMessage;
    aocResynchronizeFreetextMessage: FreetextMessage;
    aocPrintMessage: AtsuMessage;
    aocDeleteMessage: number;
}

export interface FmsAocMessages {
    aocSendFreetextMessage: { message: FreetextMessage; requestId: number };
    aocRequestAtis: { icao: string; type: AtisType; requestId: number };
    aocRequestWeather: { icaos: string[]; requestMetar: boolean; requestId: number };
    aocRegisterWeatherMessages: WeatherMessage[];
    aocRegisterFreetextMessages: FreetextMessage[];
    aocMessageRead: number;
    aocRemoveMessage: number;
}

export type FmsAocBusCallbacks = {
    sendFreetextMessage: (message: FreetextMessage) => Promise<AtsuStatusCodes>;
    requestAtis: (icao: string, type: AtisType, sentCallback: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    requestWeather: (icaos: string[], requestMetar: boolean, sentCallback: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    registerMessages: (messages: AtsuMessage[]) => void;
    messageRead: (messageId: number) => void;
    removeMessage: (messageId: number) => void;
}

export class FmsAocBus {
    private readonly subscriber: EventSubscriber<FmsAocMessages>;

    private readonly publisher: Publisher<AocFmsMessages>;

    private callbacks: FmsAocBusCallbacks = {
        sendFreetextMessage: null,
        requestAtis: null,
        requestWeather: null,
        registerMessages: null,
        messageRead: null,
        removeMessage: null,
    };

    constructor(private readonly bus: EventBus) {
        this.subscriber = this.bus.getSubscriber<FmsAocMessages>();
        this.publisher = this.bus.getPublisher<AocFmsMessages>();
    }

    public initialize(): void {
        this.subscriber.on('aocSendFreetextMessage').handle((data) => {
            if (this.callbacks.sendFreetextMessage !== null) {
                this.callbacks.sendFreetextMessage(data.message).then((status) => {
                    this.publisher.pub('aocTransmissionResponse', { requestId: data.requestId, status }, true, false);
                });
            }
        });
        this.subscriber.on('aocRequestAtis').handle((data) => {
            if (this.callbacks.requestAtis !== null) {
                this.callbacks.requestAtis(data.icao, data.type, () => this.publisher.pub('aocRequestSentToGround', data.requestId, true, false)).then((response) => {
                    this.publisher.pub('aocWeatherResponse', { requestId: data.requestId, data: response }, true, false);
                });
            }
        });
        this.subscriber.on('aocRequestWeather').handle((data) => {
            if (this.callbacks.requestWeather !== null) {
                this.callbacks.requestWeather(data.icaos, data.requestMetar, () => this.publisher.pub('aocRequestSentToGround', data.requestId, true, false)).then((response) => {
                    this.publisher.pub('aocWeatherResponse', { requestId: data.requestId, data: response }, true, false);
                });
            }
        });
        this.subscriber.on('aocRegisterFreetextMessages').handle((messages) => {
            if (this.callbacks.registerMessages !== null) {
                this.callbacks.registerMessages(messages);
            }
        });
        this.subscriber.on('aocRegisterWeatherMessages').handle((messages) => {
            if (this.callbacks.registerMessages !== null) {
                this.callbacks.registerMessages(messages);
            }
        });
        this.subscriber.on('aocMessageRead').handle((messageId) => {
            if (this.callbacks.messageRead !== null) {
                this.callbacks.messageRead(messageId);
            }
        });
        this.subscriber.on('aocRemoveMessage').handle((messageId) => {
            if (this.callbacks.removeMessage !== null) {
                this.callbacks.removeMessage(messageId);
            }
        });
    }

    public addDataCallback<K extends keyof FmsAocBusCallbacks>(event: K, callback: FmsAocBusCallbacks[K]): void {
        this.callbacks[event] = callback;
    }
}

export class AocFmsBus {
    private readonly publisher: Publisher<AocFmsMessages>;

    constructor(private readonly bus: EventBus) {
        this.publisher = this.bus.getPublisher<AocFmsMessages>();
    }

    public powerDown(): void {
        this.publisher.pub('aocResetData', true, true, false);
    }

    public sendAtsuSystemStatus(status: AtsuStatusCodes): void {
        this.publisher.pub('aocSystemStatus', status, true, false);
    }

    public sendPrintMessage(message: AtsuMessage): void {
        this.publisher.pub('aocPrintMessage', message, true, false);
    }

    public deleteMessage(uid: number): void {
        this.publisher.pub('aocDeleteMessage', uid, true, false);
    }

    public resynchronizeAocMessage(message: AtsuMessage): void {
        if (message.Type === AtsuMessageType.Freetext) {
            this.publisher.pub('aocResynchronizeFreetextMessage', message as FreetextMessage, true, false);
        } else {
            this.publisher.pub('aocResynchronizeWeatherMessage', message as WeatherMessage, true, false);
        }
    }
}
