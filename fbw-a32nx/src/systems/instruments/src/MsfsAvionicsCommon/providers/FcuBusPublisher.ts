import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { EfisNdMode, EfisOption, EfisSide, NavAidMode } from '@shared/NavigationDisplay';

export interface FcuSimVars {
    ndRangeSetting: number,
    ndMode: EfisNdMode,
    option: EfisOption,
    navaidMode1: NavAidMode,
    navaidMode2: NavAidMode,
}

export class FcuBusPublisher extends SimVarPublisher<FcuSimVars> {
    constructor(bus: EventBus, efisSide: EfisSide) {
        super(new Map([
            ['ndRangeSetting', { name: `L:A32NX_EFIS_${efisSide}_ND_RANGE`, type: SimVarValueType.Enum }],
            ['ndMode', { name: `L:A32NX_EFIS_${efisSide}_ND_MODE`, type: SimVarValueType.Enum }],
            ['option', { name: `L:A32NX_EFIS_${efisSide}_OPTION`, type: SimVarValueType.Enum }],
            ['navaidMode1', { name: `L:A32NX_EFIS_${efisSide}_NAVAID_1_MODE`, type: SimVarValueType.Enum }],
            ['navaidMode2', { name: `L:A32NX_EFIS_${efisSide}_NAVAID_2_MODE`, type: SimVarValueType.Enum }],
        ]), bus);
    }
}
