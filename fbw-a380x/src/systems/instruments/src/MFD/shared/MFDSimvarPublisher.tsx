import { EventBus, SimVarDefinition, SimVarValueType, SimVarPublisher } from '@microsoft/msfs-sdk';

export type MfdSimvars = {
    coldDark: number;
    elec: boolean;
    elecFo: boolean;
    potentiometerCaptain: number;
    potentiometerFo: number;
    fmsDataKnob: number;
    flightPhase: number;
    flexTemp: number;
    adirs1MaintWord: number;
    adirs2MaintWord: number;
    adirs3MaintWord: number;
    kccuDir: number;
    kccuPerf: number;
    kccuInit: number;
    kccuNavaid: number;
    kccuFpln: number;
    kccuDest: number;
  }

export enum MFDVars {
    coldDark = 'L:A32NX_COLD_AND_DARK_SPAWN',
    elec = 'L:A32NX_ELEC_AC_ESS_BUS_IS_POWERED',
    elecFo = 'L:A32NX_ELEC_AC_2_BUS_IS_POWERED',
    potentiometerCaptain = 'LIGHT POTENTIOMETER:88',
    potentiometerFo = 'LIGHT POTENTIOMETER:90',
    fmsDataKnob = 'L:A32NX_EIS_DMC_SWITCHING_KNOB',
    flightPhase = 'L:A32NX_FMGC_FLIGHT_PHASE',
    flexTemp = 'L:AIRLINER_TO_FLEX_TEMP',
    adirs1MaintWord = 'L:A32NX_ADIRS_IR_1_MAINT_WORD',
    adirs2MaintWord = 'L:A32NX_ADIRS_IR_2_MAINT_WORD',
    adirs3MaintWord = 'L:A32NX_ADIRS_IR_3_MAINT_WORD',
    kccuDir = 'L:A32NX_KCCU_L_DIR',
    kccuPerf = 'L:A32NX_KCCU_L_PERF',
    kccuInit = 'L:A32NX_KCCU_L_INIT',
    kccuNavaid = 'L:A32NX_KCCU_L_NAVAID',
    kccuFpln = 'L:A32NX_KCCU_L_FPLN',
    kccuDest = 'L:A32NX_KCCU_L_DEST',
  }

/** A publisher to poll and publish nav/com simvars. */
export class MfdSimvarPublisher extends SimVarPublisher<MfdSimvars> {
    private static simvars = new Map<keyof MfdSimvars, SimVarDefinition>([
        ['coldDark', { name: MFDVars.coldDark, type: SimVarValueType.Number }],
        ['elec', { name: MFDVars.elec, type: SimVarValueType.Bool }],
        ['elecFo', { name: MFDVars.elecFo, type: SimVarValueType.Bool }],
        ['potentiometerCaptain', { name: MFDVars.potentiometerCaptain, type: SimVarValueType.Number }],
        ['potentiometerFo', { name: MFDVars.potentiometerFo, type: SimVarValueType.Number }],
        ['fmsDataKnob', { name: MFDVars.fmsDataKnob, type: SimVarValueType.Enum }],
        ['flightPhase', { name: MFDVars.flightPhase, type: SimVarValueType.Enum }],
        ['flexTemp', { name: MFDVars.flexTemp, type: SimVarValueType.Number }],
        ['adirs1MaintWord', { name: MFDVars.adirs1MaintWord, type: SimVarValueType.Number }],
        ['adirs2MaintWord', { name: MFDVars.adirs2MaintWord, type: SimVarValueType.Number }],
        ['adirs3MaintWord', { name: MFDVars.adirs3MaintWord, type: SimVarValueType.Number }],
        ['kccuDir', { name: MFDVars.kccuDir, type: SimVarValueType.Number }],
        ['kccuPerf', { name: MFDVars.kccuPerf, type: SimVarValueType.Number }],
        ['kccuInit', { name: MFDVars.kccuInit, type: SimVarValueType.Number }],
        ['kccuNavaid', { name: MFDVars.kccuNavaid, type: SimVarValueType.Number }],
        ['kccuFpln', { name: MFDVars.kccuFpln, type: SimVarValueType.Number }],
        ['kccuDest', { name: MFDVars.kccuDest, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(MfdSimvarPublisher.simvars, bus);
    }
}
