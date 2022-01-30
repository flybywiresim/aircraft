//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuStatusCodes } from './AtsuStatusCodes';
import { AtsuMessageComStatus, AtsuMessage, AtsuMessageType, AtsuMessageDirection } from './messages/AtsuMessage';
import { CpdlcMessageResponse, CpdlcMessageRequestedResponseType, CpdlcMessage } from './messages/CpdlcMessage';
import { Datalink } from './com/Datalink';
import { AtsuManager } from './AtsuManager';
import { HoppieConnector } from '@atsu/com/HoppieConnector';

export class AtcSystem {
    private parent: AtsuManager | undefined = undefined;

    private datalink: Datalink | undefined = undefined;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private currentAtc = '';

    private nextAtc = '';

    private cpdlcMessageId = 0;

    private messageQueue: CpdlcMessage[] = [];

    private dcduBufferedMessages: number[] = [];

    constructor(parent: AtsuManager, datalink: Datalink) {
        this.parent = parent;
        this.datalink = datalink;

        // initialize the variables for the DCDU communication
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE_UID', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', -1);
        SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', -1);

        setInterval(async () => {
            if (SimVar.GetSimVarValue('L:A32NX_HOPPIE_ACTIVE', 'number') !== 1) {
                if (this.currentAtc !== '') {
                    await this.logoff();
                }
                return;
            }

            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE_UID', 'number') !== -1) {
                this.removeMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_DELETE_UID', 'number'));
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', -1);
            }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number') !== -1 && SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number') !== -1) {
                this.sendResponse(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number'), SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number') as CpdlcMessageResponse);
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', -1);
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', -1);
            }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number') !== -1) {
                const message = parent.findMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number'));
                if (message !== undefined) {
                    parent.printMessage(message);
                }
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', -1);
            }

            if (SimVar.GetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number') === 1) {
                SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_WAITING', 'boolean', 0);
                SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_ACK', 'number', 0);
            }

            // check if the buffer of the DCDU is available
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 0) {
                while (this.dcduBufferedMessages.length !== 0) {
                    if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') !== 0) {
                        break;
                    }

                    const uid = this.dcduBufferedMessages.shift();
                    const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
                    if (message !== undefined) {
                        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
                    }
                }
            }
        }, 100);
    }

    public static async connect(): Promise<AtsuStatusCodes> {
        const flightNo = SimVar.GetSimVarValue('ATC FLIGHT NUMBER', 'string');
        return HoppieConnector.isCallsignInUse(flightNo);
    }

    public static async disconnect(): Promise<AtsuStatusCodes> {
        return AtsuStatusCodes.Ok;
    }

    public currentStation(): string {
        return this.currentAtc;
    }

    public nextStation(): string {
        return this.nextAtc;
    }

    public logonInProgress(): boolean {
        return this.nextAtc !== '';
    }

    public async logon(station: string): Promise<AtsuStatusCodes> {
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

        this.nextAtc = station;
        this.parent.registerMessage(message);
        this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', `NEXT ATC: ${station}`);

        return this.datalink.sendMessage(message, false);
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

        this.parent.registerMessage(message);
        this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', '');

        return this.datalink.sendMessage(message, true).then((error) => error);
    }

    public async handoff(station: string) {
        if (this.currentAtc !== '') {
            const retval = await this.logoffWithoutReset();
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

        this.nextAtc = station;
        this.parent.registerMessage(message);
        this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', `NEXT ATC: ${station}`);

        return this.datalink.sendMessage(message, false);
    }

    public async logoff(): Promise<AtsuStatusCodes> {
        return this.logoffWithoutReset().then((error) => {
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

    private sendResponse(uid: number, response: CpdlcMessageResponse): void {
        const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            message.ResponseType = response;
            message.Response = this.createCpdlcResponse(message);
            message.Response.ComStatus = AtsuMessageComStatus.Sending;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

            if (message.Response !== undefined) {
                this.datalink.sendMessage(message.Response, false).then((code) => {
                    if (code === AtsuStatusCodes.Ok) {
                        message.Response.ComStatus = AtsuMessageComStatus.Sent;
                    } else {
                        message.Response.ComStatus = AtsuMessageComStatus.Failed;
                    }
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
                });
            }
        }
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
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', uid);
            this.messageQueue.splice(index, 1);
        }
        return index !== -1;
    }

    public cleanupMessages(): void {
        this.messageQueue.forEach((message) => this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG_DELETE_UID', message.UniqueMessageID));
        this.messageQueue = [];
    }

    private analyzeMessage(request: CpdlcMessage, response: CpdlcMessage): boolean {
        // inserted a sent message for a new thread
        if (request.Direction === AtsuMessageDirection.Output && response === undefined) {
            return true;
        }

        if (request.RequestedResponses === CpdlcMessageRequestedResponseType.NotRequired && response === undefined) {
            // received the station message for the DCDU
            if (request.Message.includes('CURRENT ATC')) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', request.Message);
                return true;
            }

            // received a logoff message
            if (request.Message.includes('LOGOFF')) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', '');
                this.currentAtc = '';
                return true;
            }

            // received a service terminated message
            if (request.Message.includes('TERMINATED')) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', '');
                this.currentAtc = '';
                return true;
            }

            // process the handover message
            if (request.Message.includes('HANDOVER')) {
                const entries = request.Message.split(' ');
                if (entries.length >= 2) {
                    const station = entries[1].replace(/@/gi, '');
                    this.handoff(station);
                    return true;
                }
            }
        }

        // expecting a LOGON or denied message
        if (this.nextAtc !== '' && request !== undefined && response !== undefined) {
            if (request.Message.startsWith('REQUEST')) {
                // logon accepted by ATC
                if (response.Message.includes('LOGON ACCEPTED')) {
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', `CURRENT ATC UNIT @${this.nextAtc}@`);
                    this.currentAtc = this.nextAtc;
                    this.nextAtc = '';
                    return true;
                }

                // logon rejected
                if (response.Message.includes('UNABLE')) {
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', '');
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

        // search corresponding request, if previous ID is set
        if (cpdlcMessage.PreviousTransmissionId !== -1) {
            this.messageQueue.forEach((element) => {
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
            });
        } else {
            this.messageQueue.unshift(cpdlcMessage);
            analyzed = this.analyzeMessage(cpdlcMessage, undefined);
        }

        if (!analyzed) {
            if (cpdlcMessage.Direction === AtsuMessageDirection.Input) {
                SimVar.SetSimVarValue('L:A32NX_DCDU_ATC_MSG_WAITING', 'boolean', 1);
                Coherent.call('PLAY_INSTRUMENT_SOUND', 'cpdlc_ring');
                setTimeout(() => SimVar.SetSimVarValue('W:cpdlc_ring', 'boolean', 0), 500);
            }

            const dcduRelevant = cpdlcMessage.ComStatus === AtsuMessageComStatus.Open || cpdlcMessage.ComStatus === AtsuMessageComStatus.Received;
            if (dcduRelevant && SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 0) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message as CpdlcMessage);
            } else if (dcduRelevant) {
                this.dcduBufferedMessages.push(message.UniqueMessageID);
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

    public async sendMessage(message: AtsuMessage): Promise<AtsuStatusCodes> {
        if (message.Station === '') {
            if (this.currentAtc === '') {
                return AtsuStatusCodes.NoAtc;
            }
            message.Station = this.currentAtc;
        }

        message.ComStatus = AtsuMessageComStatus.Sending;
        return this.datalink.sendMessage(message, false).then((retval) => {
            if (retval === AtsuStatusCodes.Ok) {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }
            return retval;
        });
    }
}
