import {
    AtsuFmsMessages,
    FmsAtsuMessages,
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
} from '@atsu/common/index';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanManager } from '@fmgc/index';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';
import { FlightPlanSynchronization } from './FlightPlanSynchronization';
import { MessageStorage } from './MessageStorage';

export class FmsClient {
    private readonly bus: EventBus;

    private readonly messageStorage: MessageStorage;

    private readonly flightPlan: FlightPlanSynchronization;

    private readonly publisher: Publisher<FmsAtsuMessages>;

    private readonly subscriber: EventSubscriber<AtsuFmsMessages>;

    private requestId: number = 0;

    private genericRequestResponseCallbacks: ((requestId: number) => boolean)[] = [];

    private requestAtsuStatusCodeCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

    private requestSentToGroundCallbacks: ((requestId: number) => boolean)[] = [];

    private weatherResponseCallbacks: ((response: [AtsuStatusCodes, WeatherMessage], requestId: number) => boolean)[] = [];

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

    constructor(fms: any, flightPlanManager: FlightPlanManager, flightPhaseManager: FlightPhaseManager) {
        this.bus = new EventBus();
        this.publisher = this.bus.getPublisher<FmsAtsuMessages>();
        this.subscriber = this.bus.getSubscriber<AtsuFmsMessages>();

        this.fms = fms;
        this.flightPlan = new FlightPlanSynchronization(this.bus, flightPlanManager, flightPhaseManager);
        this.messageStorage = new MessageStorage(this.subscriber);

        // register the streaming handlers
        this.subscriber.on('atsuSystemStatus').handle((status) => this.fms.addNewAtsuMessage(status));
        this.subscriber.on('messageModify').handle((message) => this.modificationMessage = message);
        this.subscriber.on('printMessage').handle((message) => this.printMessage(message));
        this.subscriber.on('activeAtisAutoUpdates').handle((airports) => this.atisAutoUpdates = airports);
        this.subscriber.on('printAtisReportsPrint').handle((active) => this.atisReportsPrintActive = active);
        this.subscriber.on('atcStationStatus').handle((status) => this.atcStationStatus = status);
        this.subscriber.on('maxUplinkDelay').handle((delay) => this.maxUplinkDelay = delay);
        this.subscriber.on('automaticPositionReportActive').handle((active) => this.automaticPositionReportIsActive = active);
        this.subscriber.on('datalinkCommunicationStatus').handle((data) => this.datalinkStatus = data);
        this.subscriber.on('datalinkCommunicationMode').handle((data) => this.datalinkMode = data);

        // register the response handlers
        this.subscriber.on('genericRequestResponse').handle((response) => {
            this.genericRequestResponseCallbacks.every((callback, index) => {
                if (callback(response)) {
                    this.genericRequestResponseCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
        this.subscriber.on('requestAtsuStatusCode').handle((response) => {
            this.requestAtsuStatusCodeCallbacks.every((callback, index) => {
                if (callback(response.code, response.requestId)) {
                    this.requestAtsuStatusCodeCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
        this.subscriber.on('requestSentToGround').handle((response) => {
            this.requestSentToGroundCallbacks.every((callback, index) => {
                if (callback(response)) {
                    this.requestSentToGroundCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
        this.subscriber.on('weatherResponse').handle((response) => {
            this.weatherResponseCallbacks.every((callback, index) => {
                if (callback(response.data, response.requestId)) {
                    this.weatherResponseCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
        this.subscriber.on('positionReport').handle((response) => {
            this.positionReportDataCallbacks.every((callback, index) => {
                if (callback(response.data, response.requestId)) {
                    this.positionReportDataCallbacks.splice(index, 1);
                    return false;
                }
                return true;
            });
        });
    }

    public maxUplinkDelay: number = -1;

    public modificationMessage: CpdlcMessage = null;

    public sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('sendFreetextMessage', { message: message as FreetextMessage, requestId }, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public messageRead(uid: number): void {
        this.publisher.pub('messageRead', uid, true, false);
    }

    public printMessage(message: AtsuMessage): void {
        const text = message.serialize(AtsuMessageSerializationFormat.Printer);
        this.fms.printPage(text.split('\n'));
    }

    public removeMessage(uid: number): void {
        this.publisher.pub('removeMessage', uid, true, false);
    }

    public receiveAocAtis(airport: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestAocAtis', { icao: airport, type, requestId }, true, false);

            this.requestSentToGroundCallbacks.push((id: number) => {
                if (id === requestId) sentCallback();
                return id === requestId;
            });
            this.weatherResponseCallbacks.push((response: [AtsuStatusCodes, WeatherMessage], id: number) => {
                if (id === requestId) resolve(response);
                return id === requestId;
            });
        });
    }

    public receiveAtcAtis(airport: string, type: AtisType): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestAtcAtis', { icao: airport, type, requestId }, true, false);

            this.requestAtsuStatusCodeCallbacks.push((response: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(response);
                return id === requestId;
            });
        });
    }

    public receiveWeather(requestMetar: boolean, icaos: string[], sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestWeather', { icaos, requestMetar, requestId }, true, false);

            this.requestSentToGroundCallbacks.push((id: number) => {
                if (id === requestId) sentCallback();
                return id === requestId;
            });
            this.weatherResponseCallbacks.push((response: [AtsuStatusCodes, WeatherMessage], id: number) => {
                if (id === requestId) resolve(response);
                return id === requestId;
            });
        });
    }

    public registerMessages(messages: AtsuMessage[]): void {
        if (messages[0].Type === AtsuMessageType.ATIS) {
            this.publisher.pub('registerAtisMessages', messages as AtisMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.CPDLC) {
            this.publisher.pub('registerCpdlcMessages', messages as CpdlcMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.DCL) {
            this.publisher.pub('registerDclMessages', messages as DclMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.OCL) {
            this.publisher.pub('registerOclMessages', messages as OclMessage[], true, false);
        } else if (messages[0].Type === AtsuMessageType.METAR || messages[0].Type === AtsuMessageType.TAF) {
            this.publisher.pub('registerWeatherMessages', messages as WeatherMessage[], true, false);
        }
    }

    public atisAutoUpdateActive(icao: string): boolean {
        return this.atisAutoUpdates.findIndex((airport) => icao === airport) !== -1;
    }

    public deactivateAtisAutoUpdate(icao: string): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('deactivateAtisAutoUpdate', { icao, requestId }, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve();
                return id === requestId;
            });
        });
    }

    public activateAtisAutoUpdate(icao: string, type: AtisType): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('activateAtisAutoUpdate', { icao, type, requestId }, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve();
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

    public togglePrintAtisReports(): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('togglePrintAtisReportsPrint', requestId, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve();
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

    public logon(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcLogon', { station: callsign, requestId }, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public logoff(): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('atcLogoff', requestId, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public isRemoteStationAvailable(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('remoteStationAvailable', { station: callsign, requestId }, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public updateMessage(message: CpdlcMessage): void {
        if (this.modificationMessage !== null && message.UniqueMessageID === this.modificationMessage.UniqueMessageID) {
            this.modificationMessage = null;
        }

        this.publisher.pub('updateMessage', message, true, false);
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
        this.publisher.pub('cleanupAtcMessages', true, true, false);
    }

    public setMaxUplinkDelay(delay: number): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('setMaxUplinkDelay', { delay, requestId }, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve();
                return id === requestId;
            });
        });
    }

    public automaticPositionReportActive(): boolean {
        return this.automaticPositionReportIsActive;
    }

    public toggleAutomaticPositionReport(): Promise<void> {
        return new Promise<void>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('toggleAutomaticPositionReport', requestId, true, false);
            this.genericRequestResponseCallbacks.push((id: number) => {
                if (id === requestId) resolve();
                return id === requestId;
            });
        });
    }

    public receivePositionReportData(): Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }> {
        return new Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestPositionReport', requestId, true, false);
            this.positionReportDataCallbacks.push((response: PositionReportData, id: number) => {
                if (id === requestId) resolve(response);
                return id === requestId;
            });
        });
    }

    public resetAtisAutoUpdate(): void {
        this.publisher.pub('resetAtisAutoUpdate', true, true, false);
    }

    public connectToNetworks(callsign: string): Promise<AtsuStatusCodes> {
        return new Promise<AtsuStatusCodes>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('connectToNetworks', { callsign, requestId }, true, false);
            this.requestAtsuStatusCodeCallbacks.push((code: AtsuStatusCodes, id: number) => {
                if (id === requestId) resolve(code);
                return id === requestId;
            });
        });
    }

    public getDatalinkStatus(value: string): DatalinkStatusCode {
        switch (value) {
        case 'vhf':
            return this.datalinkStatus.vhf;
        case 'satcom':
            return this.datalinkStatus.satellite;
        case 'hf':
            return this.datalinkStatus.hf;
        default:
            return 99;
        }
    }

    public getDatalinkMode(value: string): DatalinkModeCode {
        switch (value) {
        case 'vhf':
            return this.datalinkMode.vhf;
        case 'satcom':
            return this.datalinkMode.satellite;
        case 'hf':
            return this.datalinkMode.hf;
        default:
            return 99;
        }
    }
}
