import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import { AtsuFmsMessages, FmsRouteData } from '@atsu/common/databus';
import { FansMode } from '@atsu/common/index';
import { AtisMessage, AtisType, AtsuMessage, CpdlcMessage, FreetextMessage, WeatherMessage } from '@atsu/common/messages';
import { PositionReportData } from '@atsu/common/types';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export type FmsBusCallbacks = {
    routeData: (route: FmsRouteData) => void;
    sendMessage: (message: AtsuMessage) => Promise<AtsuStatusCodes>;
    updateMessage: (message: AtsuMessage) => void;
    remoteStationAvailable: (station: string) => Promise<AtsuStatusCodes>;
    atcLogon: (station: string) => Promise<AtsuStatusCodes>;
    atcLogoff: () => Promise<AtsuStatusCodes>;
    connectToNetworks: (callsign: string) => Promise<AtsuStatusCodes>;
    activateAtisAutoUpdate: (data: { icao: string; type: AtisType }) => void;
    deactivateAtisAutoUpdate: (icao: string) => void;
    togglePrintAtisReportsPrint: () => void;
    setMaxUplinkDelay: (delay: number) => void;
    toggleAutomaticPositionReport: () => void;
    requestAocAtis: (icao: string, type: AtisType, sentCallback: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    requestAtcAtis: (icao: string, type: AtisType) => Promise<AtsuStatusCodes>;
    requestWeather: (icaos: string[], requestMetar: boolean, sentCallback: () => void) => Promise<[AtsuStatusCodes, WeatherMessage]>;
    positionReportData: () => PositionReportData;
    registerMessages: (messages: AtsuMessage[]) => void;
    messageRead: (uid: number) => void;
    removeMessage: (uid: number) => void;
    cleanupAtcMessages: () => void;
    resetAtisAutoUpdate: () => void;
}

export class FmsInputBus {
    private readonly subscriber: EventSubscriber<AtsuFmsMessages>;

    private readonly publisher: Publisher<AtsuFmsMessages>;

    private callbacks: FmsBusCallbacks = {
        routeData: null,
        sendMessage: null,
        updateMessage: null,
        remoteStationAvailable: null,
        atcLogon: null,
        atcLogoff: null,
        connectToNetworks: null,
        activateAtisAutoUpdate: null,
        deactivateAtisAutoUpdate: null,
        togglePrintAtisReportsPrint: null,
        setMaxUplinkDelay: null,
        toggleAutomaticPositionReport: null,
        requestAocAtis: null,
        requestAtcAtis: null,
        requestWeather: null,
        positionReportData: null,
        registerMessages: null,
        messageRead: null,
        removeMessage: null,
        cleanupAtcMessages: null,
        resetAtisAutoUpdate: null,
    };

    private async requestWithStatusResponse<T>(value: T, requestId: number, callback: (value: T) => Promise<AtsuStatusCodes>): Promise<void> {
        if (callback !== null) {
            callback(value).then((code) => {
                this.publisher.pub('requestAtsuStatusCode', { requestId, code }, true, false);
            });
        }
    }

    private requestWithParameter<T>(value: T, requestId: number, callback: (value: T) => void): void {
        if (callback !== null) {
            callback(value);
            this.publisher.pub('genericRequestResponse', requestId, true, false);
        }
    }

    private requestWithoutParameter(requestId: number, callback: () => void): void {
        if (callback !== null) {
            callback();
            this.publisher.pub('genericRequestResponse', requestId, true, false);
        }
    }

    private fireAndForgetWithParameter<T>(value: T, callback: (value: T) => void): void {
        if (callback !== null) callback(value);
    }

    private fireAndForgetWithoutParameter(callback: () => void): void {
        if (callback !== null) callback();
    }

    constructor(private readonly bus: EventBus) {
        this.subscriber = this.bus.getSubscriber<AtsuFmsMessages>();
        this.publisher = this.bus.getPublisher<AtsuFmsMessages>();
    }

    public initialize(): void {
        this.subscriber.on('sendFreetextMessage').handle((data) => {
            if (this.callbacks.sendMessage !== null) {
                this.callbacks.sendMessage(data.message).then((code) => {
                    this.publisher.pub('requestAtsuStatusCode', { requestId: data.requestId, code }, true, false);
                });
            }
        });
        this.subscriber.on('remoteStationAvailable').handle((data) => this.requestWithStatusResponse(data.station, data.requestId, this.callbacks.remoteStationAvailable));
        this.subscriber.on('atcLogon').handle((data) => this.requestWithStatusResponse(data.station, data.requestId, this.callbacks.atcLogon));
        this.subscriber.on('atcLogoff').handle((data) => {
            if (this.callbacks.atcLogoff !== null) {
                this.callbacks.atcLogoff().then((code) => {
                    this.publisher.pub('requestAtsuStatusCode', { requestId: data, code }, true, false);
                });
            }
        });
        this.subscriber.on('connectToNetworks').handle((data) => this.requestWithStatusResponse(data.callsign, data.requestId, this.callbacks.connectToNetworks));
        this.subscriber.on('activateAtisAutoUpdate').handle((data) => this.requestWithParameter(data, data.requestId, this.callbacks.activateAtisAutoUpdate));
        this.subscriber.on('deactivateAtisAutoUpdate').handle((data) => this.requestWithParameter(data.icao, data.requestId, this.callbacks.deactivateAtisAutoUpdate));
        this.subscriber.on('togglePrintAtisReportsPrint').handle((data) => this.requestWithoutParameter(data, this.callbacks.togglePrintAtisReportsPrint));
        this.subscriber.on('setMaxUplinkDelay').handle((data) => this.requestWithParameter(data.delay, data.requestId, this.callbacks.setMaxUplinkDelay));
        this.subscriber.on('toggleAutomaticPositionReport').handle((data) => this.requestWithoutParameter(data, this.callbacks.toggleAutomaticPositionReport));
        this.subscriber.on('requestAocAtis').handle((data) => {
            if (this.callbacks.requestAocAtis !== null) {
                this.callbacks.requestAocAtis(data.icao, data.type, () => this.publisher.pub('requestSentToGround', data.requestId, true, false)).then((response) => {
                    this.publisher.pub('weatherResponse', { requestId: data.requestId, data: response }, true, false);
                });
            }
        });
        this.subscriber.on('requestAtcAtis').handle((data) => {
            if (this.callbacks.requestAtcAtis !== null) {
                this.callbacks.requestAtcAtis(data.icao, data.type).then((code) => this.publisher.pub('requestAtsuStatusCode', { code, requestId: data.requestId }, true, false));
            }
        });
        this.subscriber.on('requestWeather').handle((data) => {
            if (this.callbacks.requestWeather !== null) {
                this.callbacks.requestWeather(data.icaos, data.requestMetar, () => this.publisher.pub('requestSentToGround', data.requestId, true, false)).then((response) => {
                    this.publisher.pub('weatherResponse', { requestId: data.requestId, data: response }, true, false);
                });
            }
        });
        this.subscriber.on('requestPositionReport').handle((data) => {
            if (this.callbacks.positionReportData !== null) {
                this.publisher.pub('positionReport', { requestId: data, data: this.callbacks.positionReportData() }, true, false);
            }
        });
        this.subscriber.on('registerAtisMessages').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.registerMessages));
        this.subscriber.on('registerCpdlcMessages').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.registerMessages));
        this.subscriber.on('registerDclMessages').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.registerMessages));
        this.subscriber.on('registerOclMessages').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.registerMessages));
        this.subscriber.on('registerWeatherMessages').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.registerMessages));
        this.subscriber.on('updateMessage').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.updateMessage));
        this.subscriber.on('messageRead').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.messageRead));
        this.subscriber.on('removeMessage').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.removeMessage));
        this.subscriber.on('cleanupAtcMessages').handle(() => this.fireAndForgetWithoutParameter(this.callbacks.cleanupAtcMessages));
        this.subscriber.on('resetAtisAutoUpdate').handle(() => this.fireAndForgetWithoutParameter(this.callbacks.resetAtisAutoUpdate));
    }

    public addDataCallback<K extends keyof FmsBusCallbacks>(event: K, callback: FmsBusCallbacks[K]): void {
        this.callbacks[event] = callback;
    }

    public newRouteDataReceived(route: FmsRouteData): void {
        if (this.callbacks.routeData !== null) {
            this.callbacks.routeData(route);
        }
    }
}

export class FmsOutputBus {
    private readonly publisher: Publisher<AtsuFmsMessages>;

    constructor(private readonly bus: EventBus) {
        this.publisher = this.bus.getPublisher<AtsuFmsMessages>();
    }

    public sendAtsuSystemStatus(status: AtsuStatusCodes): void {
        this.publisher.pub('atsuSystemStatus', status, true, false);
    }

    public sendMessageModify(message: CpdlcMessage): void {
        this.publisher.pub('messageModify', message, true, false);
    }

    public sendPrintMessage(message: AtsuMessage): void {
        this.publisher.pub('printMessage', message, true, false);
    }

    public sendActiveAtisAutoUpdates(icaos: string[]): void {
        this.publisher.pub('activeAtisAutoUpdates', icaos, true, false);
    }

    public sendAtcAtisReports(reports: Map<string, AtisMessage[]>): void {
        this.publisher.pub('atcAtisReports', reports, true, false);
    }

    public sendPrintAtisReportsPrint(active: boolean): void {
        this.publisher.pub('printAtisReportsPrint', active, true, false);
    }

    public sendAtcConnectionStatus(status: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean }): void {
        this.publisher.pub('atcStationStatus', status, true, false);
    }

    public sendMonitoredMessages(messages: CpdlcMessage[]): void {
        this.publisher.pub('monitoredMessages', messages, true, false);
    }

    public sendMaxUplinkDelay(delay: number): void {
        this.publisher.pub('maxUplinkDelay', delay, true, false);
    }

    public sendAutomaticPositionReportActive(active: boolean): void {
        this.publisher.pub('automaticPositionReportActive', active, true, false);
    }

    public deleteMessage(uid: number): void {
        this.publisher.pub('deleteMessage', uid);
    }

    public resynchronizeFreetextMessage(message: FreetextMessage): void {
        this.publisher.pub('resynchronizeFreetextMessage', message);
    }

    public resynchronizeCpdlcMessage(message: CpdlcMessage): void {
        this.publisher.pub('resynchronizeCpdlcMessage', message);
    }
}
