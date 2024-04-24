import { EventBus, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { AdirsSimVars } from '../MsfsAvionicsCommon/SimVarTypes';
import { UpdatableSimVarPublisher } from '../MsfsAvionicsCommon/UpdatableSimVarPublisher';

export type BATSimvars = AdirsSimVars & {
    annSwitchState: number;
    dc2IsPowered: boolean;
    batVoltage1: number;
    batVoltage2: number;
}

export enum BATVars {
    annSwitchState = 'L:A32NX_OVHD_INTLT_ANN',
    dc2IsPowered = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
    batVoltage1 = 'L:A32NX_ELEC_BAT_1_POTENTIAL',
    batVoltage2 = 'L:A32NX_ELEC_BAT_2_POTENTIAL',
}

export class BATSimvarPublisher extends UpdatableSimVarPublisher<BATSimvars> {
    private static simvars = new Map<keyof BATSimvars, SimVarDefinition>([
        ['annSwitchState', { name: BATVars.annSwitchState, type: SimVarValueType.Number }],
        ['dc2IsPowered', { name: BATVars.dc2IsPowered, type: SimVarValueType.Bool }],
        ['batVoltage1', { name: BATVars.batVoltage1, type: SimVarValueType.Volts }],
        ['batVoltage2', { name: BATVars.batVoltage2, type: SimVarValueType.Volts }],
    ])

    public constructor(bus: EventBus) {
        super(BATSimvarPublisher.simvars, bus);
    }
}
