import { BasePublisher, EventBus } from '@microsoft/msfs-sdk';
import { EfisSide, NdSymbol, NdTraffic } from '@shared/NavigationDisplay';
import { FlowEventSync } from '@shared/FlowEventSync';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';

export interface FmsSymbolsData {
    symbols: NdSymbol[],
    vectorsActive: PathVector[],
    vectorsDashed: PathVector[],
    vectorsTemporary: PathVector[],
    traffic: NdTraffic[],
}

export class FmsSymbolsPublisher extends BasePublisher<FmsSymbolsData> {
    private readonly events: FlowEventSync[] = [];

    constructor(bus: EventBus, side: EfisSide) {
        super(bus);

        this.events.push(new FlowEventSync((ev, data) => {
            this.publish('symbols', data);
        }, `A32NX_EFIS_${side}_SYMBOLS`));

        this.events.push(new FlowEventSync((ev, data: PathVector[]) => {
            this.publish('vectorsActive', data);
        }, `A32NX_EFIS_VECTORS_${side}_ACTIVE`));

        this.events.push(new FlowEventSync((ev, data: PathVector[]) => {
            this.publish('vectorsDashed', data);
        }, `A32NX_EFIS_VECTORS_${side}_DASHED`));

        this.events.push(new FlowEventSync((ev, data: PathVector[]) => {
            this.publish('vectorsTemporary', data);
        }, `A32NX_EFIS_VECTORS_${side}_TEMPORARY`));

        this.events.push(new FlowEventSync((ev, data: NdTraffic[]) => {
            this.publish('traffic', data);
        }, 'A32NX_TCAS_TRAFFIC'));
    }
}
