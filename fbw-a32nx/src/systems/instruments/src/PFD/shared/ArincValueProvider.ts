import { EventBus, Publisher } from '@microsoft/msfs-sdk';
import { Arinc429Word } from '@shared/arinc429';
import { MFDSimvars } from './MFDSimvarPublisher';

export interface Arinc429Values {
}
export class ArincValueProvider {
    constructor(private readonly bus: EventBus) {

    }

    public init() {
        const publisher = this.bus.getPublisher<Arinc429Values>();
        const subscriber = this.bus.getSubscriber<MFDSimvars>();
    }
}
