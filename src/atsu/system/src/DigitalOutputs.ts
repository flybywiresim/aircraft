import { AtsuStatusCodes } from '@atsu/common/AtsuStatusCodes';
import { AtsuFmsMessages } from '@atsu/common/databus';
import { AtsuMessage, CpdlcMessage } from '@atsu/common/messages';
import { EventBus, Publisher } from 'msfssdk';
import { AtcMessageButtonOutputBus } from './databus/AtcMessageButtonBus';
import { FwcOutputBus } from './databus/FwcBus';

export class DigitalOutputs {
    public AtcMessageButtonsBus: AtcMessageButtonOutputBus = null;

    public FwcBus: FwcOutputBus = null;

    private fmsPublisher: Publisher<AtsuFmsMessages> = null;

    constructor(private readonly bus: EventBus) {
        this.AtcMessageButtonsBus = new AtcMessageButtonOutputBus(this.bus);
        this.FwcBus = new FwcOutputBus(this.bus);
        this.fmsPublisher = this.bus.getPublisher<AtsuFmsMessages>();
    }

    public initialize(): void {
        this.AtcMessageButtonsBus.initialize();
        this.FwcBus.initialize();
    }

    public atsuSystemStatus(status: AtsuStatusCodes): void {
        this.fmsPublisher.pub('atsuSystemStatus', status);
    }

    public atcMessageModify(message: CpdlcMessage): void {
        this.fmsPublisher.pub('messageModify', message);
    }

    public printMessage(message: AtsuMessage): void {
        this.fmsPublisher.pub('printMessage', message);
    }
}
