import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface PfdVisualAlertSimVars {
    fwcFlightPhase: number,
    autobrakeRopActive: boolean,
    manualBrakingRopActive: boolean,
    rowIfWetRwyTooShort: boolean,
    rowRwyTooShort: boolean,
    oansRwyAhead: boolean,
    stallWarning: boolean,
    stopRudderInput: boolean,
    windshear: boolean,
    wsAheadWarning: boolean,
    wsAheadCaution: boolean,
}

export class PfdVisualAlertPublisher extends SimVarPublisher<PfdVisualAlertSimVars> {
    constructor(bus: EventBus) {
        super(new Map([
            ['fwcFlightPhase', { name: 'L:A32NX_FWC_FLIGHT_PHASE', type: SimVarValueType.Number }],
            ['autobrakeRopActive', { name: 'L:A32NX_AUTOBRAKE_ROP_ACTIVE', type: SimVarValueType.Bool }],
            ['manualBrakingRopActive', { name: 'L:A32NX_MANUAL_BRAKING_ROP_ACTIVE', type: SimVarValueType.Bool }],
            ['rowIfWetRwyTooShort', { name: 'L:A32NX_ROW_IF_WET_RWY_TOO_SHORT', type: SimVarValueType.Bool }],
            ['rowRwyTooShort', { name: 'L:A32NX_ROW_RWY_TOO_SHORT', type: SimVarValueType.Bool }],
            ['oansRwyAhead', { name: 'L:A32NX_OANS_RWY_AHEAD', type: SimVarValueType.Bool }],
            ['stallWarning', { name: 'L:A32NX_STALL_WARNING', type: SimVarValueType.Bool }],
            ['stopRudderInput', { name: 'L:A32NX_STOP_RUDDER_INPUT', type: SimVarValueType.Bool }],
            ['windshear', { name: 'L:A32NX_WINDSHEAR', type: SimVarValueType.Bool }],
            ['wsAheadWarning', { name: 'L:A32NX_WINDSHEAR_AHEAD_LEVEL_3', type: SimVarValueType.Bool }],
            ['wsAheadCaution', { name: 'L:A32NX_WINDSHEAR_AHEAD_LEVEL_2', type: SimVarValueType.Bool }],
        ]), bus);
    }
}
