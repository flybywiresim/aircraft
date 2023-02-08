import { EventBus, SimVarValueType, Subject } from 'msfssdk';
import { SwitchableSimVarProvider } from './SwitchableProvider';

export interface FmsVars {
    ndMessageFlags: number,
    crossTrackError: number,
}

export class FmsDataPublisher extends SwitchableSimVarProvider<FmsVars, 'L' | 'R'> {
    constructor(
        bus: EventBus,
        stateSubject: Subject<'L' | 'R'>,
    ) {
        super(new Map([
            ['ndMessageFlags', { name: (side) => `L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, type: SimVarValueType.Number }],
            ['crossTrackError', { name: (_side) => 'L:A32NX_FG_CROSS_TRACK_ERROR', type: SimVarValueType.NM }],
        ]), stateSubject, bus);
    }
}
