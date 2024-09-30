import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';
import { LateralMode, VerticalMode } from '@shared/autopilot';

export interface FGVars {
    'fg.fma.lateralMode': LateralMode,
    'fg.fma.lateralArmedBitmask': number,
    'fg.fma.verticalMode': VerticalMode,
}

export class FGDataPublisher extends SimVarPublisher<FGVars> {
    constructor(bus: EventBus) {
        super(new Map([
            ['fg.fma.lateralMode', { name: 'L:A32NX_FMA_LATERAL_MODE', type: SimVarValueType.Number }],
            ['fg.fma.lateralArmedBitmask', { name: 'L:A32NX_FMA_LATERAL_ARMED', type: SimVarValueType.Number }],
            ['fg.fma.verticalMode', {name: 'L:A32NX_FMA_VERTICAL_MODE', type : SimVarValueType.Number}]
        ]), bus);
    }
}
