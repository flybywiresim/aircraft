//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';
import { RadioUtils } from '@flybywiresim/fbw-sdk';
import {
  InputValidation,
  AtsuStatusCodes,
  MailboxStatusMessage,
  AtisMessage,
  AtisType,
  AtsuTimestamp,
  AtsuMessageComStatus,
  AtsuMessage,
  AtsuMessageType,
  AtsuMessageDirection,
  CpdlcMessagesDownlink,
  CpdlcMessageExpectedResponseType,
  CpdlcMessage,
  FansMode,
  FutureAirNavigationSystem,
  coordinateToString,
  timestampToString,
  Conversion,
  CpdlcMessageContentFrequency,
} from '../../common/src';
import { FmsRouteData } from './databus/FmsBus';
import { MailboxBus } from './databus/MailboxBus';
import { UplinkMessageStateMachine } from './components/UplinkMessageStateMachine';
import { UplinkMessageMonitoring } from './components/UplinkMessageMonitoring';
import { DigitalInputs } from './DigitalInputs';
import { DigitalOutputs } from './DigitalOutputs';
import { ATS623 } from './components/ATS623';

/*
 * Defines the ATC system for CPDLC communication
 */
export class Atc {
  private messageCounter: number = 0;

  private ats623: ATS623 = null;

  public digitalInputs: DigitalInputs = null;

  public digitalOutputs: DigitalOutputs = null;

  public mailboxBus: MailboxBus = null;

  private poweredUp: boolean = false;

  private handoverInterval: number = null;

  private handoverOngoing = false;

  private currentAtc = '';

  private nextAtc = '';

  private notificationTime = 0;

  private cpdlcMessageId = 0;

  private messageQueue: CpdlcMessage[] = [];

  private printAtisReport = false;

  private atisAutoUpdateIcaos: [string, AtisType, number][] = [];

  private atisMessages: Map<string, [number, AtisMessage[]]> = new Map();

  private maxUplinkDelay: number = -1;

  private currentFansMode: FansMode = FansMode.FansNone;

  private automaticPositionReport: boolean = false;

  private messageWatchdogInterval: number = null;

  public messageMonitoring: UplinkMessageMonitoring = null;

  public createPositionReport(): CpdlcMessage {
    const message = new CpdlcMessage();
    message.Station = this.currentStation();
    message.Content.push(CpdlcMessagesDownlink.DM48[1].deepCopy());

    let targetAltitude: string = '';
    let passedAltitude: string = '';
    let currentAltitude: string = '';
    if (Simplane.getPressureSelectedMode(Aircraft.A320_NEO) === 'STD') {
      if (this.digitalInputs.FlightRoute.lastWaypoint) {
        passedAltitude = InputValidation.formatScratchpadAltitude(
          `FL${Math.round(this.digitalInputs.FlightRoute.lastWaypoint.altitude / 100)}`,
        );
      } else {
        passedAltitude = InputValidation.formatScratchpadAltitude(
          `FL${Math.round(this.digitalInputs.PresentPosition.altitude.value / 100)}`,
        );
      }
      currentAltitude = InputValidation.formatScratchpadAltitude(
        `FL${Math.round(this.digitalInputs.PresentPosition.altitude.value / 100)}`,
      );

      if (
        this.digitalInputs.AutopilotData.active.isNormalOperation() &&
        this.digitalInputs.AutopilotData.active.value !== 0
      ) {
        if (this.digitalInputs.AutopilotData.selectedAltitude !== this.digitalInputs.PresentPosition.altitude.value) {
          targetAltitude = InputValidation.formatScratchpadAltitude(
            `FL${Math.round(this.digitalInputs.AutopilotData.selectedAltitude / 100)}`,
          );
        } else {
          targetAltitude = currentAltitude;
        }
      }
    } else {
      if (this.digitalInputs.FlightRoute.lastWaypoint) {
        passedAltitude = InputValidation.formatScratchpadAltitude(
          this.digitalInputs.FlightRoute.lastWaypoint.altitude.toString(),
        );
      } else {
        passedAltitude = InputValidation.formatScratchpadAltitude(
          this.digitalInputs.PresentPosition.altitude.value.toString(),
        );
      }
      currentAltitude = InputValidation.formatScratchpadAltitude(
        this.digitalInputs.PresentPosition.altitude.value.toString(),
      );

      if (
        this.digitalInputs.AutopilotData.active.isNormalOperation() &&
        this.digitalInputs.AutopilotData.active.value !== 0
      ) {
        if (this.digitalInputs.AutopilotData.selectedAltitude) {
          targetAltitude = InputValidation.formatScratchpadAltitude(
            this.digitalInputs.AutopilotData.selectedAltitude.toString(),
          );
        } else {
          targetAltitude = currentAltitude;
        }
      }
    }

    let extension = null;
    if (this.digitalInputs.FlightRoute.lastWaypoint) {
      // define the overhead
      extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
      extension.Content[0].Value = `OVHD: ${this.digitalInputs.FlightRoute.lastWaypoint.ident}`;
      message.Content.push(extension);
      extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
      extension.Content[0].Value = `AT ${timestampToString(this.digitalInputs.FlightRoute.lastWaypoint.utc)}Z/${passedAltitude}`;
      message.Content.push(extension);
    }

    // define the present position
    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
    extension.Content[0].Value = `PPOS: ${coordinateToString({ lat: this.digitalInputs.PresentPosition.latitude.value, lon: this.digitalInputs.PresentPosition.longitude.value }, false)}`;
    message.Content.push(extension);
    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
    extension.Content[0].Value = `AT ${timestampToString(this.digitalInputs.UtcClock.secondsOfDay)}Z/${currentAltitude}`;
    message.Content.push(extension);

    if (this.digitalInputs.FlightRoute.activeWaypoint) {
      // define the active position
      extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
      extension.Content[0].Value = `TO: ${this.digitalInputs.FlightRoute.activeWaypoint.ident} AT ${timestampToString(this.digitalInputs.FlightRoute.activeWaypoint.utc)}Z`;
      message.Content.push(extension);
    }

    if (this.digitalInputs.FlightRoute.nextWaypoint) {
      // define the next position
      extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
      extension.Content[0].Value = `NEXT: ${this.digitalInputs.FlightRoute.nextWaypoint.ident}`;
      message.Content.push(extension);
    }

    // define wind and SAT
    if (
      this.digitalInputs.MeteoData.windDirection.isNormalOperation() &&
      this.digitalInputs.MeteoData.windSpeed.isNormalOperation() &&
      this.digitalInputs.MeteoData.staticAirTemperature.isNormalOperation()
    ) {
      extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
      const windInput = `${this.digitalInputs.MeteoData.windDirection.value}/${this.digitalInputs.MeteoData.windSpeed.value}KT`;
      extension.Content[0].Value = `WIND: ${InputValidation.formatScratchpadWind(windInput)}`;
      extension.Content[0].Value = `${extension.Content[0].Value} SAT: ${this.digitalInputs.MeteoData.staticAirTemperature.value}C`;
      message.Content.push(extension);
    }

    if (this.digitalInputs.FlightRoute.destination) {
      // define ETA
      extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
      extension.Content[0].Value = `DEST ETA: ${timestampToString(this.digitalInputs.FlightRoute.destination.utc)}Z`;
      message.Content.push(extension);
    }

    // define descending/climbing and VS
    if (
      this.digitalInputs.AutopilotData.active.isNormalOperation() &&
      this.digitalInputs.AutopilotData.active.value !== 0
    ) {
      if (
        Math.abs(
          this.digitalInputs.AutopilotData.selectedAltitude - this.digitalInputs.PresentPosition.altitude.value,
        ) >= 500
      ) {
        if (this.digitalInputs.AutopilotData.selectedAltitude > this.digitalInputs.PresentPosition.altitude.value) {
          extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
          extension.Content[0].Value = `CLIMBING TO: ${targetAltitude}`;
          message.Content.push(extension);
        } else {
          extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
          extension.Content[0].Value = `DESCENDING TO: ${targetAltitude}`;
          message.Content.push(extension);
        }

        extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
        extension.Content[0].Value = `VS: ${InputValidation.formatScratchpadVerticalSpeed(`${this.digitalInputs.PresentDynamics.verticalSpeed.value}FTM`)}`;
        message.Content.push(extension);
      }
    }

    // define speed
    const ias = InputValidation.formatScratchpadSpeed(
      this.digitalInputs.PresentDynamics.computedAirspeed.value.toString(),
    );
    const gs = InputValidation.formatScratchpadSpeed(this.digitalInputs.PresentDynamics.groundSpeed.value.toString());
    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
    extension.Content[0].Value = `SPD: ${ias} GS: ${gs}`;
    message.Content.push(extension);

    // define HDG
    const hdg = this.digitalInputs.PresentPosition.heading.value.toString();
    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
    extension.Content[0].Value = `HDG: ${hdg}°TRUE`;
    message.Content.push(extension);

    // define track
    const trk = this.digitalInputs.PresentPosition.track.value.toString();
    extension = CpdlcMessagesDownlink.DM67[1].deepCopy();
    extension.Content[0].Value = `TRK: ${trk}°`;
    message.Content.push(extension);

    // TODO define deviating

    return message;
  }

  public powerUp(): void {
    if (this.poweredUp) return;

    this.messageMonitoring = new UplinkMessageMonitoring(this);
    this.mailboxBus.reset();

    this.messageWatchdogInterval = window.setInterval(() => {
      const ids = this.messageMonitoring.checkMessageConditions();
      ids.forEach((id) => {
        const message = this.messageQueue.find((element) => id === element.UniqueMessageID);

        if (message) {
          UplinkMessageStateMachine.update(this, message, false, true);
          this.mailboxBus.update(message, true);
        }
      });
    }, 5000);

    this.digitalInputs.powerUp();
    this.mailboxBus.powerUp();
    this.poweredUp = true;

    this.digitalOutputs.resetRmpFrequency();
  }

  public powerDown(): void {
    if (!this.poweredUp) return;

    this.digitalOutputs.resetRmpFrequency();

    if (this.messageWatchdogInterval !== null) {
      clearInterval(this.messageWatchdogInterval);
      this.messageWatchdogInterval = null;
    }

    this.atisAutoUpdateIcaos.forEach((entry) => {
      clearInterval(entry[2]);
    });
    this.atisAutoUpdateIcaos = [];

    if (this.handoverInterval !== null) {
      clearInterval(this.handoverInterval);
      this.handoverInterval = null;
    }

    this.handoverOngoing = false;
    this.currentAtc = '';
    this.nextAtc = '';
    this.notificationTime = 0;
    this.messageQueue = [];
    this.printAtisReport = false;
    this.atisAutoUpdateIcaos = [];
    this.atisMessages = new Map();
    this.maxUplinkDelay = -1;
    this.currentFansMode = FansMode.FansNone;
    this.automaticPositionReport = false;
    this.messageWatchdogInterval = null;
    this.messageMonitoring = null;

    this.digitalInputs.powerDown();
    this.mailboxBus.powerDown();
    this.poweredUp = false;
  }

  private newRouteReceived(route: FmsRouteData): void {
    const lastWaypoint = this.digitalInputs.FlightRoute.lastWaypoint;
    const passedWaypoint =
      route.lastWaypoint !== null && (lastWaypoint === null || lastWaypoint.ident !== route.lastWaypoint.ident);

    if (this.automaticPositionReportActive() && this.currentStation() !== '' && passedWaypoint) {
      const message = this.createPositionReport();

      // skip the Mailbox
      message.MailboxRelevantMessage = false;

      this.sendMessage(message);
    }
  }

  constructor(bus: EventBus, synchronizedAoc: boolean, synchronizedRouter: boolean) {
    this.digitalInputs = new DigitalInputs(bus);
    this.digitalOutputs = new DigitalOutputs(bus, synchronizedAoc, synchronizedRouter);
    this.mailboxBus = new MailboxBus(bus, this);
    this.ats623 = new ATS623(this);

    this.digitalInputs.addDataCallback('routeData', (route) => this.newRouteReceived(route));
    this.digitalInputs.addDataCallback('sendMessage', (message) => this.sendMessage(message));
    this.digitalInputs.addDataCallback('updateMessage', (message) => this.updateMessage(message as CpdlcMessage));
    this.digitalInputs.addDataCallback('atcLogon', (station) => this.logon(station));
    this.digitalInputs.addDataCallback('atcLogoff', () => this.logoff());
    this.digitalInputs.addDataCallback('activateAtisAutoUpdate', (data) => this.activateAtisAutoUpdate(data));
    this.digitalInputs.addDataCallback('deactivateAtisAutoUpdate', (icao) => this.deactivateAtisAutoUpdate(icao));
    this.digitalInputs.addDataCallback('togglePrintAtisReportsPrint', () => this.togglePrintAtisReports());
    this.digitalInputs.addDataCallback('setMaxUplinkDelay', (delay) => this.setMaxUplinkDelay(delay));
    this.digitalInputs.addDataCallback('toggleAutomaticPositionReport', () =>
      this.toggleAutomaticPositionReportActive(),
    );
    this.digitalInputs.addDataCallback('requestAtis', (icao, type) => this.receiveAtis(icao, type));
    this.digitalInputs.addDataCallback('positionReportData', () => {
      const machMode = this.digitalInputs.AutopilotData.machMode;

      return {
        flightState: {
          lat: this.digitalInputs.PresentPosition.latitude.value,
          lon: this.digitalInputs.PresentPosition.longitude.value,
          altitude: Math.round(this.digitalInputs.PresentPosition.altitude.value),
          heading: Math.round(this.digitalInputs.PresentPosition.heading.value),
          track: Math.round(this.digitalInputs.PresentPosition.track.value),
          indicatedAirspeed: machMode
            ? this.digitalInputs.PresentDynamics.mach.value
            : Math.round(this.digitalInputs.PresentDynamics.computedAirspeed.value),
          groundSpeed: Math.round(this.digitalInputs.PresentDynamics.groundSpeed.value),
          verticalSpeed: Math.round(this.digitalInputs.PresentDynamics.verticalSpeed.value),
        },
        autopilot: {
          apActive: this.digitalInputs.AutopilotData.active.value !== 0,
          speed: machMode
            ? this.digitalInputs.AutopilotData.selectedMach.value
            : this.digitalInputs.AutopilotData.selectedSpeed.value,
          machMode,
          altitude: this.digitalInputs.AutopilotData.selectedAltitude,
        },
        environment: {
          windDirection: this.digitalInputs.MeteoData.windDirection.value,
          windSpeed: this.digitalInputs.MeteoData.windSpeed.value,
          temperature: this.digitalInputs.MeteoData.staticAirTemperature.value,
        },
        lastWaypoint: this.digitalInputs.FlightRoute.lastWaypoint,
        activeWaypoint: this.digitalInputs.FlightRoute.activeWaypoint,
        nextWaypoint: this.digitalInputs.FlightRoute.nextWaypoint,
        destination: this.digitalInputs.FlightRoute.destination,
      };
    });
    this.digitalInputs.addDataCallback('registerMessages', (messages) => this.insertMessages(messages));
    this.digitalInputs.addDataCallback('messageRead', (uid) => this.messageRead(uid));
    this.digitalInputs.addDataCallback('removeMessage', (uid) => this.removeMessage(uid));
    this.digitalInputs.addDataCallback('cleanupMessages', () => this.cleanupMessages());
    this.digitalInputs.addDataCallback('resetAtisAutoUpdate', () => this.resetAtisAutoUpdate());

    // receive freetext messages for the ATS623
    this.digitalInputs.addDataCallback('receivedFreetextMessage', (message) => {
      if (this.ats623.isRelevantMessage(message)) this.ats623.insertMessages([message]);
    });
    this.digitalInputs.addDataCallback('receivedCpdlcMessage', (message) => this.insertMessages([message]));
  }

  public initialize(): void {
    this.digitalInputs.initialize();
    this.digitalInputs.connectedCallback();
  }

  public async disconnect(): Promise<void> {
    if (this.currentAtc !== '') {
      await this.logoff();
    }
    if (this.nextAtc !== '') {
      this.resetLogon();
    }
  }

  private sendAtcStationStatus(): void {
    this.digitalOutputs.sendAtcConnectionStatus({
      current: this.currentAtc,
      next: this.nextAtc,
      notificationTime: this.notificationTime,
      mode: this.currentFansMode,
      logonInProgress: this.logonInProgress(),
    });
  }

  public currentStation(): string {
    return this.currentAtc;
  }

  private logonInProgress(): boolean {
    return this.nextAtc !== '';
  }

  public updateShownMessageInMailbox(uid: number, recallMessage: boolean): void {
    // no visible message
    if (uid === -1 || recallMessage === true) {
      this.digitalOutputs.resetRmpFrequency();
      return;
    }

    // find the message and check if it is a RMP relevant message
    const message = this.messageQueue.find((message) => message.UniqueMessageID === uid);
    if (message !== undefined && message.Direction === AtsuMessageDirection.Uplink) {
      const type = message.Content[0].TypeId;
      if (type === 'UM117' || type === 'UM120') {
        const bcdFrequency = RadioUtils.packVhfComFrequencyToArinc(
          parseFloat((message.Content[0].Content[1] as CpdlcMessageContentFrequency).Value) * 1000000,
        );
        this.digitalOutputs.sendRmpFrequency(bcdFrequency);
      } else if (type === 'UM118' || type === 'UM119' || type === 'UM121' || type === 'UM122') {
        const bcdFrequency = RadioUtils.packVhfComFrequencyToArinc(
          parseFloat((message.Content[0].Content[2] as CpdlcMessageContentFrequency).Value) * 1000000,
        );
        this.digitalOutputs.sendRmpFrequency(bcdFrequency);
      } else {
        this.digitalOutputs.resetRmpFrequency();
      }
    } else {
      this.digitalOutputs.resetRmpFrequency();
    }
  }

  public resetLogon(): void {
    this.currentAtc = '';
    this.nextAtc = '';
    this.notificationTime = 0;
    this.currentFansMode = FansMode.FansNone;
    this.mailboxBus.setAtcLogonMessage('');

    this.sendAtcStationStatus();
  }

  public async logon(station: string): Promise<AtsuStatusCodes> {
    if (this.nextAtc !== '' && station !== this.nextAtc) {
      return AtsuStatusCodes.SystemBusy;
    }

    if (!this.handoverOngoing && this.currentAtc !== '') {
      const retval = await this.logoff();
      if (retval !== AtsuStatusCodes.Ok) {
        return retval;
      }
    }
    this.handoverOngoing = false;

    const message = new CpdlcMessage();
    message.Station = station;
    message.CurrentTransmissionId = ++this.cpdlcMessageId;
    message.Direction = AtsuMessageDirection.Downlink;
    message.Content.push(CpdlcMessagesDownlink.DM9998[1]);
    message.ComStatus = AtsuMessageComStatus.Sending;
    message.Message = 'REQUEST LOGON';
    message.MailboxRelevantMessage = false;

    this.nextAtc = station;
    this.insertMessages([message]);
    this.mailboxBus.setAtcLogonMessage(`NEXT ATC: ${station}`);
    this.notificationTime = this.digitalInputs.UtcClock.secondsOfDay;

    this.sendAtcStationStatus();

    // check if the logon was successful within five minutes
    setTimeout(() => {
      // check if we have to timeout the logon request
      if (this.logonInProgress()) {
        const currentTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
        const delta = currentTime - this.notificationTime;

        // validate that no second notification is triggered
        if (delta >= 300) {
          this.resetLogon();
        }
      }
    }, 300000);

    return this.digitalOutputs.sendMessage(message, false);
  }

  private async handover(station: string): Promise<AtsuStatusCodes> {
    if (this.nextAtc !== '' && station !== this.nextAtc) {
      return AtsuStatusCodes.SystemBusy;
    }

    return new Promise((resolve, _reject) => {
      // add an interval to check if all messages are answered or sent to ATC
      this.handoverInterval = window.setInterval(() => {
        if (!this.mailboxBus.openMessagesForStation(this.currentAtc)) {
          clearInterval(this.handoverInterval);
          this.handoverInterval = null;

          // add a timer to ensure that the last transmission is already received to avoid ATC software warnings
          setTimeout(() => {
            if (this.currentAtc !== '') {
              this.logoffWithoutReset().then((code) => {
                if (code !== AtsuStatusCodes.Ok) {
                  resolve(code);
                }

                this.handoverOngoing = true;
                this.logon(station).then((code) => resolve(code));
              });
            } else {
              this.handoverOngoing = true;
              this.logon(station).then((code) => resolve(code));
            }
          }, 15000);
        }
      }, 1000);
    });
  }

  private async logoffWithoutReset(): Promise<AtsuStatusCodes> {
    if (this.currentAtc === '') {
      return AtsuStatusCodes.NoAtc;
    }

    const message = new CpdlcMessage();
    message.Station = this.currentAtc;
    message.CurrentTransmissionId = ++this.cpdlcMessageId;
    message.Direction = AtsuMessageDirection.Downlink;
    message.Content.push(CpdlcMessagesDownlink.DM9999[1]);
    message.ComStatus = AtsuMessageComStatus.Sending;
    message.MailboxRelevantMessage = false;

    this.maxUplinkDelay = -1;
    this.digitalOutputs.sendMaxUplinkDelay(this.maxUplinkDelay);
    this.insertMessages([message]);

    return this.digitalOutputs.sendMessage(message, true).then((error) => error);
  }

  public async logoff(): Promise<AtsuStatusCodes> {
    // abort a handover run
    if (this.handoverInterval !== null) {
      clearInterval(this.handoverInterval);
      this.handoverInterval = null;
    }

    return this.logoffWithoutReset().then((error) => {
      this.resetLogon();
      return error;
    });
  }

  private createCpdlcResponse(request: CpdlcMessage, response: number): CpdlcMessage {
    const downlinkId = `DM${response}`;
    if (!(downlinkId in CpdlcMessagesDownlink)) {
      return null;
    }

    // create the meta information of the response
    const responseMessage = new CpdlcMessage();
    responseMessage.Direction = AtsuMessageDirection.Downlink;
    responseMessage.CurrentTransmissionId = ++this.cpdlcMessageId;
    responseMessage.PreviousTransmissionId = request.CurrentTransmissionId;
    responseMessage.Station = request.Station;
    responseMessage.Content.push(CpdlcMessagesDownlink[downlinkId][1]);

    return responseMessage;
  }

  public sendResponse(uid: number, response: number): void {
    if (!this.poweredUp) return;

    const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
    if (message !== undefined) {
      const responseMsg = this.createCpdlcResponse(message, response);

      // avoid double-sends
      if (
        message.Response?.Content[0]?.TypeId === responseMsg.Content[0]?.TypeId &&
        (message.Response?.ComStatus === AtsuMessageComStatus.Sending ||
          message.Response?.ComStatus === AtsuMessageComStatus.Sent)
      ) {
        return;
      }

      message.Response = responseMsg;
      message.Response.ComStatus = AtsuMessageComStatus.Sending;
      this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sending);
      this.mailboxBus.update(message);

      if (message.Response !== undefined) {
        this.digitalOutputs.sendMessage(message.Response, false).then((code) => {
          if (code === AtsuStatusCodes.Ok) {
            message.Response.ComStatus = AtsuMessageComStatus.Sent;
            this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sent);

            setTimeout(() => {
              if (this.mailboxBus.currentMessageStatus(message.UniqueMessageID) === MailboxStatusMessage.Sent) {
                this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.NoMessage);
              }
            }, 5000);
          } else {
            message.Response.ComStatus = AtsuMessageComStatus.Failed;
            this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.SendFailed);
          }

          // update the peripherical devices
          this.mailboxBus.update(message);
          this.digitalOutputs.resynchronizeAtcMessage(message);
        });
      }
    }
  }

  public sendExistingResponse(uid: number): void {
    if (!this.poweredUp) return;

    const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
    if (message !== undefined && message.Response !== undefined) {
      // avoid double-sends
      if (
        message.Response.ComStatus === AtsuMessageComStatus.Sending ||
        message.Response.ComStatus === AtsuMessageComStatus.Sent
      ) {
        return;
      }

      if (message.Response.CurrentTransmissionId < 0) {
        message.Response.CurrentTransmissionId = ++this.cpdlcMessageId;
      }
      message.Response.ComStatus = AtsuMessageComStatus.Sending;
      this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sending);
      this.mailboxBus.update(message);

      this.digitalOutputs.sendMessage(message.Response, false).then((code) => {
        if (code === AtsuStatusCodes.Ok) {
          message.Response.ComStatus = AtsuMessageComStatus.Sent;
          this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sent);
          setTimeout(() => {
            if (this.mailboxBus.currentMessageStatus(message.UniqueMessageID) === MailboxStatusMessage.Sent) {
              this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.NoMessage);
            }
          }, 5000);
        } else {
          message.Response.ComStatus = AtsuMessageComStatus.Failed;
          this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.SendFailed);
        }
        this.mailboxBus.update(message);

        this.digitalOutputs.resynchronizeAtcMessage(message);
      });
    }
  }

  public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
    if (!this.poweredUp) {
      return AtsuStatusCodes.ComFailed;
    }

    if (message.ComStatus === AtsuMessageComStatus.Sending || message.ComStatus === AtsuMessageComStatus.Sent) {
      return AtsuStatusCodes.Ok;
    }

    if (message.Station === '') {
      if (this.currentAtc === '') {
        return AtsuStatusCodes.NoAtc;
      }
      message.Station = this.currentAtc;
    }

    message.ComStatus = AtsuMessageComStatus.Sending;
    if ((message as CpdlcMessage).MailboxRelevantMessage) {
      this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sending);
      this.mailboxBus.update(message as CpdlcMessage);
    }

    return this.digitalOutputs.sendMessage(message, false).then((code) => {
      if (code === AtsuStatusCodes.Ok) {
        message.ComStatus = AtsuMessageComStatus.Sent;
      } else {
        message.ComStatus = AtsuMessageComStatus.Failed;
      }

      if ((message as CpdlcMessage).MailboxRelevantMessage) {
        this.mailboxBus.update(message as CpdlcMessage);

        this.mailboxBus.updateMessageStatus(
          message.UniqueMessageID,
          code === AtsuStatusCodes.Ok ? MailboxStatusMessage.Sent : MailboxStatusMessage.SendFailed,
        );
        if (code === AtsuStatusCodes.Ok) {
          setTimeout(() => {
            if (this.mailboxBus.currentMessageStatus(message.UniqueMessageID) === MailboxStatusMessage.Sent) {
              this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.NoMessage);
            }
          }, 5000);
        }
      }

      // update the internal list
      if (this.messageQueue.findIndex((element) => element.UniqueMessageID === message.UniqueMessageID) !== -1) {
        this.digitalOutputs.resynchronizeAtcMessage(message as CpdlcMessage);
      }

      return code;
    });
  }

  public messages(): AtsuMessage[] {
    return this.messageQueue;
  }

  public monitoredMessages(): CpdlcMessage[] {
    const retval: CpdlcMessage[] = [];

    this.messageMonitoring.monitoredMessageIds().forEach((id) => {
      const message = this.messageQueue.find((elem) => elem.UniqueMessageID === id);
      if (message) {
        retval.push(message);
      }
    });

    return retval;
  }

  public static isRelevantMessage(message: AtsuMessage): boolean {
    return message.Type > AtsuMessageType.AOC && message.Type < AtsuMessageType.ATC;
  }

  public removeMessage(uid: number): boolean {
    const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
    if (index !== -1) {
      this.messageQueue.splice(index, 1);
      this.mailboxBus.dequeue(uid);
      this.digitalOutputs.deleteMessage(uid);
      this.mailboxBus.dequeue(uid);
    }
    return index !== -1;
  }

  private sendAtisReports(): void {
    let reports: AtisMessage[] = [];
    this.atisMessages.forEach((data) => {
      reports = reports.concat(...data[1]);
    });
    this.digitalOutputs.sendAtcAtisReports(reports);
  }

  public cleanupMessages(): void {
    this.messageQueue.forEach((message) => this.digitalOutputs.deleteMessage(message.UniqueMessageID));
    this.messageQueue = [];
    this.mailboxBus.reset();
    this.atisMessages = new Map();
    this.sendAtisReports();
  }

  private analyzeMessage(request: CpdlcMessage, response: CpdlcMessage): boolean {
    if (
      request.Content[0]?.ExpectedResponse === CpdlcMessageExpectedResponseType.NotRequired &&
      response === undefined
    ) {
      // received the station message for the Mailbox
      if (request.Content[0]?.TypeId === 'UM9999') {
        request.MailboxRelevantMessage = false;
        if (this.currentAtc !== '') {
          this.mailboxBus.setAtcLogonMessage(request.Message);
        }
        return true;
      }

      // received a logoff message or service terminated message
      if (request.Content[0]?.TypeId === 'UM9995' || request.Message.includes('TERMINATED')) {
        request.MailboxRelevantMessage = false;
        this.resetLogon();
        return true;
      }

      // process the handover message
      if (request.Content[0]?.TypeId === 'UM9998') {
        const entries = request.Message.split(' ');
        if (entries.length >= 2) {
          request.MailboxRelevantMessage = false;
          const station = entries[1].replace(/@/gi, '');
          this.handover(station);
          return true;
        }
      }
    }

    // expecting a LOGON or denied message
    if (this.nextAtc !== '' && request !== undefined && response !== undefined) {
      if (request.Content[0]?.TypeId === 'DM9998') {
        // logon accepted by ATC
        if (response.Content[0]?.TypeId === 'UM9997') {
          response.MailboxRelevantMessage = false;
          this.mailboxBus.setAtcLogonMessage(`CURRENT ATC UNIT @${this.nextAtc}@ CTL`);
          this.currentFansMode = FutureAirNavigationSystem.currentFansMode(this.nextAtc);
          InputValidation.FANS = this.currentFansMode;
          this.currentAtc = this.nextAtc;
          this.nextAtc = '';
          this.sendAtcStationStatus();
          return true;
        }

        // logon rejected
        if (response.Content[0]?.TypeId === 'UM9996' || response.Content[0]?.TypeId === 'UM0') {
          response.MailboxRelevantMessage = false;
          this.resetLogon();
          return true;
        }
      }
    }

    return false;
  }

  public insertMessages(messages: AtsuMessage[]): void {
    if (!this.poweredUp) return;

    messages.forEach((message) => {
      const cpdlcMessage = message as CpdlcMessage;

      messages.forEach((message) => {
        message.UniqueMessageID = ++this.messageCounter;
        message.Timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
      });

      let concatMessages = true;
      if (cpdlcMessage.Direction === AtsuMessageDirection.Uplink && cpdlcMessage.Content !== undefined) {
        // filter all standard messages and LOGON-related messages
        concatMessages =
          cpdlcMessage.Content[0]?.TypeId === 'UM0' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM1' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM3' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM4' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM5' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM9995' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM9996' ||
          cpdlcMessage.Content[0]?.TypeId === 'UM9997';
      }

      if (cpdlcMessage.Direction === AtsuMessageDirection.Downlink && cpdlcMessage.CurrentTransmissionId === -1) {
        cpdlcMessage.CurrentTransmissionId = ++this.cpdlcMessageId;
      }

      // initialize the uplink message
      if (cpdlcMessage.Direction === AtsuMessageDirection.Uplink) {
        UplinkMessageStateMachine.initialize(this, cpdlcMessage);
      }

      // search corresponding request, if previous ID is set
      if (concatMessages && cpdlcMessage.PreviousTransmissionId !== -1) {
        this.messageQueue.forEach((element) => {
          // ensure that the sending and receiving stations are the same to avoid CPDLC ID overlaps
          if (element.Station === cpdlcMessage.Station) {
            while (element !== null) {
              if (element.CurrentTransmissionId === cpdlcMessage.PreviousTransmissionId) {
                element.Response = cpdlcMessage;
                this.analyzeMessage(element, cpdlcMessage);
                // update the old message with the new answer
                this.digitalOutputs.resynchronizeAtcMessage(element);
                break;
              }
              element = element.Response;
            }
          }
        });
      } else {
        this.messageQueue.unshift(cpdlcMessage);
        this.analyzeMessage(cpdlcMessage, undefined);
        this.digitalOutputs.resynchronizeAtcMessage(cpdlcMessage);
      }
    });

    if (messages.length !== 0 && (messages[0] as CpdlcMessage).MailboxRelevantMessage) {
      this.mailboxBus.enqueue(messages);
    }
  }

  public updateMessage(message: CpdlcMessage): void {
    const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === message.UniqueMessageID);
    if (index !== -1) {
      this.messageQueue[index] = message;
      this.mailboxBus.update(message);
    }
  }

  public messageRead(uid: number): boolean {
    const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
    if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Uplink) {
      this.messageQueue[index].Confirmed = true;
      this.digitalOutputs.resynchronizeAtcMessage(this.messageQueue[index]);
    }

    return index !== -1;
  }

  private async updateAtis(icao: string, type: AtisType, overwrite: boolean): Promise<AtsuStatusCodes> {
    return this.digitalOutputs
      .receiveAtis(icao, type, () => {})
      .then((retval) => {
        if (retval[0] === AtsuStatusCodes.Ok) {
          const atis = Conversion.messageDataToMessage(retval[1]) as AtisMessage;
          let code = AtsuStatusCodes.Ok;

          atis.Timestamp = AtsuTimestamp.fromClock(this.digitalInputs.UtcClock);
          atis.parseInformation();

          let printable = false;

          if (atis.Information === '') {
            return AtsuStatusCodes.NoAtisReceived;
          }

          let resynchronizeFms = false;

          if (this.atisMessages.get(icao) !== undefined) {
            if (this.atisMessages.get(icao)[1][0].Information !== atis.Information) {
              this.atisMessages.get(icao)[1].unshift(atis);
              code = AtsuStatusCodes.NewAtisReceived;
              resynchronizeFms = true;
              printable = true;
            } else if (overwrite) {
              this.atisMessages.get(icao)[1][0] = atis;
              code = AtsuStatusCodes.NewAtisReceived;
              resynchronizeFms = true;
            }
          } else {
            this.atisMessages.set(icao, [atis.Timestamp.Seconds, [atis]]);
            code = AtsuStatusCodes.NewAtisReceived;
            resynchronizeFms = true;
            printable = true;
          }

          this.atisMessages.get(icao)[0] = atis.Timestamp.Seconds;
          if (resynchronizeFms) {
            this.sendAtisReports();
          }

          if (this.printAtisReport && printable) {
            this.digitalOutputs.sendPrintMessage(atis);
          }

          return code;
        }

        return retval[0];
      });
  }

  public togglePrintAtisReports() {
    this.printAtisReport = !this.printAtisReport;
    this.digitalOutputs.sendPrintAtisReportsPrint(this.printAtisReport);
  }

  public printAtisReportsPrint(): boolean {
    return this.printAtisReport;
  }

  public async receiveAtis(icao: string, type: AtisType): Promise<AtsuStatusCodes> {
    return this.updateAtis(icao, type, true);
  }

  public resetAtisAutoUpdate() {
    this.atisAutoUpdateIcaos.forEach((elem) => clearInterval(elem[2]));
    this.atisAutoUpdateIcaos = [];
    this.digitalOutputs.sendActiveAtisAutoUpdates([]);
  }

  public atisAutoUpdateActive(icao: string): boolean {
    return this.atisAutoUpdateIcaos.findIndex((elem) => icao === elem[0]) !== -1;
  }

  private automaticAtisUpdater(icao: string, type: AtisType) {
    if (this.atisMessages.has(icao)) {
      this.updateAtis(icao, type, false).then((code) => {
        if (code === AtsuStatusCodes.Ok) {
          this.atisMessages.get(icao)[0] = this.digitalInputs.UtcClock.secondsOfDay;
        } else {
          this.digitalOutputs.sendSystemStatus(code);
        }
      });
    } else {
      this.updateAtis(icao, type, false).then((code) => {
        if (code !== AtsuStatusCodes.Ok) {
          this.digitalOutputs.sendSystemStatus(code);
        }
      });
    }
  }

  public activateAtisAutoUpdate(data: { icao: string; type: AtisType }): void {
    if (this.atisAutoUpdateIcaos.find((elem) => elem[0] === data.icao) === undefined) {
      const updater = window.setInterval(() => this.automaticAtisUpdater(data.icao, data.type), 60000);
      this.atisAutoUpdateIcaos.push([data.icao, data.type, updater]);

      const icaos: string[] = [];
      this.atisAutoUpdateIcaos.forEach((airport) => icaos.push(airport[0]));
      this.digitalOutputs.sendActiveAtisAutoUpdates(icaos);
    }
  }

  public deactivateAtisAutoUpdate(icao: string): void {
    const idx = this.atisAutoUpdateIcaos.findIndex((elem) => icao === elem[0]);
    if (idx >= 0) {
      clearInterval(this.atisAutoUpdateIcaos[idx][2]);
      this.atisAutoUpdateIcaos.splice(idx, 1);

      const icaos: string[] = [];
      this.atisAutoUpdateIcaos.forEach((airport) => icaos.push(airport[0]));
      this.digitalOutputs.sendActiveAtisAutoUpdates(icaos);
    }
  }

  public fansMode(): FansMode {
    return this.currentFansMode;
  }

  public automaticPositionReportActive(): boolean {
    return this.automaticPositionReport;
  }

  public toggleAutomaticPositionReportActive(): void {
    this.automaticPositionReport = !this.automaticPositionReport;
    this.digitalOutputs.sendAutomaticPositionReportActive(this.automaticPositionReport);
  }

  public setMaxUplinkDelay(delay: number): void {
    this.maxUplinkDelay = delay;
    this.digitalOutputs.sendMaxUplinkDelay(this.maxUplinkDelay);
  }
}
