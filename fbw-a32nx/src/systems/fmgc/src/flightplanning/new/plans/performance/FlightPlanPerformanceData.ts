// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MappedSubject, Subject } from 'msfssdk';

type VSpeedValue = number | undefined;

type AltitudeValue = number | undefined;

export class FlightPlanPerformanceData {
    /**
     * V1 speed
     */
    readonly v1 = Subject.create<VSpeedValue>(undefined);

    /**
     * VR speed
     */
    readonly vr = Subject.create<VSpeedValue>(undefined);

    /**
     * V2 speed
     */
    readonly v2 = Subject.create<VSpeedValue>(undefined);

    /**
     * TRANS ALT from NAV database
     */
    readonly databaseTransitionAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * TRANS ALT from pilot entry
     */
    readonly pilotTransitionAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * TRANS ALT from pilot if entered, otherwise from database
     */
    readonly transitionAltitude = MappedSubject.create(([db, pilot]) => pilot ?? db, this.databaseTransitionAltitude, this.pilotTransitionAltitude);

    /**
     * Whether TRANS ALT is from the database
     */
    readonly transitionAltitudeIsFromDatabase = this.pilotTransitionAltitude.map((it) => it !== undefined);
}
