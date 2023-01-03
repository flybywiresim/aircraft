import { AtsuFmsMessages } from '@atsu/common/databus';
import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import { FansMode } from '@atsu/common/com/FutureAirNavigationSystem';
import {
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
} from '@atsu/common/messages';
import { AutopilotData, EnvironmentData, FlightStateData, PositionReportData } from '@atsu/common/types';
import { FlightPhaseManager } from '@fmgc/flightphase';
import { FlightPlanManager } from '@fmgc/index';
import { EventBus, EventSubscriber, Publisher } from 'msfssdk';
import { FlightPlanSynchronization } from './FlightPlanSynchronization';

export class FmsClient {
    private readonly bus: EventBus;

    private readonly flightPlan: FlightPlanSynchronization;

    private readonly publisher: Publisher<AtsuFmsMessages>;

    private readonly subscriber: EventSubscriber<AtsuFmsMessages>;

    private requestId: number = 0;

    private genericRequestResponseCallbacks: ((requestId: number) => boolean)[] = [];

    private requestAtsuStatusCodeCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

    private requestSentToGroundCallbacks: ((requestId: number) => boolean)[] = [];

    private weatherResponseCallbacks: ((response: [AtsuStatusCodes, WeatherMessage], requestId: number) => boolean)[] = [];

    private positionReportDataCallbacks: ((response: PositionReportData, requestId: number) => boolean)[] = [];

    private atisAutoUpdates: string[] = [];

    private atcAtisReports: Map<string, AtisMessage[]> = new Map();

    private atisReportsPrintActive: boolean = false;

    private atcStationStatus: { current: string; next: string; notificationTime: number; mode: FansMode; logonInProgress: boolean } = {
        current: '',
        next: '',
        notificationTime: 0,
        mode: FansMode.FansNone,
        logonInProgress: false,
    };

    private atcMessagesBuffer: CpdlcMessage[] = [];

    private atcMonitoredMessages: CpdlcMessage[] = [];

    private aocUplinkMessages: AtsuMessage[] = [];

    private aocDownlinkMessages: AtsuMessage[] = [];

    private automaticPositionReportIsActive: boolean = false;

    private fms: any = null;

    constructor(fms: any, flightPlanManager: FlightPlanManager, flightPhaseManager: FlightPhaseManager) {
        this.fms = fms;

        this.bus = new EventBus();
        this.publisher = this.bus.getPublisher<AtsuFmsMessages>();
        this.subscriber = this.bus.getSubscriber<AtsuFmsMessages>();

        // register the streaming handlers
        this.subscriber.on('atsuSystemStatus').handle((status) => this.fms.addNewAtsuMessage(status));
        this.subscriber.on('messageModify').handle((message) => this.modificationMessage = message);
        this.subscriber.on('printMessage').handle((message) => this.printMessage(message));
        this.subscriber.on('activeAtisAutoUpdates').handle((airports) => this.atisAutoUpdates = airports);
        this.subscriber.on('atcAtisReports').handle((reports) => this.atcAtisReports = reports);
        this.subscriber.on('printAtisReportsPrint').handle((active) => this.atisReportsPrintActive = active);
        this.subscriber.on('atcStationStatus').handle((status) => this.atcStationStatus = status);
        this.subscriber.on('aocUplinkMessages').handle((messages) => this.aocUplinkMessages = messages);
        this.subscriber.on('aocDownlinkMessages').handle((messages) => this.aocDownlinkMessages = messages);
        this.subscriber.on('atcMessages').handle((messages) => this.atcMessagesBuffer = messages);
        this.subscriber.on('monitoredMessages').handle((messages) => this.atcMonitoredMessages = messages);
        this.subscriber.on('maxUplinkDelay').handle((delay) => this.maxUplinkDelay = delay);
        this.subscriber.on('automaticPositionReportActive').handle((active) => this.automaticPositionReportIsActive = active);

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

        this.flightPlan = new FlightPlanSynchronization(this.bus, flightPlanManager, flightPhaseManager);
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

    public receiveAtis(airport: string, type: AtisType, sentCallback: () => void): Promise<[AtsuStatusCodes, WeatherMessage]> {
        return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
            const requestId = this.requestId++;
            this.publisher.pub('requestAtis', { icao: airport, type, requestId }, true, false);

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
        if (this.atcAtisReports.has(icao)) {
            return this.atcAtisReports.get(icao);
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
        return this.aocUplinkMessages;
    }

    public aocOutputMessages(): AtsuMessage[] {
        return this.aocDownlinkMessages;
    }

    public atcMessages(): CpdlcMessage[] {
        return this.atcMessagesBuffer;
    }

    public monitoredMessages(): CpdlcMessage[] {
        return this.atcMonitoredMessages;
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
}
