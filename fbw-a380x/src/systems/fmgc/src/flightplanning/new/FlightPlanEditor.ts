// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanIndex, FlightPlanManager } from '@fmgc/flightplanning/new/FlightPlanManager';

/**
 * Allows high-level operations to be made to a flight plan
 */
export class FlightPlanEditor {
    /**
     * Creates a flight plan editor for the active flight plan
     */
    static forActive(fpm: FlightPlanManager) {
        return new FlightPlanEditor(false, undefined, fpm);
    }

    /**
     * Crates a flight plan editor for a secondary flight plan. Index is only used on A380.
     */
    static forSecondary(fpm: FlightPlanManager, index = 0) {
        return new FlightPlanEditor(true, index, fpm);
    }

    private constructor(
        private secondary: boolean,
        private secondaryIndex: number | undefined,
        private fpm: FlightPlanManager,
    ) {
    }

    private get fpmIndex(): number {
        return this.secondary ? FlightPlanIndex.FirstSecondary + this.secondaryIndex : FlightPlanIndex.Temporary;
    }
}
