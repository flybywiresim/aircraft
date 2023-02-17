import {
    AtsuStatusCodes,
    FansMode,
    AtisMessage,
    AtisType,
    AtsuMessage,
    AtsuMessageType,
    Conversion,
    CpdlcMessage,
    DclMessage,
    OclMessage,
    PositionReportData,
    Waypoint,
} from '@atsu/common';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';

export interface FmsRouteData {
    lastWaypoint: Waypoint;
    activeWaypoint: Waypoint;
    nextWaypoint: Waypoint;
    destination: Waypoint;
}

export interface AtcFmsMessages {
    // data management control
    atcResetData: boolean;

    // responses from ATSU to FMS for requests
    atcGenericRequestResponse: number;
    atcRequestAtsuStatusCode: { requestId: number; code: AtsuStatusCodes };
    atcPositionReport: { requestId: number; data: PositionReportData };

    // requests from ATSU to FMS
    atcSystemStatus: AtsuStatusCodes;
    atcMessageModify: CpdlcMessage;
    atcPrintMessage: AtsuMessage;

    // synchronization stream from ATSU to FMS
    atcActiveAtisAutoUpdates: string[];
    atcAtisReports: AtisMessage[];
    atcPrintAtisReportsPrint: boolean;
    atcStationStatus: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean };
    atcMonitoredMessages: CpdlcMessage[];
    atcMaxUplinkDelay: number;
    atcAutomaticPositionReportActive: boolean;

    atcResynchronizeCpdlcMessage: CpdlcMessage;
    atcResynchronizeDclMessage: DclMessage;
    atcResynchronizeOclMessage: OclMessage;
    atcDeleteMessage: number;
}

export interface FmsAtcMessages {
    // flight plan synchronizations from FMS to ATC
    atcRouteData: FmsRouteData;

    // requests and synchronizations from FMS to ATC
    // expect 'atcRequestAtsuStatusCode' responses
    atcLogon: { station: string; requestId: number };
    atcLogoff: number;
    atcRequestAtis: { icao: string; type: AtisType; requestId: number };
    // expect 'atcGenericRequestResponse' responses
    atcActivateAtisAutoUpdate: { icao: string; type: AtisType; requestId: number };
    atcDeactivateAtisAutoUpdate: { icao: string; requestId: number };
    atcTogglePrintAtisReportsPrint: number;
    atcSetMaxUplinkDelay: { delay: number; requestId: number };
    atcToggleAutomaticPositionReport: number;
    // expect 'atcPositionReport' response
    atcRequestPositionReport: number;
    // fire & forget messages
    atcRegisterAtisMessages: AtisMessage[];
    atcRegisterCpdlcMessages: CpdlcMessage[];
    atcRegisterDclMessages: DclMessage[];
    atcRegisterOclMessages: OclMessage[];
    atcUpdateMessage: CpdlcMessage;
    atcMessageRead: number;
    atcRemoveMessage: number;
    atcCleanupMessages: boolean;
    atcResetAtisAutoUpdate: boolean;
}

export type FmsAtcBusCallbacks = {
    routeData: (route: FmsRouteData) => void;
    sendMessage: (message: AtsuMessage) => Promise<AtsuStatusCodes>;
    updateMessage: (message: AtsuMessage) => void;
    atcLogon: (station: string) => Promise<AtsuStatusCodes>;
    atcLogoff: () => Promise<AtsuStatusCodes>;
    activateAtisAutoUpdate: (data: { icao: string; type: AtisType }) => void;
    deactivateAtisAutoUpdate: (icao: string) => void;
    togglePrintAtisReportsPrint: () => void;
    setMaxUplinkDelay: (delay: number) => void;
    toggleAutomaticPositionReport: () => void;
    requestAtis: (icao: string, type: AtisType) => Promise<AtsuStatusCodes>;
    positionReportData: () => PositionReportData;
    registerMessages: (messages: AtsuMessage[]) => void;
    messageRead: (uid: number) => void;
    removeMessage: (uid: number) => void;
    cleanupMessages: () => void;
    resetAtisAutoUpdate: () => void;
}

export class FmsAtcBus {
    private readonly subscriber: EventSubscriber<FmsAtcMessages>;

    private readonly publisher: Publisher<AtcFmsMessages>;

    private callbacks: FmsAtcBusCallbacks = {
        routeData: null,
        sendMessage: null,
        updateMessage: null,
        atcLogon: null,
        atcLogoff: null,
        activateAtisAutoUpdate: null,
        deactivateAtisAutoUpdate: null,
        togglePrintAtisReportsPrint: null,
        setMaxUplinkDelay: null,
        toggleAutomaticPositionReport: null,
        requestAtis: null,
        positionReportData: null,
        registerMessages: null,
        messageRead: null,
        removeMessage: null,
        cleanupMessages: null,
        resetAtisAutoUpdate: null,
    };

    private async requestWithStatusResponse<T>(value: T, requestId: number, callback: (value: T) => Promise<AtsuStatusCodes>): Promise<void> {
        if (callback !== null) {
            callback(value).then((code) => {
                this.publisher.pub('atcRequestAtsuStatusCode', { requestId, code }, true, false);
            });
        }
    }

    private requestWithParameter<T>(value: T, requestId: number, callback: (value: T) => void): void {
        if (callback !== null) {
            callback(value);
            this.publisher.pub('atcGenericRequestResponse', requestId, true, false);
        }
    }

    private requestWithoutParameter(requestId: number, callback: () => void): void {
        if (callback !== null) {
            callback();
            this.publisher.pub('atcGenericRequestResponse', requestId, true, false);
        }
    }

    private fireAndForgetWithParameter<T>(value: T, callback: (value: T) => void): void {
        if (callback !== null) callback(value);
    }

    private fireAndForgetWithoutParameter(callback: () => void): void {
        if (callback !== null) callback();
    }

    private static enhanceReceivedMessages<T extends AtsuMessage>(messages: T[]): T[] {
        const enhancedMessages = [];

        messages.forEach((message) => enhancedMessages.push(Conversion.messageDataToMessage(message)));

        return enhancedMessages;
    }

    constructor(private readonly bus: EventBus) {
        this.subscriber = this.bus.getSubscriber<FmsAtcMessages>();
        this.publisher = this.bus.getPublisher<AtcFmsMessages>();
    }

    public initialize(): void {
        this.subscriber.on('atcLogon').handle((data) => this.requestWithStatusResponse(data.station, data.requestId, this.callbacks.atcLogon));
        this.subscriber.on('atcLogoff').handle((data) => {
            if (this.callbacks.atcLogoff !== null) {
                this.callbacks.atcLogoff().then((code) => {
                    this.publisher.pub('atcRequestAtsuStatusCode', { requestId: data, code }, true, false);
                });
            }
        });
        this.subscriber.on('atcActivateAtisAutoUpdate').handle((data) => this.requestWithParameter(data, data.requestId, this.callbacks.activateAtisAutoUpdate));
        this.subscriber.on('atcDeactivateAtisAutoUpdate').handle((data) => this.requestWithParameter(data.icao, data.requestId, this.callbacks.deactivateAtisAutoUpdate));
        this.subscriber.on('atcTogglePrintAtisReportsPrint').handle((data) => this.requestWithoutParameter(data, this.callbacks.togglePrintAtisReportsPrint));
        this.subscriber.on('atcSetMaxUplinkDelay').handle((data) => this.requestWithParameter(data.delay, data.requestId, this.callbacks.setMaxUplinkDelay));
        this.subscriber.on('atcToggleAutomaticPositionReport').handle((data) => this.requestWithoutParameter(data, this.callbacks.toggleAutomaticPositionReport));
        this.subscriber.on('atcRequestAtis').handle((data) => {
            if (this.callbacks.requestAtis !== null) {
                this.callbacks.requestAtis(data.icao, data.type).then((code) => this.publisher.pub('atcRequestAtsuStatusCode', { code, requestId: data.requestId }, true, false));
            }
        });
        this.subscriber.on('atcRequestPositionReport').handle((data) => {
            if (this.callbacks.positionReportData !== null) {
                this.publisher.pub('atcPositionReport', { requestId: data, data: this.callbacks.positionReportData() }, true, false);
            }
        });
        this.subscriber.on('atcRegisterAtisMessages').handle((data) => this.fireAndForgetWithParameter(FmsAtcBus.enhanceReceivedMessages(data), this.callbacks.registerMessages));
        this.subscriber.on('atcRegisterCpdlcMessages').handle((data) => this.fireAndForgetWithParameter(FmsAtcBus.enhanceReceivedMessages(data), this.callbacks.registerMessages));
        this.subscriber.on('atcRegisterDclMessages').handle((data) => this.fireAndForgetWithParameter(FmsAtcBus.enhanceReceivedMessages(data), this.callbacks.registerMessages));
        this.subscriber.on('atcRegisterOclMessages').handle((data) => this.fireAndForgetWithParameter(FmsAtcBus.enhanceReceivedMessages(data), this.callbacks.registerMessages));
        this.subscriber.on('atcUpdateMessage').handle((data) => this.fireAndForgetWithParameter(Conversion.messageDataToMessage(data), this.callbacks.updateMessage));
        this.subscriber.on('atcMessageRead').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.messageRead));
        this.subscriber.on('atcRemoveMessage').handle((data) => this.fireAndForgetWithParameter(data, this.callbacks.removeMessage));
        this.subscriber.on('atcCleanupMessages').handle(() => this.fireAndForgetWithoutParameter(this.callbacks.cleanupMessages));
        this.subscriber.on('atcResetAtisAutoUpdate').handle(() => this.fireAndForgetWithoutParameter(this.callbacks.resetAtisAutoUpdate));
    }

    public addDataCallback<K extends keyof FmsAtcBusCallbacks>(event: K, callback: FmsAtcBusCallbacks[K]): void {
        this.callbacks[event] = callback;
    }

    public newRouteDataReceived(route: FmsRouteData): void {
        if (this.callbacks.routeData !== null) {
            this.callbacks.routeData(route);
        }
    }
}

export class AtcFmsBus {
    private readonly publisher: Publisher<AtcFmsMessages>;

    constructor(private readonly bus: EventBus) {
        this.publisher = this.bus.getPublisher<AtcFmsMessages>();
    }

    public powerDown(): void {
        this.publisher.pub('atcResetData', true, true, false);
    }

    public sendSystemStatus(status: AtsuStatusCodes): void {
        this.publisher.pub('atcSystemStatus', status, true, false);
    }

    public sendMessageModify(message: CpdlcMessage): void {
        this.publisher.pub('atcMessageModify', message, true, false);
    }

    public sendPrintMessage(message: AtsuMessage): void {
        this.publisher.pub('atcPrintMessage', message, true, false);
    }

    public sendActiveAtisAutoUpdates(icaos: string[]): void {
        this.publisher.pub('atcActiveAtisAutoUpdates', icaos, true, false);
    }

    public sendAtcAtisReports(reports: AtisMessage[]): void {
        this.publisher.pub('atcAtisReports', reports, true, false);
    }

    public sendPrintAtisReportsPrint(active: boolean): void {
        this.publisher.pub('atcPrintAtisReportsPrint', active, true, false);
    }

    public sendAtcConnectionStatus(status: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean }): void {
        this.publisher.pub('atcStationStatus', status, true, false);
    }

    public sendMonitoredMessages(messages: CpdlcMessage[]): void {
        this.publisher.pub('atcMonitoredMessages', messages, true, false);
    }

    public sendMaxUplinkDelay(delay: number): void {
        this.publisher.pub('atcMaxUplinkDelay', delay, true, false);
    }

    public sendAutomaticPositionReportActive(active: boolean): void {
        this.publisher.pub('atcAutomaticPositionReportActive', active, true, false);
    }

    public deleteMessage(uid: number): void {
        this.publisher.pub('atcDeleteMessage', uid, true, false);
    }

    public resynchronizeAtcMessage(message: CpdlcMessage): void {
        if (message.Type === AtsuMessageType.DCL) {
            this.publisher.pub('atcResynchronizeDclMessage', message as DclMessage, true, false);
        } else if (message.Type === AtsuMessageType.OCL) {
            this.publisher.pub('atcResynchronizeOclMessage', message as OclMessage, true, false);
        } else {
            this.publisher.pub('atcResynchronizeCpdlcMessage', message, true, false);
        }
    }
}
