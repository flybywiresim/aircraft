import { EventBus, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { SwitchableSimVarProvider } from './SwitchableProvider';

export interface FmsVars {
    ndMessageFlags: number,
    crossTrackError: number,
    linearDeviationActive: boolean;
    targetAltitude: number;
    verticalProfileLatched: boolean;
    showSpeedMargins: boolean;
    upperSpeedMargin: number;
    lowerSpeedMargin: number;
    rnp: number;
    toWptIdent0Captain: number;
    toWptIdent1Captain: number;
    toWptBearingCaptain: number;
    toWptTrueBearingCaptain: number;
    toWptDistanceCaptain: number;
    toWptEtaCaptain: number;
    apprMessage0Captain: number;
    apprMessage1Captain: number;
}

export class FmsDataPublisher extends SwitchableSimVarProvider<FmsVars, 'L' | 'R'> {
    constructor(
        bus: EventBus,
        stateSubject: Subject<'L' | 'R'>,
    ) {
        super(new Map([
            ['ndMessageFlags', { name: (side) => `L:A32NX_EFIS_${side}_ND_FM_MESSAGE_FLAGS`, type: SimVarValueType.Number }],
            ['crossTrackError', { name: (_side) => 'L:A32NX_FG_CROSS_TRACK_ERROR', type: SimVarValueType.NM }],
            ['linearDeviationActive', { name: (_side) => 'L:A32NX_PFD_LINEAR_DEVIATION_ACTIVE', type: SimVarValueType.Bool }],
            ['targetAltitude', { name: (_side) => 'L:A32NX_PFD_TARGET_ALTITUDE', type: SimVarValueType.Feet }],
            ['verticalProfileLatched', { name: (_side) => 'L:A32NX_PFD_VERTICAL_PROFILE_LATCHED', type: SimVarValueType.Bool }],
            ['showSpeedMargins', { name: (_side) => 'L:A32NX_PFD_SHOW_SPEED_MARGINS', type: SimVarValueType.Bool }],
            ['upperSpeedMargin', { name: (_side) => 'L:A32NX_PFD_UPPER_SPEED_MARGIN', type: SimVarValueType.Knots }],
            ['lowerSpeedMargin', { name: (_side) => 'L:A32NX_PFD_LOWER_SPEED_MARGIN', type: SimVarValueType.Knots }],
            ['rnp', { name: (side) => `L:A32NX_FMGC_${side}_RNP`, type: SimVarValueType.Number }],
            ['toWptIdent0Captain', { name: (side) => `L:A32NX_EFIS_${side}_TO_WPT_IDENT_0`, type: SimVarValueType.Number }],
            ['toWptIdent1Captain', { name: (side) => `L:A32NX_EFIS_${side}_TO_WPT_IDENT_1`, type: SimVarValueType.Number }],
            ['toWptBearingCaptain', { name: (side) => `L:A32NX_EFIS_${side}_TO_WPT_BEARING`, type: SimVarValueType.Degree }],
            ['toWptTrueBearingCaptain', { name: (side) => `L:A32NX_EFIS_${side}_TO_WPT_TRUE_BEARING`, type: SimVarValueType.Degree }],
            ['toWptDistanceCaptain', { name: (side) => `L:A32NX_EFIS_${side}_TO_WPT_DISTANCE`, type: SimVarValueType.Number }],
            ['toWptEtaCaptain', { name: (side) => `L:A32NX_EFIS_${side}_TO_WPT_ETA`, type: SimVarValueType.Seconds }],
            ['apprMessage0Captain', { name: (side) => `L:A32NX_EFIS_${side}_APPR_MSG_0`, type: SimVarValueType.Number }],
            ['apprMessage1Captain', { name: (side) => `L:A32NX_EFIS_${side}_APPR_MSG_1`, type: SimVarValueType.Number }],

        ]), stateSubject, bus);
    }
}
