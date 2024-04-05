import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

export interface RopRowOansSimVars {
    autobrakeRopActive: boolean,
    manualBrakingRopActive: boolean,
    rowIfWetRwyTooShort: boolean,
    rowRwyTooShort: boolean,
    oansRwyAhead: boolean,
}

export class RopRowOansPublisher extends SimVarPublisher<RopRowOansSimVars> {
    constructor(bus: EventBus) {
        super(new Map([
            ['autobrakeRopActive', { name: 'L:A32NX_AUTOBRAKE_ROP_ACTIVE', type: SimVarValueType.Bool }],
            ['manualBrakingRopActive', { name: 'L:A32NX_MANUAL_BRAKING_ROP_ACTIVE', type: SimVarValueType.Bool }],
            ['rowIfWetRwyTooShort', { name: 'L:A32NX_ROW_IF_WET_RWY_TOO_SHORT', type: SimVarValueType.Bool }],
            ['rowRwyTooShort', { name: 'L:A32NX_ROW_RWY_TOO_SHORT', type: SimVarValueType.Bool }],
            ['oansRwyAhead', { name: 'L:A32NX_OANS_RWY_AHEAD', type: SimVarValueType.Bool }],
        ]), bus);
    }
}
