import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export type EWDSimvars = {
    acEssBus: boolean;
    ewdPotentiometer: number;
}

export enum EWDVars {
    acEssBus = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    ewdPotentiometer = 'LIGHT POTENTIOMETER:92',
}

export class EWDSimvarPublisher extends SimVarPublisher<EWDSimvars> {
    private static simvars = new Map<keyof EWDSimvars, SimVarDefinition>([
        ['acEssBus', { name: EWDVars.acEssBus, type: SimVarValueType.Bool }],
        ['ewdPotentiometer', { name: EWDVars.ewdPotentiometer, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(EWDSimvarPublisher.simvars, bus);
    }
}
