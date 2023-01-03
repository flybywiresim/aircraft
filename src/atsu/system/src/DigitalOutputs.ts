import { FmsOutputBus } from '@atsu/system/databus/FmsBus';
import { EventBus } from 'msfssdk';
import { AtcMessageButtonOutputBus } from './databus/AtcMessageButtonBus';
import { FwcOutputBus } from './databus/FwcBus';

export class DigitalOutputs {
    public AtcMessageButtonsBus: AtcMessageButtonOutputBus = null;

    public FwcBus: FwcOutputBus = null;

    public FmsBus: FmsOutputBus = null;

    constructor(private readonly bus: EventBus) {
        this.AtcMessageButtonsBus = new AtcMessageButtonOutputBus(this.bus);
        this.FwcBus = new FwcOutputBus(this.bus);
        this.FmsBus = new FmsOutputBus(this.bus);
    }

    public initialize(): void {
        this.AtcMessageButtonsBus.initialize();
    }
}
