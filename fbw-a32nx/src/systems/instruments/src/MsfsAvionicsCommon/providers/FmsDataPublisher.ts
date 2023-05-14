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

        ]), stateSubject, bus);
    }
}
