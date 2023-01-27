import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export type ISISSimvars = {
    pitch: number;
    roll: number;
}

export enum ISISVars {
    pitch = 'PLANE PITCH DEGREES',
    roll = 'PLANE BANK DEGREES',
}

/** A publisher to poll and publish nav/com simvars. */
export class ISISSimvarPublisher extends SimVarPublisher<ISISSimvars> {
    private static simvars = new Map<keyof ISISSimvars, SimVarDefinition>([
        ['pitch', { name: ISISVars.pitch, type: SimVarValueType.Degree }],
        ['roll', { name: ISISVars.roll, type: SimVarValueType.Degree }],
    ])

    public constructor(bus: EventBus) {
        super(ISISSimvarPublisher.simvars, bus);
    }
}
