import { EventBus, SimVarValueType, Subject } from 'msfssdk';
import { EfisNdMode, EfisOption, NavAidMode } from '@shared/NavigationDisplay';
import { SwitchableSimVarProvider } from './SwitchableProvider';

export interface EcpSimVars {
    ndRangeSetting: number,
    ndMode: EfisNdMode,
    option: EfisOption,
    navaidMode1: NavAidMode,
    navaidMode2: NavAidMode,
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
            ['navaidMode1', { name: (side) => `L:A32NX_EFIS_${side}_NAVAID_1_MODE`, type: SimVarValueType.Enum }],
            ['navaidMode2', { name: (side) => `L:A32NX_EFIS_${side}_NAVAID_2_MODE`, type: SimVarValueType.Enum }],
        ]), stateSubject, bus);
    }
}
