import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export interface ClockSimvars {
    ltsTest: number;
}

export enum ClockVars {
    ltsTest = 'L:A32NX_OVHD_INTLT_ANN'
}

export class ClockSimvarPublisher extends SimVarPublisher<ClockSimvars> {
    private static simvars = new Map<keyof ClockSimvars, SimVarDefinition>([
        ['ltsTest', { name: ClockVars.ltsTest, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(ClockSimvarPublisher.simvars, bus);
    }
}
