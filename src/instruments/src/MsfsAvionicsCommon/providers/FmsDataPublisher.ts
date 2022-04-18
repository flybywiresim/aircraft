import { EventBus, SimVarValueType, Subject } from 'msfssdk';
import { SwitchableSimVarProvider } from './SwitchableProvider';

export interface FmsVars {
    ndMessageFlags: number,
}

export class FmsDataPublisher extends SwitchableSimVarProvider<FmsVars, 'L' | 'R'> {
    constructor(
        bus: EventBus,
        stateSubject: Subject<'L' | 'R'>,
    ) {
        super(new Map([
            ['ndMessageFlags', { name: (side) => `L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, type: SimVarValueType.Number }],
        ]), stateSubject, bus);
    }
}
