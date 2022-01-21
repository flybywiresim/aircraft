import { AtsuMessageComStatus, AtsuMessage, AtsuMessageType, AtsuMessageDirection } from './messages/AtsuMessage';
import { CpdlcMessageResponse, CpdlcMessageRequestedResponseType, CpdlcMessage } from './messages/CpdlcMessage';
import { Datalink } from './com/Datalink';
import { AtsuManager } from './AtsuManager';

export class AtcSystem {
    private datalink: Datalink | undefined = undefined;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private station = '';

    private nextStation = '';

    private cpdlcMessageId: number = Math.floor(Math.random() * 100);

    private messageQueue: CpdlcMessage[] = [];

    constructor(parent: AtsuManager, datalink: Datalink) {
        this.datalink = datalink;

        setInterval(async () => {
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE_UID', 'number', -1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', -1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', -1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', -1);

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
        }, 500);
    }

    public currentStation(): string {
        return this.station;
    }

    public logonInProgress(): boolean {
        return this.nextStation !== '';
    }

    public async logon(station: string): Promise<string> {
        if (this.station !== '') {
            const retval = await this.logoff();
            if (retval !== '') {
                return retval;
            }
        }

        const message = new CpdlcMessage();
        message.Station = station;
        message.Direction = AtsuMessageDirection.Output;
        message.CurrentTransmissionId = this.cpdlcMessageId++;
        message.RequestedResponses = CpdlcMessageRequestedResponseType.Yes;
        message.Message = 'REQUEST LOGON';

        return this.datalink.sendMessage(message).then((error) => {
            if (error === '') {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', `NEXT ATC: ${station}`);
                this.insertMessage(message);
                this.nextStation = station;
            }
            return error;
        });
    }

    public async logoff(): Promise<string> {
        if (this.station === '') {
            return 'NO ACTIVE ATC';
        }

        const message = new CpdlcMessage();
        message.Station = this.station;
        message.Direction = AtsuMessageDirection.Output;
        message.CurrentTransmissionId = this.cpdlcMessageId++;
        message.RequestedResponses = CpdlcMessageRequestedResponseType.No;
        message.Message = 'LOGOFF';

        return this.datalink.sendMessage(message).then((error) => {
            if (error === '') {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', '');
                this.insertMessage(message);
                this.nextStation = '';
                this.station = '';
            }
            return error;
        });
    }

    private createCpdlcResponse(request: CpdlcMessage) {
        // create the meta information of the response
        const response = new CpdlcMessage();
        response.Direction = AtsuMessageDirection.Output;
        response.PreviousTransmissionId = request.CurrentTransmissionId;
        response.CurrentTransmissionId = this.cpdlcMessageId++;
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

    private sendResponse(uid: number, response: CpdlcMessageResponse) {
        const message = this.messageQueue.find((element) => element.UniqueMessageID === uid);
        if (message !== undefined) {
            message.ResponseType = response;
            message.Response = this.createCpdlcResponse(message);
            message.Response.ComStatus = AtsuMessageComStatus.Sending;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

            if (message.Response !== undefined) {
                this.datalink.sendMessage(message.Response).then((text) => {
                    if (text === '') {
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
                this.station = '';
                return true;
            }

            // received a service terminated message
            if (request.Message.includes('TERMINATED')) {
                this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', '');
                this.station = '';
                return true;
            }
        }

        // expecting a LOGON or denied message
        if (this.nextStation !== '' && request !== undefined && response !== undefined) {
            if (request.Message.startsWith('REQUEST')) {
                // logon accepted by ATC
                if (response.Message.includes('LOGON ACCEPTED')) {
                    this.listener.triggerToAllSubscribers('A32NX_DCDU_ATC_LOGON_MSG', `CURRENT ATC UNIT @${this.nextStation}@`);
                    this.station = this.nextStation;
                    this.nextStation = '';
                    return true;
                }

                // logon rejected
                if (!response.Message.includes('STANDBY')) {
                    this.nextStation = '';
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

        if (!analyzed && SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_MAX_REACHED', 'boolean') === 0) {
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message as CpdlcMessage);
        }
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Input) {
            this.messageQueue[index].Confirmed = true;
        }

        return index !== -1;
    }

    public async sendMessage(message: AtsuMessage): Promise<string> {
        if (message.Station === '') {
            if (this.station === '') {
                return 'NO ACTIVE ATC';
            }
            message.Station = this.station;
        }

        message.ComStatus = AtsuMessageComStatus.Sending;
        return this.datalink.sendMessage(message).then((retval) => {
            if (retval === '') {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }
            return retval;
        });
    }
}
