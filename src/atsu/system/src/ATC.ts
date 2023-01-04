//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { InputValidation } from '@atsu/common/components/InputValidation';
import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import { MailboxStatusMessage } from '@atsu/common/databus/Mailbox';
import { AtisMessage, AtisType } from '@atsu/common/messages/AtisMessage';
import { AtsuTimestamp } from '@atsu/common/messages/AtsuTimestamp';
import { AtsuMessageComStatus, AtsuMessage, AtsuMessageType, AtsuMessageDirection } from '@atsu/common/messages/AtsuMessage';
import { CpdlcMessagesDownlink, CpdlcMessageExpectedResponseType } from '@atsu/common/messages/CpdlcMessageElements';
import { CpdlcMessage } from '@atsu/common/messages/CpdlcMessage';
import { FansMode, FutureAirNavigationSystem } from '@atsu/common/com/FutureAirNavigationSystem';
import { Atsu } from './ATSU';
import { MailboxBus } from './databus/MailboxBus';
import { UplinkMessageStateMachine } from './components/UplinkMessageStateMachine';
import { UplinkMessageMonitoring } from './components/UplinkMessageMonitoring';

/*
 * Defines the ATC system for CPDLC communication
 */
export class Atc {
    private atsu: Atsu = null;

    public mailboxBus: MailboxBus = null;

    private handoverInterval: NodeJS.Timer = null;

    private handoverOngoing = false;

    private currentAtc = '';

    private nextAtc = '';

    private notificationTime = 0;

    private cpdlcMessageId = 0;

    private messageQueue: CpdlcMessage[] = [];

    private printAtisReport = false;

    private atisAutoUpdateIcaos: [string, AtisType, NodeJS.Timer][] = [];

    private atisMessages: Map<string, [number, AtisMessage[]]> = new Map();

    private maxUplinkDelay: number = -1;

    private currentFansMode: FansMode = FansMode.FansNone;

    private automaticPositionReport: boolean = false;

    public messageMonitoring: UplinkMessageMonitoring = null;

    constructor(atsu: Atsu) {
        this.atsu = atsu;
        this.mailboxBus = new MailboxBus(atsu, this);
        this.messageMonitoring = new UplinkMessageMonitoring(atsu);

        setInterval(() => {
            const ids = this.messageMonitoring.checkMessageConditions();
            ids.forEach((id) => {
                const message = this.messageQueue.find((element) => id === element.UniqueMessageID);
                if (message) {
                    UplinkMessageStateMachine.update(this.atsu, message, false, true);
                    this.mailboxBus.update(message, true);
                }
            });
        }, 5000);
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
        this.atsu.digitalOutputs.FmsBus.sendAtcConnectionStatus({
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
        this.atsu.registerMessages([message]);
        this.mailboxBus.setAtcLogonMessage(`NEXT ATC: ${station}`);
        this.notificationTime = this.atsu.digitalInputs.UtcClock.secondsOfDay;

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

        return this.atsu.datalink.sendMessage(message, false);
    }

    private async handover(station: string): Promise<AtsuStatusCodes> {
        if (this.nextAtc !== '' && station !== this.nextAtc) {
            return AtsuStatusCodes.SystemBusy;
        }

        return new Promise((resolve, _reject) => {
            // add an interval to check if all messages are answered or sent to ATC
            this.handoverInterval = setInterval(() => {
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
        this.atsu.digitalOutputs.FmsBus.sendMaxUplinkDelay(this.maxUplinkDelay);
        this.atsu.registerMessages([message]);

        return this.atsu.datalink.sendMessage(message, true).then((error) => error);
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
        const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            const responseMsg = this.createCpdlcResponse(message, response);

            // avoid double-sends
            if (message.Response?.Content[0]?.TypeId === responseMsg.Content[0]?.TypeId
            && (message.Response?.ComStatus === AtsuMessageComStatus.Sending || message.Response?.ComStatus === AtsuMessageComStatus.Sent)) {
                return;
            }

            message.Response = responseMsg;
            message.Response.ComStatus = AtsuMessageComStatus.Sending;
            this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sending);
            this.mailboxBus.update(message);

            if (message.Response !== undefined) {
                this.atsu.datalink.sendMessage(message.Response, false).then((code) => {
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
                    this.atsu.digitalOutputs.FmsBus.resynchronizeAtcMessage(message);
                });
            }
        }
    }

    public sendExistingResponse(uid: number): void {
        const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
        if (message !== undefined && message.Response !== undefined) {
            // avoid double-sends
            if (message.Response.ComStatus === AtsuMessageComStatus.Sending || message.Response.ComStatus === AtsuMessageComStatus.Sent) {
                return;
            }

            if (message.Response.CurrentTransmissionId < 0) {
                message.Response.CurrentTransmissionId = ++this.cpdlcMessageId;
            }
            message.Response.ComStatus = AtsuMessageComStatus.Sending;
            this.mailboxBus.updateMessageStatus(message.UniqueMessageID, MailboxStatusMessage.Sending);
            this.mailboxBus.update(message);

            this.atsu.datalink.sendMessage(message.Response, false).then((code) => {
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

                this.atsu.digitalOutputs.FmsBus.resynchronizeAtcMessage(message);
            });
        }
    }

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
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

        return this.atsu.datalink.sendMessage(message, false).then((code) => {
            if (code === AtsuStatusCodes.Ok) {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }

            if ((message as CpdlcMessage).MailboxRelevantMessage) {
                this.mailboxBus.update(message as CpdlcMessage);

                this.mailboxBus.updateMessageStatus(message.UniqueMessageID, code === AtsuStatusCodes.Ok ? MailboxStatusMessage.Sent : MailboxStatusMessage.SendFailed);
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
                this.atsu.digitalOutputs.FmsBus.resynchronizeAtcMessage(message as CpdlcMessage);
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
            this.atsu.digitalOutputs.FmsBus.deleteMessage(uid);
        }
        return index !== -1;
    }

    private sendAtisReports(): void {
        const reports: Map<string, AtisMessage[]> = new Map();
        this.atisMessages.forEach((data, icao) => reports.set(icao, data[1]));
        this.atsu.digitalOutputs.FmsBus.sendAtcAtisReports(reports);
    }

    public cleanupMessages(): void {
        this.messageQueue.forEach((message) => this.atsu.digitalOutputs.FmsBus.deleteMessage(message.UniqueMessageID));
        this.messageQueue = [];
        this.mailboxBus.reset();
        this.atisMessages = new Map();
        this.sendAtisReports();
    }

    private analyzeMessage(request: CpdlcMessage, response: CpdlcMessage): boolean {
        if (request.Content[0]?.ExpectedResponse === CpdlcMessageExpectedResponseType.NotRequired && response === undefined) {
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
        messages.forEach((message) => {
            const cpdlcMessage = message as CpdlcMessage;

            let concatMessages = true;
            if (cpdlcMessage.Direction === AtsuMessageDirection.Uplink && cpdlcMessage.Content !== undefined) {
                // filter all standard messages and LOGON-related messages
                concatMessages = cpdlcMessage.Content[0]?.TypeId === 'UM0' || cpdlcMessage.Content[0]?.TypeId === 'UM1' || cpdlcMessage.Content[0]?.TypeId === 'UM3'
                                 || cpdlcMessage.Content[0]?.TypeId === 'UM4' || cpdlcMessage.Content[0]?.TypeId === 'UM5' || cpdlcMessage.Content[0]?.TypeId === 'UM9995'
                                 || cpdlcMessage.Content[0]?.TypeId === 'UM9996' || cpdlcMessage.Content[0]?.TypeId === 'UM9997';
            }

            if (cpdlcMessage.Direction === AtsuMessageDirection.Downlink && cpdlcMessage.CurrentTransmissionId === -1) {
                cpdlcMessage.CurrentTransmissionId = ++this.cpdlcMessageId;
            }

            // initialize the uplink message
            if (cpdlcMessage.Direction === AtsuMessageDirection.Uplink) {
                UplinkMessageStateMachine.initialize(this.atsu, cpdlcMessage);
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
                                this.atsu.digitalOutputs.FmsBus.resynchronizeAtcMessage(element);
                                break;
                            }
                            element = element.Response;
                        }
                    }
                });
            } else {
                this.messageQueue.unshift(cpdlcMessage);
                this.analyzeMessage(cpdlcMessage, undefined);
                this.atsu.digitalOutputs.FmsBus.resynchronizeAtcMessage(cpdlcMessage);
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
            this.atsu.digitalOutputs.FmsBus.resynchronizeAtcMessage(this.messageQueue[index]);
        }

        return index !== -1;
    }

    private async updateAtis(icao: string, type: AtisType, overwrite: boolean): Promise<AtsuStatusCodes> {
        return this.atsu.datalink.receiveAtis(icao, type, () => { }).then((retval) => {
            if (retval[0] === AtsuStatusCodes.Ok) {
                let code = AtsuStatusCodes.Ok;
                const atis = retval[1] as AtisMessage;
                atis.Timestamp = new AtsuTimestamp();
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
                    this.atsu.printMessage(atis);
                }

                return code;
            }

            return retval[0];
        });
    }

    public togglePrintAtisReports() {
        this.printAtisReport = !this.printAtisReport;
        this.atsu.digitalOutputs.FmsBus.sendPrintAtisReportsPrint(this.printAtisReport);
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
        this.atsu.digitalOutputs.FmsBus.sendActiveAtisAutoUpdates([]);
    }

    public atisAutoUpdateActive(icao: string): boolean {
        return this.atisAutoUpdateIcaos.findIndex((elem) => icao === elem[0]) !== -1;
    }

    private automaticAtisUpdater(icao: string, type: AtisType) {
        if (this.atisMessages.has(icao)) {
            this.updateAtis(icao, type, false).then((code) => {
                if (code === AtsuStatusCodes.Ok) {
                    this.atisMessages.get(icao)[0] = this.atsu.digitalInputs.UtcClock.secondsOfDay;
                } else {
                    this.atsu.publishAtsuStatusCode(code);
                }
            });
        } else {
            this.updateAtis(icao, type, false).then((code) => {
                if (code !== AtsuStatusCodes.Ok) {
                    this.atsu.publishAtsuStatusCode(code);
                }
            });
        }
    }

    public activateAtisAutoUpdate(data: { icao: string; type: AtisType }): void {
        if (this.atisAutoUpdateIcaos.find((elem) => elem[0] === data.icao) === undefined) {
            const updater = setInterval(() => this.automaticAtisUpdater(data.icao, data.type), 60000);
            this.atisAutoUpdateIcaos.push([data.icao, data.type, updater]);

            const icaos: string[] = [];
            this.atisAutoUpdateIcaos.forEach((airport) => icaos.push(airport[0]));
            this.atsu.digitalOutputs.FmsBus.sendActiveAtisAutoUpdates(icaos);
        }
    }

    public deactivateAtisAutoUpdate(icao: string): void {
        const idx = this.atisAutoUpdateIcaos.findIndex((elem) => icao === elem[0]);
        if (idx >= 0) {
            clearInterval(this.atisAutoUpdateIcaos[idx][2]);
            this.atisAutoUpdateIcaos.splice(idx, 1);

            const icaos: string[] = [];
            this.atisAutoUpdateIcaos.forEach((airport) => icaos.push(airport[0]));
            this.atsu.digitalOutputs.FmsBus.sendActiveAtisAutoUpdates(icaos);
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
        this.atsu.digitalOutputs.FmsBus.sendAutomaticPositionReportActive(this.automaticPositionReport);
    }

    public setMaxUplinkDelay(delay: number): void {
        this.maxUplinkDelay = delay;
        this.atsu.digitalOutputs.FmsBus.sendMaxUplinkDelay(this.maxUplinkDelay);
    }
}
