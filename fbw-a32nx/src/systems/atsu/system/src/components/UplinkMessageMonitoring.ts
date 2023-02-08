import { AtsuMessageComStatus, CpdlcMessage, UplinkMonitor } from '@atsu/common';
import { Atsu } from '../ATSU';

export class UplinkMessageMonitoring {
    private monitoredMessages: UplinkMonitor[] = [];

    private atsu: Atsu = null;

    constructor(atsu: Atsu) {
        this.atsu = atsu;
    }

    public monitorMessage(message: CpdlcMessage): boolean {
        if (UplinkMonitor.relevantMessage(message)) {
            this.monitoredMessages.push(UplinkMonitor.createMessageMonitor(message));
            this.atsu.digitalOutputs.FmsBus.sendMonitoredMessages(this.atsu.atc.monitoredMessages());
            return true;
        }
        return false;
    }

    public removeMessage(uid: number): void {
        const idx = this.monitoredMessages.findIndex((message) => message.messageId === uid);
        if (idx > -1) {
            this.monitoredMessages.splice(idx, 1);
            this.atsu.digitalOutputs.FmsBus.sendMonitoredMessages(this.atsu.atc.monitoredMessages());
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

        const currentTime = this.atsu.digitalInputs.UtcClock;
        const currentAltitude = this.atsu.digitalInputs.PresentPosition.altitude.value;
        const currentWaypoint = this.atsu.digitalInputs.FlightRoute.lastWaypoint;

        let idx = this.monitoredMessages.length - 1;
        while (idx >= 0) {
            const monitorInstance = this.monitoredMessages[idx];
            let conditionMet = monitorInstance.conditionsMet(currentTime);
            conditionMet ||= monitorInstance.conditionsMet(currentAltitude);
            conditionMet ||= monitorInstance.conditionsMet(currentWaypoint);

            if (conditionMet) {
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
