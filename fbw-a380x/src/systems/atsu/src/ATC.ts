//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { InputValidation } from './InputValidation';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { AtisMessage, AtisType } from './messages/AtisMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { AtsuMessageComStatus, AtsuMessage, AtsuMessageType, AtsuMessageDirection } from './messages/AtsuMessage';
import { CpdlcMessagesDownlink, CpdlcMessageExpectedResponseType } from './messages/CpdlcMessageElements';
import { CpdlcMessage } from './messages/CpdlcMessage';
import { Datalink } from './com/Datalink';
import { Atsu } from './ATSU';
import { DcduStatusMessage, DcduLink } from './components/DcduLink';
import { FansMode, FutureAirNavigationSystem } from './com/FutureAirNavigationSystem';
import { UplinkMessageStateMachine } from './components/UplinkMessageStateMachine';
import { UplinkMessageMonitoring } from './components/UplinkMessageMonitoring';

/*
 * Defines the ATC system for CPDLC communication
 */
export class Atc {
    private parent: Atsu = null;

    private datalink: Datalink = null;

    private dcduLink: DcduLink = null;

    private handoverInterval: number = 0;

    private handoverOngoing = false;

    private currentAtc = '';

    private nextAtc = '';

    private notificationTime = 0;

    private cpdlcMessageId = 0;

    private messageQueue: CpdlcMessage[] = [];

    private printAtisReport = false;

    private atisAutoUpdateIcaos: [string, AtisType, number][] = [];

    private atisMessages: Map<string, [number, AtisMessage[]]> = new Map();

    public maxUplinkDelay: number = -1;

    private currentFansMode: FansMode = FansMode.FansNone;

    private automaticPositionReport: boolean = false;

    public messageMonitoring: UplinkMessageMonitoring = null;

    constructor(parent: Atsu, datalink: Datalink) {
        this.parent = parent;
        this.datalink = datalink;
        this.dcduLink = new DcduLink(parent, this);
        this.messageMonitoring = new UplinkMessageMonitoring(parent);

        setInterval(() => {
            const ids = this.messageMonitoring.checkMessageConditions();
            ids.forEach((id) => {
                const message = this.messageQueue.find((element) => id === element.UniqueMessageID);
                if (message) {
                    UplinkMessageStateMachine.update(this.parent, message, false, true);
                    this.dcduLink.update(message, true);
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

    public currentStation(): string {
        return this.currentAtc;
    }

    public nextStation(): string {
        return this.nextAtc;
    }

    public nextStationNotificationTime(): number {
        return this.notificationTime;
    }

    public logonInProgress(): boolean {
        return this.nextAtc !== '';
    }

    public resetLogon(): void {
        this.currentAtc = '';
        this.nextAtc = '';
        this.notificationTime = 0;
        this.dcduLink.setAtcLogonMessage('');
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
        message.DcduRelevantMessage = false;

        this.nextAtc = station;
        this.parent.registerMessages([message]);
        this.dcduLink.setAtcLogonMessage(`NEXT ATC: ${station}`);
        this.notificationTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');

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

        return this.datalink.sendMessage(message, false);
    }

    private async handover(station: string): Promise<AtsuStatusCodes> {
        if (this.nextAtc !== '' && station !== this.nextAtc) {
            return AtsuStatusCodes.SystemBusy;
        }

        return new Promise((resolve, _reject) => {
            // add an interval to check if all messages are answered or sent to ATC
            this.handoverInterval = setInterval(() => {
                if (!this.dcduLink.openMessagesForStation(this.currentAtc)) {
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
        message.DcduRelevantMessage = false;

        this.maxUplinkDelay = -1;
        this.parent.registerMessages([message]);

        return this.datalink.sendMessage(message, true).then((error) => error);
    }

    public async logoff(): Promise<AtsuStatusCodes> {
        // abort a handover run
        if (this.handoverInterval !== undefined) {
            clearInterval(this.handoverInterval);
            this.handoverInterval = undefined;
        }

        return this.logoffWithoutReset().then((error) => {
            this.dcduLink.setAtcLogonMessage('');
            this.currentFansMode = FansMode.FansNone;
            this.currentAtc = '';
            this.nextAtc = '';
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
            this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.Sending);
            this.dcduLink.update(message);

            if (this.parent.modificationMessage?.UniqueMessageID === uid) {
                this.parent.modificationMessage = null;
            }

            if (message.Response !== undefined) {
                this.datalink.sendMessage(message.Response, false).then((code) => {
                    if (code === AtsuStatusCodes.Ok) {
                        message.Response.ComStatus = AtsuMessageComStatus.Sent;
                        this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.Sent);
                        setTimeout(() => {
                            if (this.dcduLink.currentDcduStatusMessage(message.UniqueMessageID) === DcduStatusMessage.Sent) {
                                this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.NoMessage);
                            }
                        }, 5000);
                    } else {
                        message.Response.ComStatus = AtsuMessageComStatus.Failed;
                        this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.SendFailed);
                    }
                    this.dcduLink.update(message);
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
            this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.Sending);
            this.dcduLink.update(message);

            this.datalink.sendMessage(message.Response, false).then((code) => {
                if (code === AtsuStatusCodes.Ok) {
                    message.Response.ComStatus = AtsuMessageComStatus.Sent;
                    this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.Sent);
                    setTimeout(() => {
                        if (this.dcduLink.currentDcduStatusMessage(message.UniqueMessageID) === DcduStatusMessage.Sent) {
                            this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.NoMessage);
                        }
                    }, 5000);
                } else {
                    message.Response.ComStatus = AtsuMessageComStatus.Failed;
                    this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.SendFailed);
                }
                this.dcduLink.update(message);
            });

            if (this.parent.modificationMessage?.UniqueMessageID === uid) {
                this.parent.modificationMessage = null;
            }
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
        if ((message as CpdlcMessage).DcduRelevantMessage) {
            this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.Sending);
            this.dcduLink.update(message as CpdlcMessage);
        }

        if (this.parent.modificationMessage?.UniqueMessageID === message.UniqueMessageID) {
            this.parent.modificationMessage = null;
        }

        return this.datalink.sendMessage(message, false).then((code) => {
            if (code === AtsuStatusCodes.Ok) {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }

            if ((message as CpdlcMessage).DcduRelevantMessage) {
                this.dcduLink.update(message as CpdlcMessage);

                this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, code === AtsuStatusCodes.Ok ? DcduStatusMessage.Sent : DcduStatusMessage.SendFailed);
                if (code === AtsuStatusCodes.Ok) {
                    setTimeout(() => {
                        if (this.dcduLink.currentDcduStatusMessage(message.UniqueMessageID) === DcduStatusMessage.Sent) {
                            this.dcduLink.updateDcduStatusMessage(message.UniqueMessageID, DcduStatusMessage.NoMessage);
                        }
                    }, 5000);
                }
            }

            return code;
        });
    }

    public messages(): AtsuMessage[] {
        return this.messageQueue;
    }

    public monitoredMessages(): AtsuMessage[] {
        const retval: AtsuMessage[] = [];

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
            this.dcduLink.dequeue(uid);
        }
        return index !== -1;
    }

    public cleanupMessages(): void {
        this.messageQueue = [];
        this.dcduLink.reset();
        this.atisMessages = new Map();
    }

    private analyzeMessage(request: CpdlcMessage, response: CpdlcMessage): boolean {
        if (request.Content[0]?.ExpectedResponse === CpdlcMessageExpectedResponseType.NotRequired && response === undefined) {
            // received the station message for the DCDU
            if (request.Content[0]?.TypeId === 'UM9999') {
                request.DcduRelevantMessage = false;
                if (this.currentAtc !== '') {
                    this.dcduLink.setAtcLogonMessage(request.Message);
                }
                return true;
            }

            // received a logoff message
            if (request.Content[0]?.TypeId === 'UM9995') {
                request.DcduRelevantMessage = false;
                this.dcduLink.setAtcLogonMessage('');
                this.currentAtc = '';
                return true;
            }

            // received a service terminated message
            if (request.Message.includes('TERMINATED')) {
                request.DcduRelevantMessage = false;
                this.dcduLink.setAtcLogonMessage('');
                this.currentAtc = '';
                return true;
            }

            // process the handover message
            if (request.Content[0]?.TypeId === 'UM9998') {
                const entries = request.Message.split(' ');
                if (entries.length >= 2) {
                    request.DcduRelevantMessage = false;
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
                    response.DcduRelevantMessage = false;
                    this.dcduLink.setAtcLogonMessage(`CURRENT ATC UNIT @${this.nextAtc}@`);
                    this.currentFansMode = FutureAirNavigationSystem.currentFansMode(this.nextAtc);
                    InputValidation.FANS = this.currentFansMode;
                    this.currentAtc = this.nextAtc;
                    this.nextAtc = '';
                    return true;
                }

                // logon rejected
                if (response.Content[0]?.TypeId === 'UM9996' || response.Content[0]?.TypeId === 'UM0') {
                    response.DcduRelevantMessage = false;
                    this.dcduLink.setAtcLogonMessage('');
                    this.currentAtc = '';
                    this.nextAtc = '';
                    return true;
                }
            }
        }

        // TODO later analyze requests by ATC
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
                UplinkMessageStateMachine.initialize(this.parent, cpdlcMessage);
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
                                break;
                            }
                            element = element.Response;
                        }
                    }
                });
            } else {
                this.messageQueue.unshift(cpdlcMessage);
                this.analyzeMessage(cpdlcMessage, undefined);
            }
        });

        if (messages.length !== 0 && (messages[0] as CpdlcMessage).DcduRelevantMessage) {
            this.dcduLink.enqueue(messages);
        }
    }

    public updateMessage(message: CpdlcMessage): void {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === message.UniqueMessageID);
        if (index !== -1) {
            if (this.parent.modificationMessage?.UniqueMessageID === message.UniqueMessageID) {
                this.parent.modificationMessage = undefined;
            }

            this.messageQueue[index] = message;
            this.dcduLink.update(message);
        }
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Uplink) {
            this.messageQueue[index].Confirmed = true;
        }

        return index !== -1;
    }

    private async updateAtis(icao: string, type: AtisType, overwrite: boolean): Promise<AtsuStatusCodes> {
        return this.datalink.receiveAtis(icao, type, () => { }).then((retval) => {
            if (retval[0] === AtsuStatusCodes.Ok) {
                let code = AtsuStatusCodes.Ok;
                const atis = retval[1] as AtisMessage;
                atis.Timestamp = new AtsuTimestamp();
                atis.parseInformation();
                let printable = false;

                if (atis.Information === '') {
                    return AtsuStatusCodes.NoAtisReceived;
                }

                if (this.atisMessages.get(icao) !== undefined) {
                    if (this.atisMessages.get(icao)[1][0].Information !== atis.Information) {
                        this.atisMessages.get(icao)[1].unshift(atis);
                        code = AtsuStatusCodes.NewAtisReceived;
                        printable = true;
                    } else if (overwrite) {
                        this.atisMessages.get(icao)[1][0] = atis;
                        code = AtsuStatusCodes.NewAtisReceived;
                    }
                } else {
                    this.atisMessages.set(icao, [atis.Timestamp.Seconds, [atis]]);
                    code = AtsuStatusCodes.NewAtisReceived;
                    printable = true;
                }

                this.atisMessages.get(icao)[0] = atis.Timestamp.Seconds;

                if (this.printAtisReport && printable) {
                    this.parent.printMessage(atis);
                }

                return code;
            }

            return retval[0];
        });
    }

    public togglePrintAtisReports() {
        this.printAtisReport = !this.printAtisReport;
    }

    public printAtisReportsPrint(): boolean {
        return this.printAtisReport;
    }

    public async receiveAtis(icao: string, type: AtisType): Promise<AtsuStatusCodes> {
        return this.updateAtis(icao, type, true);
    }

    public atisReports(icao: string): AtisMessage[] {
        if (this.atisMessages.has(icao)) {
            return this.atisMessages.get(icao)[1];
        }
        return [];
    }

    public resetAtisAutoUpdate() {
        this.atisAutoUpdateIcaos.forEach((elem) => clearInterval(elem[2]));
        this.atisAutoUpdateIcaos = [];
    }

    public atisAutoUpdateActive(icao: string): boolean {
        return this.atisAutoUpdateIcaos.findIndex((elem) => icao === elem[0]) !== -1;
    }

    private automaticAtisUpdater(icao: string, type: AtisType) {
        if (this.atisMessages.has(icao)) {
            this.updateAtis(icao, type, false).then((code) => {
                if (code === AtsuStatusCodes.Ok) {
                    this.atisMessages.get(icao)[0] = new AtsuTimestamp().Seconds;
                } else {
                    this.parent.publishAtsuStatusCode(code);
                }
            });
        } else {
            this.updateAtis(icao, type, false).then((code) => {
                if (code !== AtsuStatusCodes.Ok) {
                    this.parent.publishAtsuStatusCode(code);
                }
            });
        }
    }

    public activateAtisAutoUpdate(icao: string, type: AtisType): void {
        if (this.atisAutoUpdateIcaos.find((elem) => elem[0] === icao) === undefined) {
            const updater = setInterval(() => this.automaticAtisUpdater(icao, type), 60000);
            this.atisAutoUpdateIcaos.push([icao, type, updater]);
        }
    }

    public deactivateAtisAutoUpdate(icao: string): void {
        const idx = this.atisAutoUpdateIcaos.findIndex((elem) => icao === elem[0]);
        if (idx >= 0) {
            clearInterval(this.atisAutoUpdateIcaos[idx][2]);
            this.atisAutoUpdateIcaos.splice(idx, 1);
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
    }
}
