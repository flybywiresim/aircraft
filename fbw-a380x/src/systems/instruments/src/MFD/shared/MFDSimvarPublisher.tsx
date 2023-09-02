import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type MfdSimvars = {
    coldDark: number;
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    flightPhase: number;
    flexTemp: number;
    adirs1MaintWord: number;
    adirs2MaintWord: number;
    adirs3MaintWord: number;
  }

export enum MFDVars {
    coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
    elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
    potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
    potentiometerFo = 'LIGHT POTENTIOMETER:90',
    flightPhase = 'L:A32NX_FMGC_FLIGHT_PHASE',
    flexTemp = 'L:AIRLINER_TO_FLEX_TEMP',
    adirs1MaintWord = 'L:A32NX_ADIRS_IR_1_MAINT_WORD',
    adirs2MaintWord = 'L:A32NX_ADIRS_IR_2_MAINT_WORD',
    adirs3MaintWord = 'L:A32NX_ADIRS_IR_3_MAINT_WORD',
  }

/** A publisher to poll and publish nav/com simvars. */
export class MfdSimvarPublisher extends SimVarPublisher<MfdSimvars> {
    private static simvars = new Map<keyof MfdSimvars, SimVarDefinition>([
        ['coldDark', { name: MFDVars.coldDark, type: SimVarValueType.Number }],
        ['elec', { name: MFDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: MFDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: MFDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: MFDVars.potentiometerFo, type: SimVarValueType.Number }],
        ['flightPhase', { name: MFDVars.flightPhase, type: SimVarValueType.Enum }],
        ['flexTemp', { name: MFDVars.flexTemp, type: SimVarValueType.Number }],
        ['adirs1MaintWord', { name: MFDVars.adirs1MaintWord, type: SimVarValueType.Number }],
        ['adirs2MaintWord', { name: MFDVars.adirs2MaintWord, type: SimVarValueType.Number }],
        ['adirs3MaintWord', { name: MFDVars.adirs3MaintWord, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(MfdSimvarPublisher.simvars, bus);
    }
}
