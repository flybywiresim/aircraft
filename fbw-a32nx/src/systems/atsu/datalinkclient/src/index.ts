//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AocDatalinkMessages, DatalinkAocMessages } from '@datalink/aoc';
import { AtcDatalinkMessages, DatalinkAtcMessages } from '@datalink/atc';
import {
    AtsuStatusCodes,
    FansMode,
    AtisMessage,
    AtisType,
    AtsuMessage,
    AtsuMessageSerializationFormat,
    AtsuMessageType,
    CpdlcMessage,
    DclMessage,
    FreetextMessage,
    OclMessage,
    WeatherMessage,
    AutopilotData,
    DatalinkModeCode,
    DatalinkStatusCode,
    EnvironmentData,
    FlightStateData,
    PositionReportData,
    DatalinkCommunicationSystems,
    FlightFuelMessage,
    FlightWeightsMessage,
    FlightPlanMessage,
} from '@datalink/common';
import { DatalinkRouterMessages, RouterDatalinkMessages } from '@datalink/router';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanManager } from '@fmgc/index';
import { EventBus, EventSubscriber, Publisher } from '@microsoft/msfs-sdk';
import { FlightPlanSynchronization } from './FlightPlanSynchronization';
import { MessageStorage } from './MessageStorage';

export class DatalinkClient {
    private readonly bus: EventBus;

    private readonly messageStorage: MessageStorage;

    private readonly flightPlan: FlightPlanSynchronization;

    private readonly publisher: Publisher<DatalinkAtcMessages & DatalinkAocMessages & DatalinkRouterMessages>;

    private readonly subscriber: EventSubscriber<AtcDatalinkMessages & AocDatalinkMessages & RouterDatalinkMessages>;

    private requestId: number = 0;

    private routerResponseCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

    private genericRequestResponseCallbacks: ((requestId: number) => boolean)[] = [];

    private requestAtsuStatusCodeCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

    private requestSentToGroundCallbacks: ((requestId: number) => boolean)[] = [];

    private statusDataResponseCallbacks: ((response: [AtsuStatusCodes, any], requestId: number) => boolean)[] = [];

    private positionReportDataCallbacks: ((response: PositionReportData, requestId: number) => boolean)[] = [];

    private atisAutoUpdates: string[] = [];

    private atisReportsPrintActive: boolean = false;

    private atcStationStatus: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean } = {
        current: '',
        next: '',
        notificationTime: 0,
        mode: FansMode.FansNone,
        logonInProgress: false,
    };

    private automaticPositionReportIsActive: boolean = false;

    private fms: any = null;

    private datalinkStatus: { vhf: DatalinkStatusCode; satellite: DatalinkStatusCode; hf: DatalinkStatusCode } = {
        vhf: DatalinkStatusCode.NotInstalled,
        satellite: DatalinkStatusCode.NotInstalled,
        hf: DatalinkStatusCode.NotInstalled,
    }

    private datalinkMode: { vhf: DatalinkModeCode; satellite: DatalinkModeCode; hf: DatalinkModeCode } = {
        vhf: DatalinkModeCode.None,
        satellite: DatalinkModeCode.None,
        hf: DatalinkModeCode.None,
    }

    private processRequestId(callbacks: ((number) => boolean)[], response: number): void {
        callbacks.every((callback, index) => {
            if (callback(response)) {
                callbacks.splice(index, 1);
                return false;
            }
            return true;
        });
    }

    private processStatus(callbacks: ((AtsuStatusCodes, number) => boolean)[], data: { requestId: number; status: AtsuStatusCodes }): void {
        callbacks.every((callback, index) => {
            if (callback(data.status, data.requestId)) {
                callbacks.splice(index, 1);
                return false;
            }
            return true;
        });
    }

    private processResponse<Type>(callbacks: ((AtsuStatusCodes, number) => boolean)[], response: { requestId: number; data: Type }): void {
        callbacks.every((callback, index) => {
            if (callback(response.data, response.requestId)) {
                callbacks.splice(index, 1);
                return false;
            }
            return true;
        });
    }

    constructor(fms: any, flightPlanManager: FlightPlanManager, flightPhaseManager: FlightPhaseManager) {
        this.bus = new EventBus();
        this.publisher = this.bus.getPublisher<DatalinkAtcMessages & DatalinkAocMessages & DatalinkRouterMessages>();
        this.subscriber = this.bus.getSubscriber<AtcDatalinkMessages & AocDatalinkMessages & RouterDatalinkMessages & DatalinkRouterMessages>();

        this.fms = fms;
        this.flightPlan = new FlightPlanSynchronization(this.bus, flightPlanManager, flightPhaseManager);
        this.messageStorage = new MessageStorage(this.subscriber);

        // register the system control handlers
        this.subscriber.on('aocResetData').handle(() => this.messageStorage.resetAocData());
        this.subscriber.on('atcResetData').handle(() => {
            this.messageStorage.resetAtcData();
            this.atisAutoUpdates = [];
            this.atisReportsPrintActive = false;
            this.automaticPositionReportIsActive = false;

            this.atcStationStatus = {
                current: '',
                next: '',
                notificationTime: 0,
                mode: FansMode.FansNone,
                logonInProgress: false,
            };

            this.datalinkStatus = {
                vhf: DatalinkStatusCode.NotInstalled,
                satellite: DatalinkStatusCode.NotInstalled,
                hf: DatalinkStatusCode.NotInstalled,
            };

            this.datalinkMode = {
                vhf: DatalinkModeCode.None,
                satellite: DatalinkModeCode.None,
                hf: DatalinkModeCode.None,
            };
        });

        // register the streaming handlers
        this.subscriber.on('atcSystemStatus').handle((status) => this.fms.addNewAtsuMessage(status));
        this.subscriber.on('aocSystemStatus').handle((status) => this.fms.addNewAtsuMessage(status));
        this.subscriber.on('atcMessageModify').handle((message) => this.modificationMessage = message);
        this.subscriber.on('atcPrintMessage').handle((message) => this.printMessage(message));
        this.subscriber.on('aocPrintMessage').handle((message) => this.printMessage(message));
        this.subscriber.on('atcActiveAtisAutoUpdates').handle((airports) => this.atisAutoUpdates = airports);
        this.subscriber.on('atcPrintAtisReportsPrint').handle((active) => this.atisReportsPrintActive = active);
        this.subscriber.on('atcStationStatus').handle((status) => this.atcStationStatus = status);
        this.subscriber.on('atcMaxUplinkDelay').handle((delay) => this.maxUplinkDelay = delay);
        this.subscriber.on('atcAutomaticPositionReportActive').handle((active) => this.automaticPositionReportIsActive = active);
        this.subscriber.on('routerManagementResponse').handle((data) => this.processStatus(this.routerResponseCallbacks, data));
        this.subscriber.on('routerDatalinkStatus').handle((data) => this.datalinkStatus = data);
        this.subscriber.on('routerDatalinkMode').handle((data) => this.datalinkMode = data);

        // register the response handlers
        this.subscriber.on('atcGenericRequestResponse').handle((response) => this.processRequestId(this.genericRequestResponseCallbacks, response));
        this.subscriber.on('atcRequestAtsuStatusCode').handle((response) => this.processStatus(this.requestAtsuStatusCodeCallbacks, response));
        this.subscriber.on('aocTransmissionResponse').handle((response) => this.processStatus(this.requestAtsuStatusCodeCallbacks, response));
        this.subscriber.on('aocRequestSentToGround').handle((response) => this.processRequestId(this.requestSentToGroundCallbacks, response));
        this.subscriber.on('aocWeatherResponse').handle((response) => this.processResponse(this.statusDataResponseCallbacks, response));
        this.subscriber.on('atcPositionReport').handle((response) => this.processResponse(this.positionReportDataCallbacks, response));
    }

    public maxUplinkDelay: number = -1;

    public modificationMessage: CpdlcMessage = null;

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('aocSendFreetextMessage', { message: message as FreetextMessage, requestId }, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public messageRead(uid: number, aocMessage: boolean): void {
        this.publisher.pub(aocMessage ? 'aocMessageRead' : 'atcMessageRead', uid, true, false);
    }

    public printMessage(message: AtsuMessage): void {
        const text = message.serialize(AtsuMessageSerializationFormat.Printer);
        this.fms.printPage(text.split('\n'));
    }

    public removeMessage(uid: number, aocMessage: boolean): void {
        this.publisher.pub(aocMessage ? 'aocRemoveMessage' : 'atcRemoveMessage', uid, true, false);
    }

    private async requestData<Type>(
        requestName: keyof DatalinkAocMessages | keyof DatalinkAtcMessages,
        sentCallback: () => void,
        requestId: number,
        data: any,
    ): Promise<Type> {
        return new Promise<Type>((resolve, _reject) => {
            this.publisher.pub(requestName, data, true, false);

            if (sentCallback !== null) {
                this.requestSentToGroundCallbacks.push((id: number) => {
                    if (id === requestId) sentCallback();
                    return id === requestId;
                });
            }
            this.requestAtsuStatusCodeCallbacks.push((response: any, id: number) => {
                if (id === requestId) resolve(response);
                return id === requestId;
            });
        });
    }

    public async receiveFlightPlan(sentCallback: () => void): Promise<[AtsuStatusCodes, FlightPlanMessage]> {
        const requestId = this.requestId++;
        return this.requestData('aocRequestFlightPlan', sentCallback, requestId, requestId);
    }

    public async receiveFlightFuelPlan(sentCallback: () => void): Promise<[AtsuStatusCodes, FlightFuelMessage]> {
        const requestId = this.requestId++;
        return this.requestData('aocRequestFuel', sentCallback, requestId, requestId);
    }

    public async receiveFlightWeightsPlan(sentCallback: () => void): Promise<[AtsuStatusCodes, FlightWeightsMessage]> {
        const requestId = this.requestId++;
        return this.requestData('aocRequestWeights', sentCallback, requestId, requestId);
    }

    public async receiveAocAtis(airport: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        const requestId = this.requestId++;
        return this.requestData('aocRequestAtis', sentCallback, requestId, { icao: airport, type, requestId });
    }

    public async receiveAtcAtis(airport: string, type: AtisType): Promise<AtsuStatusCodes> {
        const requestId = this.requestId++;
        return this.requestData('atcRequestAtis', null, requestId, { icao: airport, type, requestId });
    }

    public async receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        const requestId = this.requestId++;
        return this.requestData('aocRequestWeather', sentCallback, requestId, { icaos, requestMetar, requestId });
    }

    public registerMessages(messages: AtsuMessage[]): void {
        if (messages[0].Type === AtsuMessageType.CPDLC) {
            this.publisher.pub('atcRegisterCpdlcMessages', messages as CpdlcMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.DCL) {
            this.publisher.pub('atcRegisterDclMessages', messages as DclMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.OCL) {
            this.publisher.pub('atcRegisterOclMessages', messages as OclMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.ATIS || messages[0].Type === AtsuMessageType.METAR || messages[0].Type === AtsuMessageType.TAF) {
            this.publisher.pub('aocRegisterWeatherMessages', messages as WeatherMessage[], true, false);
        }
    }

    public atisAutoUpdateActive(icao: string): boolean {
        return this.atisAutoUpdates.findIndex((airport) => icao === airport) !== -1;
    }

    public async deactivateAtisAutoUpdate(icao: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcDeactivateAtisAutoUpdate', { icao, requestId }, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve(AtsuStatusCodes.Ok);
                return id === requestId;
            });
        });
    }

    public async activateAtisAutoUpdate(icao: string, type: AtisType): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcActivateAtisAutoUpdate', { icao, type, requestId }, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve(AtsuStatusCodes.Ok);
                return id === requestId;
            });
        });
    }

    public atisReports(icao: string): AtisMessage[] {
        if (this.messageStorage.atisReports.has(icao)) {
            return this.messageStorage.atisReports.get(icao);
        }
        return [];
    }

    public printAtisReportsPrint(): boolean {
        return this.atisReportsPrintActive;
    }

    public async togglePrintAtisReports(): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcTogglePrintAtisReportsPrint', requestId, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve(AtsuStatusCodes.Ok);
                return id === requestId;
            });
        });
    }

    public currentStation(): string {
        return this.atcStationStatus.current;
    }

    public fansMode(): FansMode {
        return this.atcStationStatus.mode;
    }

    public nextStationNotificationTime(): number {
        return this.atcStationStatus.notificationTime;
    }

    public nextStation(): string {
        return this.atcStationStatus.next;
    }

    public flightNumber(): string {
        return SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
    }

    public logonInProgress(): boolean {
        return this.atcStationStatus.logonInProgress;
    }

    public async logon(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcLogon', { station: callsign, requestId }, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public async logoff(): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcLogoff', requestId, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public async isRemoteStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('routerRequestStationAvailable', { callsign, requestId }, true, false);
            this.routerResponseCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public updateMessage(message: CpdlcMessage): void {
        if (this.modificationMessage !== null && message.UniqueMessageID === this.modificationMessage.UniqueMessageID) {
            this.modificationMessage = null;
        }

        this.publisher.pub('atcUpdateMessage', message, true, false);
    }

    public aocInputMessages(): AtsuMessage[] {
        return this.messageStorage.aocUplinkMessages;
    }

    public aocOutputMessages(): AtsuMessage[] {
        return this.messageStorage.aocDownlinkMessages;
    }

    public atcMessages(): CpdlcMessage[] {
        return this.messageStorage.atcMessagesBuffer;
    }

    public monitoredMessages(): CpdlcMessage[] {
        return this.messageStorage.atcMonitoredMessages;
    }

    public cleanupAtcMessages(): void {
        this.publisher.pub('atcCleanupMessages', true, true, false);
    }

    public async setMaxUplinkDelay(delay: number): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcSetMaxUplinkDelay', { delay, requestId }, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve(AtsuStatusCodes.Ok);
                return id === requestId;
            });
        });
    }

    public automaticPositionReportActive(): boolean {
        return this.automaticPositionReportIsActive;
    }

    public async toggleAutomaticPositionReport(): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcToggleAutomaticPositionReport', requestId, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve(AtsuStatusCodes.Ok);
                return id === requestId;
            });
        });
    }

    public async receivePositionReportData(): Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }> {
        return new Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcRequestPositionReport', requestId, true, false);
            this.positionReportDataCallbacks.push((response: PositionReportData, id: number) => {
                if (id === requestId) resolve(response);
                return id === requestId;
            });
        });
    }

    public resetAtisAutoUpdate(): void {
        this.publisher.pub('atcResetAtisAutoUpdate', true, true, false);
    }

    public async connectToNetworks(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const disconnectRequestId = this.requestId++;
            this.publisher.pub('routerDisconnect', disconnectRequestId, true, false);
            this.routerResponseCallbacks.push((_code: AtsuStatusCodes, id: number) => {
                if (id === disconnectRequestId) {
                    const connectRequestId = this.requestId++;
                    this.publisher.pub('routerConnect', { callsign, requestId: connectRequestId }, true, false);
                    this.routerResponseCallbacks.push((code: AtsuStatusCodes, id: number) => {
                        if (id === connectRequestId) resolve(code);
                        return id === connectRequestId;
                    });
                }
                return id === disconnectRequestId;
            });
        });
    }

    public getDatalinkStatus(system: DatalinkCommunicationSystems): DatalinkStatusCode {
        switch (system) {
        case DatalinkCommunicationSystems.VHF:
            return this.datalinkStatus.vhf;
        case DatalinkCommunicationSystems.SATCOM:
            return this.datalinkStatus.satellite;
        case DatalinkCommunicationSystems.HF:
            return this.datalinkStatus.hf;
        default:
            return DatalinkStatusCode.Inop;
        }
    }

    public getDatalinkMode(system: DatalinkCommunicationSystems): DatalinkModeCode {
        switch (system) {
        case DatalinkCommunicationSystems.VHF:
            return this.datalinkMode.vhf;
        case DatalinkCommunicationSystems.SATCOM:
            return this.datalinkMode.satellite;
        case DatalinkCommunicationSystems.HF:
            return this.datalinkMode.hf;
        default:
            return DatalinkModeCode.None;
        }
    }
}
