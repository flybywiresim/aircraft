import { EventBus } from 'msfssdk';
import { AtcMessageButtonOutputBus } from './databus/AtcMessageButtonBus';
import { FwcOutputBus } from './databus/FwcBus';

export class DigitalOutputs {
    public AtcMessageButtonsBus: AtcMessageButtonOutputBus = null;

    public FwcBus: FwcOutputBus = null;

    constructor(private readonly bus: EventBus) {
        this.AtcMessageButtonsBus = new AtcMessageButtonOutputBus(bus);
        this.FwcBus = new FwcOutputBus(bus);
    }

    public initialize(): void {
        this.AtcMessageButtonsBus.initialize();
        this.FwcBus.initialize();
    }
}
