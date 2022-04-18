import { BasePublisher, EventBus } from 'msfssdk';
import { NdSymbol } from '@shared/NavigationDisplay';
import { FlowEventSync } from '@shared/FlowEventSync';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';

export interface FmsSymbolsData {
    symbols: NdSymbol[],
    vectorsActive: PathVector[],
}

export class FmsSymbolsPublisher extends BasePublisher<FmsSymbolsData> {
    private readonly events: FlowEventSync[] = [];

    constructor(bus: EventBus) {
        super(bus);

        this.events.push(new FlowEventSync((ev, data) => {
            this.publish('symbols', data);
        }, 'A32NX_EFIS_L_SYMBOLS'));

        this.events.push(new FlowEventSync((ev, data: PathVector[]) => {
            this.publish('vectorsActive', data);
        }, 'A32NX_EFIS_VECTORS_L_ACTIVE'));
    }
}
