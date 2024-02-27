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
    fmsLandingRunway: string,
    /** Length of selected landing runway, in meters. Null if no runway selected. */
    fmsLandingRunwayLength: number,
    /** Distance to opposite end of runway, in meters. Null if no runway selected. */
    landingRwyRemainingDistance: number,
}

export class FmsOansPublisher extends SimVarPublisher<FmsOansData> {
    constructor(bus: EventBus) {
        super(new Map([
            ['fmsLandingRunwayLength', { name: 'L:A32NX_OANS_LANDING_RWY_LENGTH', type: SimVarValueType.Number }],
            ['landingRwyRemainingDistance', { name: 'L:A32NX_OANS_LANDING_RWY_REMAINING', type: SimVarValueType.Number }],
        ]), bus);
    }
}
