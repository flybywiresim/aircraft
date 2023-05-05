import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type ISISSimvars = {
    pitch: number;
    roll: number;
    dcEssLive: boolean;
    dcHotLive: boolean;
    coldDark: boolean;
    ias: number;
    latAcc: number;
}

export enum ISISVars {
    pitch = 'PLANE PITCH DEGREES',
    roll = 'PLANE BANK DEGREES',
    dcEssLive = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED',
    dcHotLive = 'L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED',
    coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
    ias = 'AIRSPEED INDICATED',
    latAcc = 'ACCELERATION BODY X',
}

/** A publisher to poll and publish nav/com simvars. */
export class ISISSimvarPublisher extends SimVarPublisher<ISISSimvars> {
    private static simvars = new Map<keyof ISISSimvars, SimVarDefinition>([
        ['pitch', { name: ISISVars.pitch, type: SimVarValueType.Degree }],
        ['roll', { name: ISISVars.roll, type: SimVarValueType.Degree }],
        ['dcEssLive', { name: ISISVars.dcEssLive, type: SimVarValueType.Bool }],
        ['dcHotLive', { name: ISISVars.dcHotLive, type: SimVarValueType.Bool }],
        ['coldDark', { name: ISISVars.coldDark, type: SimVarValueType.Bool }],
        ['ias', { name: ISISVars.ias, type: SimVarValueType.Knots }],
        ['latAcc', { name: ISISVars.latAcc, type: SimVarValueType.Number }],

    ])

    public constructor(bus: EventBus) {
        super(ISISSimvarPublisher.simvars, bus);
    }
}
