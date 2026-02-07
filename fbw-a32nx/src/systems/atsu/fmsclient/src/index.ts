// @ts-strict-ignore
//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AocFmsMessages, FmsAocMessages } from '@datalink/aoc';
import { AtcFmsMessages, FmsAtcMessages } from '@datalink/atc';
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
  WindUplinkMessage,
  WindRequestMessage,
} from '@datalink/common';
import { FmsRouterMessages, RouterFmsMessages } from '@datalink/router';
import { EventBus, Instrument, InstrumentBackplane, MappedSubject } from '@microsoft/msfs-sdk';
import { FlightPlanInterface } from '@fmgc/flightplanning/FlightPlanInterface';
import { FlightPlanSynchronization } from './FlightPlanSynchronization';
import { MessageStorage } from './MessageStorage';
import { A32NXFmBusEvents, A32NXFmBusPublisher } from '@shared/publishers/A32NXFmBusPublisher';
import { Arinc429LocalVarConsumerSubject, Arinc429Register } from '@flybywiresim/fbw-sdk';

export class FmsClient implements Instrument {
  private readonly bus = new EventBus();
  private readonly backplane = new InstrumentBackplane();

  private readonly messageStorage: MessageStorage;

  private readonly flightPlan: FlightPlanSynchronization;

  private readonly publisher = this.bus.getPublisher<FmsAtcMessages & FmsAocMessages & FmsRouterMessages>();

  private readonly subscriber = this.bus.getSubscriber<
    A32NXFmBusEvents & AtcFmsMessages & AocFmsMessages & RouterFmsMessages & FmsRouterMessages
  >();

  private requestId: number = 0;

  private routerResponseCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

  private genericRequestResponseCallbacks: ((requestId: number) => boolean)[] = [];

  private requestAtsuStatusCodeCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

  private requestSentToGroundCallbacks: ((requestId: number) => boolean)[] = [];

  private weatherResponseCallbacks: ((response: [AtsuStatusCodes, WeatherMessage], requestId: number) => boolean)[] =
    [];

  private windsResponseCallbacks: ((
    response: [AtsuStatusCodes, WindUplinkMessage | null],
    requestId: number,
  ) => boolean)[] = [];

  private positionReportDataCallbacks: ((response: PositionReportData, requestId: number) => boolean)[] = [];

  private atisAutoUpdates: string[] = [];

  private atisReportsPrintActive: boolean = false;

  private atcStationStatus: {
    current: string;
    next: string;
    notificationTime: number;
    mode: FansMode;
    logonInProgress: boolean;
  } = {
    current: '',
    next: '',
    notificationTime: 0,
    mode: FansMode.FansNone,
    logonInProgress: false,
  };

  private automaticPositionReportIsActive: boolean = false;

  private datalinkStatus: { vhf: DatalinkStatusCode; satellite: DatalinkStatusCode; hf: DatalinkStatusCode } = {
    vhf: DatalinkStatusCode.NotInstalled,
    satellite: DatalinkStatusCode.NotInstalled,
    hf: DatalinkStatusCode.NotInstalled,
  };

  private datalinkMode: { vhf: DatalinkModeCode; satellite: DatalinkModeCode; hf: DatalinkModeCode } = {
    vhf: DatalinkModeCode.None,
    satellite: DatalinkModeCode.None,
    hf: DatalinkModeCode.None,
  };

  private readonly fmsFlightNumber = MappedSubject.create(
    (words) => Arinc429Register.assembleIso5Value(false, ...words),
    Arinc429LocalVarConsumerSubject.create(this.subscriber.on('a32nx_fm_flight_number_1_1')),
    Arinc429LocalVarConsumerSubject.create(this.subscriber.on('a32nx_fm_flight_number_2_1')),
    Arinc429LocalVarConsumerSubject.create(this.subscriber.on('a32nx_fm_flight_number_3_1')),
    Arinc429LocalVarConsumerSubject.create(this.subscriber.on('a32nx_fm_flight_number_4_1')),
  );

  // FIXME should not take any of these parameters, as the ATSU is a separate system
  // that can only communicate with the FMS and MCDU via ARINC429.
  constructor(
    private readonly fms: any,
    flightPlanManager: FlightPlanInterface,
  ) {
    this.flightPlan = new FlightPlanSynchronization(this.bus, flightPlanManager);
    this.messageStorage = new MessageStorage(this.subscriber);

    this.backplane.addPublisher('FmBus', new A32NXFmBusPublisher(this.bus));

    // register the system control handlers
    this.subscriber.on('aocResetData').handle(this.onAocReset.bind(this));
    this.subscriber.on('atcResetData').handle(this.onAtcReset.bind(this));

    // register the streaming handlers
    this.subscriber.on('atcSystemStatus').handle((status) => this.fms.addNewAtsuMessage(status));
    this.subscriber.on('aocSystemStatus').handle((status) => this.fms.addNewAtsuMessage(status));
    this.subscriber.on('atcMessageModify').handle((message) => (this.modificationMessage = message));
    this.subscriber.on('atcPrintMessage').handle((message) => this.printMessage(message));
    this.subscriber.on('aocPrintMessage').handle((message) => this.printMessage(message));
    this.subscriber.on('atcActiveAtisAutoUpdates').handle((airports) => (this.atisAutoUpdates = airports));
    this.subscriber.on('atcPrintAtisReportsPrint').handle((active) => (this.atisReportsPrintActive = active));
    this.subscriber.on('atcStationStatus').handle((status) => (this.atcStationStatus = status));
    this.subscriber.on('atcMaxUplinkDelay').handle((delay) => (this.maxUplinkDelay = delay));
    this.subscriber
      .on('atcAutomaticPositionReportActive')
      .handle((active) => (this.automaticPositionReportIsActive = active));
    this.subscriber.on('routerManagementResponse').handle((data) => {
      this.routerResponseCallbacks.every((callback, index) => {
        if (callback(data.status, data.requestId)) {
          this.routerResponseCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('routerDatalinkStatus').handle((data) => (this.datalinkStatus = data));
    this.subscriber.on('routerDatalinkMode').handle((data) => (this.datalinkMode = data));

    // register the response handlers
    this.subscriber.on('atcGenericRequestResponse').handle((response) => {
      this.genericRequestResponseCallbacks.every((callback, index) => {
        if (callback(response)) {
          this.genericRequestResponseCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('atcRequestAtsuStatusCode').handle((response) => {
      this.requestAtsuStatusCodeCallbacks.every((callback, index) => {
        if (callback(response.code, response.requestId)) {
          this.requestAtsuStatusCodeCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('aocTransmissionResponse').handle((response) => {
      this.requestAtsuStatusCodeCallbacks.every((callback, index) => {
        if (callback(response.status, response.requestId)) {
          this.requestAtsuStatusCodeCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('aocRequestSentToGround').handle((response) => {
      this.requestSentToGroundCallbacks.every((callback, index) => {
        if (callback(response)) {
          this.requestSentToGroundCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('aocWeatherResponse').handle((response) => {
      this.weatherResponseCallbacks.every((callback, index) => {
        if (callback(response.data, response.requestId)) {
          this.weatherResponseCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('atcPositionReport').handle((response) => {
      this.positionReportDataCallbacks.every((callback, index) => {
        if (callback(response.data, response.requestId)) {
          this.positionReportDataCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
    this.subscriber.on('aocWindsResponse').handle((response) => {
      this.windsResponseCallbacks.every((callback, index) => {
        if (callback(response.data, response.requestId)) {
          this.windsResponseCallbacks.splice(index, 1);
          return false;
        }
        return true;
      });
    });
  }

  /** @inheritdoc */
  public init(): void {
    this.backplane.init();
  }

  /** @inheritdoc */
  public onUpdate(): void {
    this.backplane.onUpdate();
  }

  /** Handles FMS reset (completion of flight, nav DB swap, etc.) */
  public onFmsReset(): void {
    this.resetAtisAutoUpdate();
    this.onAocReset();
    this.onAtcReset();
  }

  private onAocReset(): void {
    this.messageStorage.resetAocData();
  }

  private onAtcReset(): void {
    this.messageStorage.resetAtcData();
    this.atisAutoUpdates = [];
    this.atisReportsPrintActive = false;
    this.automaticPositionReportIsActive = false;

    // FIXME don't allocate a new object
    this.atcStationStatus = {
      current: '',
      next: '',
      notificationTime: 0,
      mode: FansMode.FansNone,
      logonInProgress: false,
    };

    // FIXME don't allocate a new object
    this.datalinkStatus = {
      vhf: DatalinkStatusCode.NotInstalled,
      satellite: DatalinkStatusCode.NotInstalled,
      hf: DatalinkStatusCode.NotInstalled,
    };

    // FIXME don't allocate a new object
    this.datalinkMode = {
      vhf: DatalinkModeCode.None,
      satellite: DatalinkModeCode.None,
      hf: DatalinkModeCode.None,
    };
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

  public printAocAtis(data: any): void {
    const message = WeatherMessage.deserialize(data);
    this.printMessage(message);
  }

  public printMessage(message: AtsuMessage): void {
    const text = message.serialize(AtsuMessageSerializationFormat.Printer);
    this.fms.printPage(text.split('\n'));
  }

  public removeMessage(uid: number, aocMessage: boolean): void {
    this.publisher.pub(aocMessage ? 'aocRemoveMessage' : 'atcRemoveMessage', uid, true, false);
  }

  public async receiveAocAtis(
    airport: string,
    type: AtisType,
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('aocRequestAtis', { icao: airport, type, requestId }, true, false);

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

  public async receiveAtcAtis(airport: string, type: AtisType): Promise<AtsuStatusCodes> {
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('atcRequestAtis', { icao: airport, type, requestId }, true, false);

      this.requestAtsuStatusCodeCallbacks.push((response: AtsuStatusCodes, id: number) => {
        if (id === requestId) resolve(response);
        return id === requestId;
      });
    });
  }

  public async receiveWeather(
    requestMetar: boolean,
    icaos: string[],
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WeatherMessage]> {
    return new Promise<[AtsuStatusCodes, WeatherMessage]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('aocRequestWeather', { icaos, requestMetar, requestId }, true, false);

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

  public receiveWindUplink(
    request: WindRequestMessage,
    sentCallback: () => void,
  ): Promise<[AtsuStatusCodes, WindUplinkMessage | null]> {
    return new Promise<[AtsuStatusCodes, WindUplinkMessage | null]>((resolve, _reject) => {
      const requestId = this.requestId++;
      this.publisher.pub('aocRequestWinds', { ...request, requestId }, true, false);
      sentCallback();

      this.windsResponseCallbacks.push((response: [AtsuStatusCodes, WindUplinkMessage | null], id: number) => {
        if (id === requestId) resolve(response);
        return id === requestId;
      });
    });
  }

  public registerMessages(messages: AtsuMessage[]): void {
    if (messages[0].Type === AtsuMessageType.CPDLC) {
      this.publisher.pub('atcRegisterCpdlcMessages', messages as CpdlcMessage[], true, false);
    } else if (messages[0].Type === AtsuMessageType.DCL) {
      this.publisher.pub('atcRegisterDclMessages', messages as DclMessage[], true, false);
    } else if (messages[0].Type === AtsuMessageType.OCL) {
      this.publisher.pub('atcRegisterOclMessages', messages as OclMessage[], true, false);
    } else if (
      messages[0].Type === AtsuMessageType.ATIS ||
      messages[0].Type === AtsuMessageType.METAR ||
      messages[0].Type === AtsuMessageType.TAF
    ) {
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
    return this.fmsFlightNumber.get();
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

  public async receivePositionReportData(): Promise<{
    flightState: FlightStateData;
    autopilot: AutopilotData;
    environment: EnvironmentData;
  }> {
    return new Promise<{ flightState: FlightStateData; autopilot: AutopilotData; environment: EnvironmentData }>(
      (resolve, _reject) => {
        const requestId = this.requestId++;
        this.publisher.pub('atcRequestPositionReport', requestId, true, false);
        this.positionReportDataCallbacks.push((response: PositionReportData, id: number) => {
          if (id === requestId) resolve(response);
          return id === requestId;
        });
      },
    );
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

  public getDatalinkStatus(value: 'vhf' | 'satcom' | 'hf'): DatalinkStatusCode {
    switch (value) {
      case 'vhf':
        return this.datalinkStatus.vhf;
      case 'satcom':
        return this.datalinkStatus.satellite;
      case 'hf':
        return this.datalinkStatus.hf;
      default:
        return DatalinkStatusCode.NotInstalled;
    }
  }

  public getDatalinkMode(value: 'vhf' | 'satcom' | 'hf'): DatalinkModeCode {
    switch (value) {
      case 'vhf':
        return this.datalinkMode.vhf;
      case 'satcom':
        return this.datalinkMode.satellite;
      case 'hf':
        return this.datalinkMode.hf;
      default:
        return DatalinkModeCode.None;
    }
  }
}
