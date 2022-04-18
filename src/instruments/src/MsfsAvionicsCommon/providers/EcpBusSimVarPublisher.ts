import { EventBus, SimVarValueType, Subject } from 'msfssdk';
import { EfisNdMode, EfisOption } from '@shared/NavigationDisplay';
import { SwitchableSimVarProvider } from './SwitchableProvider';

export interface EcpSimVars {
    ndRangeSetting: number,
    ndMode: EfisNdMode,
    option: EfisOption,
}

export class EcpBusSimVarPublisher extends SwitchableSimVarProvider<EcpSimVars, 'L' | 'R'> {
    constructor(
        bus: EventBus,
        stateSubject: Subject<'L' | 'R'>,
    ) {
        super(new Map([
            ['ndRangeSetting', { name: (side) => `L:A32NX_EFIS_${side}_ND_RANGE`, type: SimVarValueType.Enum }],
            ['ndMode', { name: (side) => `L:A32NX_EFIS_${side}_ND_MODE`, type: SimVarValueType.Enum }],
            ['option', { name: (side) => `L:A32NX_EFIS_${side}_OPTION`, type: SimVarValueType.Enum }],
        ]), stateSubject, bus);
    }
}
