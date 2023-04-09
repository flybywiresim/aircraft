import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from 'msfssdk';

export type MFDSimvars = {
    coldDark: number;
    elec: number;
    elecFo: number;
    potentiometerCaptain: number;
    potentiometerFo: number;
  }

export enum MFDVars {
    coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
    elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
    potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
    potentiometerFo = 'LIGHT POTENTIOMETER:90',
  }

/** A publisher to poll and publish nav/com simvars. */
export class MFDSimvarPublisher extends SimVarPublisher<MFDSimvars> {
    private static simvars = new Map<keyof MFDSimvars, SimVarDefinition>([
        ['coldDark', { name: MFDVars.coldDark, type: SimVarValueType.Number }],
        ['elec', { name: MFDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: MFDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: MFDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: MFDVars.potentiometerFo, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(MFDSimvarPublisher.simvars, bus);
    }
}
