import { Atsu } from '../ATSU';
import { CpdlcMessage } from '../messages/CpdlcMessage';
import { AtsuMessageComStatus } from '../messages/AtsuMessage';

export abstract class UplinkMonitor {
    private static positionMonitoringMessageIds = ['UM22', 'UM25', 'UM65', 'UM77', 'UM83', 'UM84', 'UM97', 'UM118', 'UM121', 'UM130'];

    private static timeMonitoringMessageIds = ['UM21', 'UM24', 'UM66', 'UM76', 'UM119', 'UM122', 'UM184'];

    private static levelMonitoringMessageIds = ['UM78', 'UM128', 'UM129', 'UM130', 'UM175', 'UM180'];

    protected atsu: Atsu = null;

    public messageId = -1;

    constructor(atsu: Atsu, message: CpdlcMessage) {
        this.atsu = atsu;
        this.messageId = message.UniqueMessageID;
    }

    public static relevantMessage(message: CpdlcMessage): boolean {
        if (UplinkMonitor.positionMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) === -1
        && UplinkMonitor.timeMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) === -1
        && UplinkMonitor.levelMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) === -1) {
            return false;
        }

        return true;
    }

    public static createMessageMonitor(atsu: Atsu, message: CpdlcMessage): UplinkMonitor {
        if (UplinkMonitor.positionMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
            return new PositionMonitor(atsu, message);
        }
        if (UplinkMonitor.timeMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
            return new TimeMonitor(atsu, message);
        }
        if (UplinkMonitor.levelMonitoringMessageIds.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
            return new LevelMonitor(atsu, message);
        }

        return null;
    }

    abstract conditionsMet(): boolean;
}

class PositionMonitor extends UplinkMonitor {
    private positionMonitor = '';

    constructor(atsu: Atsu, message: CpdlcMessage) {
        super(atsu, message);
        this.positionMonitor = message.Content[0]?.Content[0]?.Value;
    }

    public conditionsMet(): boolean {
        if (this.atsu.lastWaypoint()) {
            const lastPosition = this.atsu.lastWaypoint().ident;
            return this.positionMonitor === lastPosition;
        }

        return false;
    }
}

class TimeMonitor extends UplinkMonitor {
    private static deferredMessageIDs = ['UM66', 'UM69', 'UM119', 'UM122'];

    private timeOffset = 0;

    private timeMonitor = -1;

    private static extractSeconds(value: string): number {
        const matches = value.match(/[0-9]{2}/g);
        const hours = parseInt(matches[0]);
        const minutes = parseInt(matches[1]);
        return (hours * 60 + minutes) * 60;
    }

    constructor(atsu: Atsu, message: CpdlcMessage) {
        super(atsu, message);
        if (TimeMonitor.deferredMessageIDs.findIndex((id) => id === message.Content[0]?.TypeId) !== -1) {
            this.timeOffset = 30;
        }
        this.timeMonitor = TimeMonitor.extractSeconds(message.Content[0]?.Content[0]?.Value);
    }

    public conditionsMet(): boolean {
        const currentTime = SimVar.GetSimVarValue('E:ZULU TIME', 'seconds');

        if ((currentTime + this.timeOffset) >= this.timeMonitor) {
            // avoid errors due to day change (2359 to 0001)
            return (currentTime - this.timeMonitor) < 30;
        }

        return false;
    }
}

class LevelMonitor extends UplinkMonitor {
    private lowerLevel = -1;

    private upperLevel = -1;

    private reachingLevel = false;

    private leavingLevel = false;

    private reachedLevel = false;

    private static extractAltitude(value: string): number {
        let altitude = parseInt(value.match(/[0-9]+/)[0]);
        if (value.startsWith('FL')) {
            altitude *= 100;
        } else if (value.endsWith('M')) {
            altitude *= 3.28084;
        }
        return altitude;
    }

    constructor(atsu: Atsu, message: CpdlcMessage) {
        super(atsu, message);

        this.lowerLevel = LevelMonitor.extractAltitude(message.Content[0]?.Content[0]?.Value);
        if (message.Content[0]?.TypeId === 'UM180') {
            this.upperLevel = LevelMonitor.extractAltitude(message.Content[0]?.Content[1].Value);
            this.reachingLevel = true;
        } else if (message.Content[0]?.TypeId === 'UM78' || message.Content[0]?.TypeId === 'UM129' || message.Content[0]?.TypeId === 'UM175') {
            this.reachingLevel = true;
        } else if (message.Content[0]?.TypeId === 'UM128') {
            this.reachingLevel = false;
        } else if (message.Content[0]?.TypeId === 'UM130') {
            this.reachingLevel = true;
            this.leavingLevel = true;
        }
    }

    public conditionsMet(): boolean {
        const currentAltitude = this.atsu.currentFlightState().altitude;

        if (this.reachingLevel && this.leavingLevel) {
            if (!this.reachedLevel) {
                this.reachedLevel = Math.abs(currentAltitude - this.lowerLevel) <= 100;
            } else {
                return Math.abs(currentAltitude - this.lowerLevel) > 100;
            }
        }
        if (!this.reachingLevel) {
            return Math.abs(currentAltitude - this.lowerLevel) > 100;
        }
        if (this.upperLevel > -1) {
            return this.lowerLevel <= currentAltitude && this.upperLevel >= currentAltitude;
        }

        return Math.abs(currentAltitude - this.lowerLevel) <= 100;
    }
}

export class UplinkMessageMonitoring {
    private monitoredMessages: UplinkMonitor[] = [];

    private atsu: Atsu = null;

    constructor(atsu: Atsu) {
        this.atsu = atsu;
    }

    public

    public monitorMessage(message: CpdlcMessage): boolean {
        if (UplinkMonitor.relevantMessage(message)) {
            this.monitoredMessages.push(UplinkMonitor.createMessageMonitor(this.atsu, message));
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
