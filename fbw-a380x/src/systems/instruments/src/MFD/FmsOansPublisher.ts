// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BasePublisher, EventBus } from '@microsoft/msfs-sdk';
import { EfisSide, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
    fmsOrigin: string,
    fmsDestination: string,
    fmsAlternate: string,
    fmsLandingRunway: string;
}

export class FmsOansPublisher extends BasePublisher<FmsOansData> {
    private readonly events: GenericDataListenerSync[] = [];

    constructor(bus: EventBus, side: EfisSide) {
        super(bus);

        this.events.push(new GenericDataListenerSync((ev, data: string) => {
            this.publish('fmsOrigin', data);
        }, `A380X_OANS_${side}_FMS_ACTIVE_ORIGIN`));

        this.events.push(new GenericDataListenerSync((ev, data: string) => {
            this.publish('fmsDestination', data);
        }, `A380X_OANS_${side}_FMS_ACTIVE_DESTINATION`));

        this.events.push(new GenericDataListenerSync((ev, data: string) => {
            this.publish('fmsAlternate', data);
        }, `A380X_OANS_${side}_FMS_ACTIVE_ALTERNATE`));

        this.events.push(new GenericDataListenerSync((ev, data: string) => {
            this.publish('fmsLandingRunway', data);
        }, `A380X_OANS_${side}_FMS_SELECTED_LANDING_RUNWAY`));
    }
}
