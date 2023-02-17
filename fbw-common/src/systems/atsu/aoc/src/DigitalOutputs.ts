import { EventBus } from 'msfssdk';
import { AocFmsBus } from './databus/FmsBus';
import { AocFwcBus } from './databus/FwcBus';

export class DigitalOutputs {
    public FwcBus: AocFwcBus = null;

    public FmsBus: AocFmsBus = null;

    constructor(private readonly bus: EventBus) {
        this.FwcBus = new AocFwcBus();
        this.FmsBus = new AocFmsBus(this.bus);
    }
}
