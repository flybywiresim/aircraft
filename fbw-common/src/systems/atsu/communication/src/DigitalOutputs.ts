import { EventBus } from 'msfssdk';
import { RouterFmsBus } from './databus/FmsBus';

export class DigitalOutputs {
    public FmsBus: RouterFmsBus = null;

    constructor(private readonly bus: EventBus) {
        this.FmsBus = new RouterFmsBus(this.bus);
    }
}
