import { AtsuMessageComStatus, AtsuMessage, AtsuMessageType, AtsuMessageDirection } from './messages/AtsuMessage';
import { CpdlcMessageResponse, CpdlcMessageRequestedResponseType, CpdlcMessage } from './messages/CpdlcMessage';
import { HoppieConnector } from './HoppieConnector';
import { AtsuManager } from './AtsuManager';

export class AtcSystem {
    private parent: AtsuManager | undefined = undefined;

    private connector : HoppieConnector = undefined;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private station = '';

    private nextStation = '';

    private stationMessage = '';

    private cpdlcMessageId: number = Math.floor(Math.random() * 100);

    private messageQueue: CpdlcMessage[] = [];

    constructor(parent: AtsuManager, connector: HoppieConnector) {
        this.parent = parent;
        this.connector = connector;

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
        message.Lines = ['REQUEST LOGON'];

        return this.parent.sendMessage(message).then((message) => {
            if (message === '') {
                this.nextStation = station;
            }
            return message;
        });
    }

    public async logoff(): Promise<string> {
        if (this.station === '') {
            return;
        }

        const message = new CpdlcMessage();
        message.Station = this.station;
        message.Direction = AtsuMessageDirection.Output;
        message.CurrentTransmissionId = this.cpdlcMessageId++;
        message.RequestedResponses = CpdlcMessageRequestedResponseType.No;
        message.Lines = ['LOGOFF'];

        return this.parent.sendMessage(message).then((message) => {
            if (message === '') {
                this.station = '';
                this.nextStation = '';
                this.stationMessage = '';
            }
            return message;
        });
    }

    private createCpdlcResponse(request: CpdlcMessage) {
        // create the meta information of the response
        const response = new CpdlcMessage();
        response.Direction = AtsuMessageDirection.Output;
        response.PreviousTransmissionId = request.CurrentTransmissionId;
        response.CurrentTransmissionId = this.cpdlcMessageId++;
        response.RequestedResponses = CpdlcMessageRequestedResponseType.NotRequired;

        // create the answer text
        switch (request.ResponseType) {
        case CpdlcMessageResponse.Acknowledge:
            response.Lines = ['ACKNOWLEDGE'];
            break;
        case CpdlcMessageResponse.Affirm:
            response.Lines = ['AFFIRM'];
            break;
        case CpdlcMessageResponse.Negative:
            response.Lines = ['NEGATIVE'];
            break;
        case CpdlcMessageResponse.Refuse:
            response.Lines = ['REFUSE'];
            break;
        case CpdlcMessageResponse.Roger:
            response.Lines = ['ROGER'];
            break;
        case CpdlcMessageResponse.Standby:
            response.Lines = ['STANDBY'];
            break;
        case CpdlcMessageResponse.Unable:
            response.Lines = ['UNABLE'];
            break;
        case CpdlcMessageResponse.Wilco:
            response.Lines = ['WILCO'];
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
            message.ComStatus = AtsuMessageComStatus.Sending;
            this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);

            setTimeout(() => {
                const answer = this.createCpdlcResponse(message);

                if (answer !== undefined) {
                    this.connector.sendCpdlcMessage(answer).then((text) => {
                        if (text === '') {
                            message.ComStatus = AtsuMessageComStatus.Sent;
                            message.Response = answer;
                        } else {
                            message.ComStatus = AtsuMessageComStatus.Failed;
                        }
                        this.listener.triggerToAllSubscribers('A32NX_DCDU_MSG', message);
                    });
                }
            }, 50000 + Math.floor(Math.random() * 10000));
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
            if (request.Lines[0].includes('CURRENT ATC')) {
                this.stationMessage = request.Lines.join(' ');
                return true;
            }

            // received a logoff message
            if (request.Lines[0].includes('LOGOFF')) {
                this.station = '';
                this.stationMessage = '';
                return true;
            }

            // received a service terminated message
            if (request.Lines[0].includes('TERMINATED')) {
                this.station = '';
                this.stationMessage = '';
                return true;
            }
        }

        // expecting a LOGON or denied message
        if (this.nextStation !== '' && request !== undefined && response !== undefined) {
            if (request.Lines[0].startsWith('REQUEST')) {
                // logon accepted by ATC
                if (response.Lines[0].includes('LOGON ACCEPTED')) {
                    this.stationMessage = `CURRENT ATC UNIT @${this.nextStation}@`;
                    this.station = this.nextStation;
                    this.nextStation = '';
                    return true;
                }

                // logon rejected
                if (!response.Lines[0].includes('STANDBY')) {
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
                return;
            }
            message.Station = this.station;
        }

        message.ComStatus = AtsuMessageComStatus.Sending;
        return this.connector.sendCpdlcMessage(message as CpdlcMessage).then((retval) => {
            if (retval === '') {
                message.ComStatus = AtsuMessageComStatus.Sent;
            } else {
                message.ComStatus = AtsuMessageComStatus.Failed;
            }
            return retval;
        });
    }
}
