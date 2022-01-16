import { HoppieConnector } from './HoppieConnector';
import { AtsuManager } from './AtsuManager';
import { AtsuMessage, AtsuMessageType, AtsuMessageDirection } from './messages/AtsuMessage';

export class AtcSystem {
    private connector : HoppieConnector = undefined;

    private messageQueue : AtsuMessage[] = [];

    constructor(parent: AtsuManager, connector: HoppieConnector) {
        this.connector = connector;

        setInterval(async () => {
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_DELETE_UID', 'number', -1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_ANSWER', 'number', -1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND_UID', 'number', -1);
            SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', -1);

            // if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number') !== -1) {
            //    this.sendMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number')).catch(() => {});
            //    SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_SEND', 'number', -1);
            // }
            if (SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number') !== -1) {
                const message = parent.findMessage(SimVar.GetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number'));
                if (message !== undefined) {
                    parent.printMessage(message);
                }
                SimVar.SetSimVarValue('L:A32NX_DCDU_MSG_PRINT_UID', 'number', -1);
            }
        }, 500);
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
        }
        return index !== -1;
    }

    public insertMessage(message: AtsuMessage): void {
        this.messageQueue.unshift(message);
    }

    public messageRead(uid: number): boolean {
        const index = this.messageQueue.findIndex((element) => element.UniqueMessageID === uid);
        if (index !== -1 && this.messageQueue[index].Direction === AtsuMessageDirection.Input) {
            this.messageQueue[index].Confirmed = true;
        }

        return index !== -1;
    }
}
