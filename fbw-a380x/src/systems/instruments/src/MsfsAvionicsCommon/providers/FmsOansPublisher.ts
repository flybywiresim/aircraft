// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EventBus, SimVarValueType, Subject } from '@microsoft/msfs-sdk';
import { SwitchableSimVarProvider } from './SwitchableProvider';

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
    fmsOrigin: string,
    fmsDestination: string,
    fmsAlternate: string,
    fmsLandingRunway: string;
    /** Length of selected landing runway, in meters. Null if no runway selected. */
    fmsLandingRunwayLength: number;
    /** Distance to opposite end of runway, in meters. Null if no runway selected. */
    landingRwyRemainingDistance: number;
}

export class FmsOansPublisher extends SwitchableSimVarProvider<FmsOansData, 'L' | 'R'> {
    constructor(
        bus: EventBus,
        stateSubject: Subject<'L' | 'R'>,
    ) {
        super(new Map([
            ['fmsOrigin', { name: (_side) => 'A380X_OANS_FMS_ACTIVE_ORIGIN', type: SimVarValueType.String }],
            ['fmsDestination', { name: (_side) => 'A380X_OANS_FMS_ACTIVE_DESTINATION', type: SimVarValueType.String }],
            ['fmsAlternate', { name: (_side) => 'A380X_OANS_FMS_ACTIVE_ALTERNATE', type: SimVarValueType.String }],
            ['fmsLandingRunway', { name: (_side) => 'A380X_OANS_FMS_SELECTED_LANDING_RUNWAY', type: SimVarValueType.String }],
            ['fmsLandingRunwayLength', { name: (_side) => 'L:A32NX_OANS_LANDING_RWY_LENGTH', type: SimVarValueType.Number }],
        ]), stateSubject, bus);
    }
}
