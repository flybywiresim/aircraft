import { AtsuMessage } from '@atsu/common';
import { EventBus } from 'msfssdk';
import { AtcMessageButtonOutputBus } from './databus/AtcMessageButtonBus';
import { AtcFmsBus } from './databus/FmsBus';
import { FwcOutputBus } from './databus/FwcBus';

export class DigitalOutputs {
    public AtcMessageButtonsBus: AtcMessageButtonOutputBus = null;

    public FwcBus: FwcOutputBus = null;

    public FmsBus: AtcFmsBus = null;

    constructor(private readonly bus: EventBus) {
        this.AtcMessageButtonsBus = new AtcMessageButtonOutputBus(this.bus);
        this.FwcBus = new FwcOutputBus();
        this.FmsBus = new AtcFmsBus(this.bus);
    }
}
