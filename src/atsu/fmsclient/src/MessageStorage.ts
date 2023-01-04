import { AtsuFmsMessages } from '@atsu/common/databus';
import { AtisMessage, AtsuMessage, AtsuMessageDirection, CpdlcMessage } from '@atsu/common/messages';
import { EventSubscriber } from 'msfssdk';

export class MessageStorage {
    public atisReports: Map<string, AtisMessage[]> = new Map();

    public atcMessagesBuffer: CpdlcMessage[] = [];

    public atcMonitoredMessages: CpdlcMessage[] = [];

    public aocUplinkMessages: AtsuMessage[] = [];

    public aocDownlinkMessages: AtsuMessage[] = [];

    private resynchronizeAocMessageQueue(message: AtsuMessage, queue: AtsuMessage[]): void {
        const index = queue.findIndex((entry) => entry.UniqueMessageID === message.UniqueMessageID);
        if (index !== -1) {
            queue[index] = message;
        } else {
            queue.unshift(message);
        }
    }

    private resynchronizeAocMessage(message: AtsuMessage): void {
        if (message.Direction === AtsuMessageDirection.Downlink) {
            this.resynchronizeAocMessageQueue(message, this.aocDownlinkMessages);
        } else {
            this.resynchronizeAocMessageQueue(message, this.aocUplinkMessages);
        }
    }

    private resynchronizeAtcMessage(message: CpdlcMessage): void {
        const index = this.atcMessagesBuffer.findIndex((entry) => entry.UniqueMessageID === message.UniqueMessageID);
        if (index !== -1) {
            this.atcMessagesBuffer[index] = message;
        } else {
            this.atcMessagesBuffer.unshift(message);
        }
    }

    private deleteMessageFromQueue<T extends AtsuMessage>(uid: number, queue: T[]): boolean {
        const index = queue.findIndex((entry) => entry.UniqueMessageID === uid);
        if (index !== -1) {
            queue.splice(index, 1);
        }
        return index !== -1;
    }

    private deleteMessage(uid: number): void {
        if (this.deleteMessageFromQueue(uid, this.aocDownlinkMessages)) return;
        if (this.deleteMessageFromQueue(uid, this.aocUplinkMessages)) return;
        this.deleteMessageFromQueue(uid, this.atcMessagesBuffer);
    }

    constructor(private readonly subscriber: EventSubscriber<AtsuFmsMessages>) {
        this.subscriber.on('atcAtisReports').handle((reports) => this.atisReports = reports);
        this.subscriber.on('monitoredMessages').handle((messages) => this.atcMonitoredMessages = messages);
        this.subscriber.on('resynchronizeAocWeatherMessage').handle((message) => this.resynchronizeAocMessage(message));
        this.subscriber.on('resynchronizeFreetextMessage').handle((message) => this.resynchronizeAocMessage(message));
        this.subscriber.on('resynchronizeCpdlcMessage').handle((message) => this.resynchronizeAtcMessage(message));
        this.subscriber.on('resynchronizeDclMessage').handle((message) => this.resynchronizeAtcMessage(message));
        this.subscriber.on('resynchronizeOclMessage').handle((message) => this.resynchronizeAtcMessage(message));
        this.subscriber.on('deleteMessage').handle((uid) => this.deleteMessage(uid));
    }
}
