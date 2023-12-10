import {EventBus, SimVarDefinition, SimVarPublisher, SimVarValueType} from '@microsoft/msfs-sdk';

export interface EFBSimvars {
    ltsTest: number;
    dcEssIsPowered: boolean;
    dcHot1IsPowered: boolean;
    absTime: number;
    timeOfDay: number;
    currentUTC: number;
    dayOfMonth: number;
    monthOfYear: number;
    year: number;
    elapsedKnobPos: number;
    dc2IsPowered: boolean;
    efbBrightness: number;
}

export enum EFBVars {
    ltsTest = 'L:A32NX_OVHD_INTLT_ANN',
    dcEssIsPowered = 'L:A32NX_ELEC_DC_ESS_BUS_IS_POWERED',
    dcHot1IsPowered = 'L:A32NX_ELEC_DC_HOT_1_BUS_IS_POWERED',
    absTime = 'E:ABSOLUTE TIME',
    timeOfDay = 'E:TIME OF DAY',
    currentUTC = 'E:ZULU TIME',
    dayOfMonth = 'E:ZULU DAY OF MONTH',
    monthOfYear = 'E:ZULU MONTH OF YEAR',
    year = 'E:ZULU YEAR',
    elapsedKnobPos = 'L:A32NX_CHRONO_ET_SWITCH_POS',
    dc2IsPowered = 'L:A32NX_ELEC_DC_2_BUS_IS_POWERED',
    efbBrightness = 'L:A32NX_EFB_BRIGHTNESS',
}

export class EFBSimvarPublisher extends SimVarPublisher<EFBSimvars> {
    private static simvars = new Map<keyof EFBSimvars, SimVarDefinition>([
        ['ltsTest', { name: EFBVars.ltsTest, type: SimVarValueType.Number }],
        ['dcEssIsPowered', { name: EFBVars.dcEssIsPowered, type: SimVarValueType.Bool }],
        ['dcHot1IsPowered', { name: EFBVars.dcHot1IsPowered, type: SimVarValueType.Bool }],
        ['absTime', { name: EFBVars.absTime, type: SimVarValueType.Number }],
        ['timeOfDay', { name: EFBVars.timeOfDay, type: SimVarValueType.Enum }],
        ['currentUTC', { name: EFBVars.currentUTC, type: SimVarValueType.Number }],
        ['dayOfMonth', { name: EFBVars.dayOfMonth, type: SimVarValueType.Number }],
        ['monthOfYear', { name: EFBVars.monthOfYear, type: SimVarValueType.Number }],
        ['year', { name: EFBVars.year, type: SimVarValueType.Number }],
        ['elapsedKnobPos', { name: EFBVars.elapsedKnobPos, type: SimVarValueType.Number }],
        ['dc2IsPowered', { name: EFBVars.dc2IsPowered, type: SimVarValueType.Bool }],
        ['efbBrightness', { name: EFBVars.efbBrightness, type: SimVarValueType.Number }],
    ])

    public constructor(bus: EventBus) {
        super(EFBSimvarPublisher.simvars, bus);
    }
}
