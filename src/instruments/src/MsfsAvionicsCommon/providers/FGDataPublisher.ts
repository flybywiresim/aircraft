import { EventBus, SimVarValueType, Subject } from 'msfssdk';
import { LateralMode } from '@shared/autopilot';
import { SwitchableSimVarProvider } from './SwitchableProvider';

export interface FGVars {
    'fg.fma.lateralMode': LateralMode,
    'fg.fma.lateralArmedBitmask': number,
}

export class FGDataPublisher extends SwitchableSimVarProvider<FGVars, 'L' | 'R'> {
    constructor(
        bus: EventBus,
        stateSubject: Subject<'L' | 'R'>,
    ) {
        super(new Map([
            ['fg.fma.lateralMode', { name: (_side) => 'L:A32NX_FMA_LATERAL_MODE', type: SimVarValueType.Number }],
            ['fg.fma.lateralArmedBitmask', { name: (_side) => 'L:A32NX_FMA_LATERAL_ARMED', type: SimVarValueType.Number }],
        ]), stateSubject, bus);
    }
}
