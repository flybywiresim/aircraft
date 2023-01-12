import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export interface ClockSimvars {
    ltsTest: number;
    dcEssIsPowered: boolean;
    absTime: number;
}

export enum ClockVars {
    ltsTest = 'L:A32NX_OVHD_INTLT_ANN',
    dcEssIsPowered = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED',
    absTime = 'E:ABSOLUTE TIME',
}

export class ClockSimvarPublisher extends SimVarPublisher<ClockSimvars> {
    private static simvars = new Map<keyof ClockSimvars, SimVarDefinition>([
        ['ltsTest', { name: ClockVars.ltsTest, type: SimVarValueType.Number }],
        ['dcEssIsPowered', { name: ClockVars.dcEssIsPowered, type: SimVarValueType.Bool }],
        ['absTime', { name: ClockVars.absTime, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(ClockSimvarPublisher.simvars, bus);
    }
}
