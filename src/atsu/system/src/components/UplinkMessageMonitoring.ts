import { AtsuMessageComStatus } from '@atsu/common/messages/AtsuMessage';
import { CpdlcMessage } from '@atsu/common/messages/CpdlcMessage';
import { UplinkMonitor } from '@atsu/common/components/UplinkMonitor';
import { Atsu } from '../ATSU';

export class UplinkMessageMonitoring {
    private monitoredMessages: UplinkMonitor[] = [];

    private atsu: Atsu = null;

    constructor(atsu: Atsu) {
        this.atsu = atsu;
    }

    public

    public monitorMessage(message: CpdlcMessage): boolean {
        if (UplinkMonitor.relevantMessage(message)) {
            this.monitoredMessages.push(UplinkMonitor.createMessageMonitor(message));
            return true;
        }
        return false;
    }

    public removeMessage(uid: number): void {
        const idx = this.monitoredMessages.findIndex((message) => message.messageId === uid);
        if (idx > -1) {
            this.monitoredMessages.splice(idx, 1);
        }
    }

    public monitoredMessageIds(): number[] {
        const ids = [];
        this.monitoredMessages.forEach((monitor) => ids.push(monitor.messageId));
        return ids;
    }

    private findAtcMessage(uid: number): CpdlcMessage | undefined {
        for (const message of this.atsu.atc.messages()) {
            if (message.UniqueMessageID === uid) {
                return message as CpdlcMessage;
            }
        }
        return undefined;
    }

    public checkMessageConditions(): number[] {
        const ids = [];

        let idx = this.monitoredMessages.length - 1;
        while (idx >= 0) {
            if (this.monitoredMessages[idx].conditionsMet()) {
                const message = this.findAtcMessage(this.monitoredMessages[idx].messageId);
                if (message !== undefined && message.Response?.ComStatus === AtsuMessageComStatus.Sent) {
                    ids.push(this.monitoredMessages[idx].messageId);
                    this.monitoredMessages.splice(idx, 1);
                }
            }
            idx -= 1;
        }

        return ids;
    }
}
