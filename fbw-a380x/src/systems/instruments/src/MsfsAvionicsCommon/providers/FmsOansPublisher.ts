// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarPublisher, SimVarValueType } from '@microsoft/msfs-sdk';

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
    fmsOrigin: string,
    fmsDestination: string,
    fmsAlternate: string,
    /** Identifier of landing runway. */
    fmsLandingRunway: string,
    /** Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistance: number,
    /** Length of selected landing runway, in meters. */
    fmsLandingRunwayLength: number,
    /** Distance to opposite end of runway, in meters. */
    fmsRemainingDistToRwyEnd: number,
    /** Distance to requested stopping distance, in meters. */
    fmsRemainingDistToExit: number,
    /** Estimated runway occupancy time (ROT), in seconds. */
    btvRot: number,
}

export class FmsOansPublisher extends SimVarPublisher<FmsOansData> {
    constructor(bus: EventBus) {
        super(new Map([
            ['oansRequestedStoppingDistance', { name: 'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE', type: SimVarValueType.Number }],
            ['fmsLandingRunwayLength', { name: 'L:A32NX_OANS_BTV_RWY_LENGTH', type: SimVarValueType.Number }],
            ['fmsRemainingDistToRwyEnd', { name: 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END', type: SimVarValueType.Number }],
            ['fmsRemainingDistToExit', { name: 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT', type: SimVarValueType.Number }],
            ['btvRot', { name: 'L:A32NX_BTV_OANS_ROT', type: SimVarValueType.Number }],
        ]), bus);
    }
}
