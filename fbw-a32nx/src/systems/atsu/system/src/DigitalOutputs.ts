import { EventBus } from 'msfssdk';
import { AtcMessageButtonOutputBus } from './databus/AtcMessageButtonBus';
import { FmsOutputBus } from './databus/FmsBus';
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
}
