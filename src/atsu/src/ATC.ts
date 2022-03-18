//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { HoppieConnector } from './com/HoppieConnector';
import { AtsuStatusCodes } from './AtsuStatusCodes';
import { AtisMessage, AtisType } from './messages/AtisMessage';
import { AtsuTimestamp } from './messages/AtsuTimestamp';
import { AtsuMessageComStatus, AtsuMessage, AtsuMessageType, AtsuMessageDirection } from './messages/AtsuMessage';
import { CpdlcMessageResponse, CpdlcMessageRequestedResponseType, CpdlcMessage } from './messages/CpdlcMessage';
import { Datalink } from './com/Datalink';
import { Atsu } from './ATSU';
import { DcduLink } from './components/DcduLink';

/*
 * Defines the ATC system for CPDLC communication
 */
export class Atc {
    private parent: Atsu | undefined = undefined;

    private datalink: Datalink | undefined = undefined;

    private dcduLink: DcduLink | undefined = undefined;

    private cdplcResetRequired = false;

    private currentAtc = '';

    private nextAtc = '';

    private notificationTime = 0;

    private cpdlcMessageId = 0;

    private messageQueue: CpdlcMessage[] = [];

    private printAtisReport = false;

    private atisAutoUpdateIcaos: [string, AtisType, number][] = [];

    private atisMessages: Map<string, [number, AtisMessage[]]> = new Map();

    public maxUplinkDelay: number = -1;

    constructor(parent: Atsu, datalink: Datalink) {
        this.parent = parent;
        this.datalink = datalink;
        this.dcduLink = new DcduLink(parent, this);
    }

    public resetAtc() {
        if (this.cdplcResetRequired) {
            if (this.currentAtc !== '') {
                this.logoff();
            }
            if (this.nextAtc !== '') {
                this.resetLogon();
            }

            this.cdplcResetRequired = false;
        }
    }

    public async connect(flightNo: string): Promise<AtsuStatusCodes> {
        if (this.currentAtc !== '') {
            await this.logoff();
        }
        return HoppieConnector.connect(flightNo).then((code) => {
            if (code === AtsuStatusCodes.Ok) {
                this.cdplcResetRequired = true;
            }
            return code;
        });
    }

    public async disconnect(): Promise<AtsuStatusCodes> {
        return HoppieConnector.disconnect();
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

        if (this.currentAtc !== '') {
            const retval = await this.logoff();
            if (retval !== AtsuStatusCodes.Ok) {
                return retval;
            }
        }

        const message = new CpdlcMessage();
        message.Station = station;
        message.CurrentTransmissionId = ++this.cpdlcMessageId;
        message.Direction = AtsuMessageDirection.Output;
        message.RequestedResponses = CpdlcMessageRequestedResponseType.Yes;
        message.ComStatus = AtsuMessageComStatus.Sending;
        message.Message = 'REQUEST LOGON';
        message.DcduRelevantMessage = false;

        this.nextAtc = station;
        this.parent.registerMessage(message);
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

        if (this.currentAtc !== '') {
            const retval = await this.logoffWithoutReset();
            if (retval !== AtsuStatusCodes.Ok) {
                return retval;
            }
        }

        return this.logon(station);
    }

    private async logoffWithoutReset(): Promise<AtsuStatusCodes> {
        if (this.currentAtc === '') {
            return AtsuStatusCodes.NoAtc;
        }

        const message = new CpdlcMessage();
        message.Station = this.currentAtc;
        message.CurrentTransmissionId = ++this.cpdlcMessageId;
        message.Direction = AtsuMessageDirection.Output;
        message.RequestedResponses = CpdlcMessageRequestedResponseType.No;
        message.ComStatus = AtsuMessageComStatus.Sending;
        message.Message = 'LOGOFF';
        message.DcduRelevantMessage = false;

        this.maxUplinkDelay = -1;
        this.parent.registerMessage(message);

        return this.datalink.sendMessage(message, true).then((error) => error);
    }

    public async logoff(): Promise<AtsuStatusCodes> {
        return this.logoffWithoutReset().then((error) => {
            this.dcduLink.setAtcLogonMessage('');
            this.currentAtc = '';
            this.nextAtc = '';
            return error;
        });
    }

    private createCpdlcResponse(request: CpdlcMessage) {
        // create the meta information of the response
        const response = new CpdlcMessage();
        response.Direction = AtsuMessageDirection.Output;
        response.CurrentTransmissionId = ++this.cpdlcMessageId;
        response.PreviousTransmissionId = request.CurrentTransmissionId;
        response.RequestedResponses = CpdlcMessageRequestedResponseType.No;
        response.Station = request.Station;

        // create the answer text
        switch (request.ResponseType) {
        case CpdlcMessageResponse.Acknowledge:
            response.Message = 'ACKNOWLEDGE';
            break;
        case CpdlcMessageResponse.Affirm:
            response.Message = 'AFFIRM';
            break;
        case CpdlcMessageResponse.Negative:
            response.Message = 'NEGATIVE';
            break;
        case CpdlcMessageResponse.Refuse:
            response.Message = 'REFUSE';
            break;
        case CpdlcMessageResponse.Roger:
            response.Message = 'ROGER';
            break;
        case CpdlcMessageResponse.Standby:
            response.Message = 'STANDBY';
            break;
        case CpdlcMessageResponse.Unable:
            response.Message = 'UNABLE';
            break;
        case CpdlcMessageResponse.Wilco:
            response.Message = 'WILCO';
            break;
        default:
            return undefined;
        }

        return response;
    }

    public sendResponse(uid: number, response: CpdlcMessageResponse): void {
        const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            // avoid double sends
            if (message.ResponseType === response) {
                if (message.Response !== undefined && (message.Response.ComStatus === AtsuMessageComStatus.Sending || message.Response.ComStatus === AtsuMessageComStatus.Sent)) {
                    return;
                }
            }

            message.ResponseType = response;
            message.Response = this.createCpdlcResponse(message);
            message.Response.ComStatus = AtsuMessageComStatus.Sending;
            this.dcduLink.update(message);

            if (message.Response !== undefined) {
                this.datalink.sendMessage(message.Response, false).then((code) => {
                    if (code === AtsuStatusCodes.Ok) {
                        message.Response.ComStatus = AtsuMessageComStatus.Sent;
                    } else {
                        message.Response.ComStatus = AtsuMessageComStatus.Failed;
                    }
                    this.dcduLink.update(message);
                });
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
            this.dcduLink.update(message as CpdlcMessage);
        }

        return this.datalink.sendMessage(message, false).then((code) => {
            if (code === AtsuStatusCodes.Ok) {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }

            if ((message as CpdlcMessage).DcduRelevantMessage) {
                this.dcduLink.update(message as CpdlcMessage);
            }

            return code;
        });
    }

    public messages(): AtsuMessage[] {
        return this.messageQueue;
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
        if (request.RequestedResponses === CpdlcMessageRequestedResponseType.NotRequired && response === undefined) {
            // received the station message for the DCDU
            if (request.Message.includes('CURRENT ATC')) {
                if (this.currentAtc !== '') {
                    this.dcduLink.setAtcLogonMessage(request.Message);
                }
                return true;
            }

            // received a logoff message
            if (request.Message.includes('LOGOFF')) {
                this.dcduLink.setAtcLogonMessage('');
                this.currentAtc = '';
                return true;
            }

            // received a service terminated message
            if (request.Message.includes('TERMINATED')) {
                this.dcduLink.setAtcLogonMessage('');
                this.currentAtc = '';
                return true;
            }

            // process the handover message
            if (request.Message.includes('HANDOVER')) {
                const entries = request.Message.split(' ');
                if (entries.length >= 2) {
                    const station = entries[1].replace(/@/gi, '');
                    this.handover(station);
                    return true;
                }
            }
        }

        // expecting a LOGON or denied message
        if (this.nextAtc !== '' && request !== undefined && response !== undefined) {
            if (request.Message === 'REQUEST LOGON') {
                // logon accepted by ATC
                if (response.Message.includes('LOGON ACCEPTED')) {
                    this.dcduLink.setAtcLogonMessage(`CURRENT ATC UNIT @${this.nextAtc}@`);
                    this.currentAtc = this.nextAtc;
                    this.nextAtc = '';
                    return true;
                }

                // logon rejected
                if (response.Message.includes('UNABLE')) {
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

    public insertMessage(message: AtsuMessage): void {
        const cpdlcMessage = message as CpdlcMessage;
        let analyzed = false;

        if (cpdlcMessage.Direction === AtsuMessageDirection.Output && cpdlcMessage.CurrentTransmissionId === -1) {
            cpdlcMessage.CurrentTransmissionId = ++this.cpdlcMessageId;
        }

        // search corresponding request, if previous ID is set
        if (cpdlcMessage.PreviousTransmissionId !== -1) {
            this.messageQueue.forEach((element) => {
                // ensure that the sending and receiving stations are the same to avoid CPDLC ID overlaps
                if (element.Station === cpdlcMessage.Station) {
                    while (element !== undefined) {
                        if (element.CurrentTransmissionId === cpdlcMessage.PreviousTransmissionId) {
                            if (element.ResponseType === undefined) {
                                element.ResponseType = CpdlcMessageResponse.Other;
                            }
                            element.Response = cpdlcMessage;
                            analyzed = this.analyzeMessage(element, cpdlcMessage);
                            break;
                        }
                        element = element.Response;
                    }
                }
            });
        } else {
            this.messageQueue.unshift(cpdlcMessage);
            analyzed = this.analyzeMessage(cpdlcMessage, undefined);
        }

        if (!analyzed) {
            if (cpdlcMessage.Direction === AtsuMessageDirection.Output && cpdlcMessage.Station === '') {
                cpdlcMessage.Station = this.currentAtc;
            }

            if (cpdlcMessage.DcduRelevantMessage) {
                this.dcduLink.enqueue(cpdlcMessage);
            }
        }
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Input) {
            this.messageQueue[index].Confirmed = true;
        }

        return index !== -1;
    }

    private async updateAtis(icao: string, type: AtisType, overwrite: boolean): Promise<AtsuStatusCodes> {
        return this.datalink.receiveAtis(icao, type).then((retval) => {
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
}
