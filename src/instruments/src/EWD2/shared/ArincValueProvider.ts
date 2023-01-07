import { EventBus } from 'msfssdk';
import { Arinc429Word } from '@shared/arinc429';
import { EWDSimvars } from './EWDSimvarPublisher';

export interface Arinc429Values {
    sat: Arinc429Word;
}
export class ArincValueProvider {
    private sat = new Arinc429Word(0);

    constructor(private readonly bus: EventBus) {

    }

    public init() {
        const publisher = this.bus.getPublisher<Arinc429Values>();
        const subscriber = this.bus.getSubscriber<EWDSimvars>();

        subscriber.on('satRaw').handle((p) => {
            this.sat = new Arinc429Word(p);
            publisher.pub('sat', this.sat);
        });
    }
}
