// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MappedSubject, Subject } from '@microsoft/msfs-sdk';

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

    // THR RED

    /**
     * THR RED pilot entry
     */
    readonly pilotThrustReductionAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * THR RED from NAV database
     */
    readonly defaultThrustReductionAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * THR RED from pilot if entered, otherwise from database
     */
    readonly thrustReductionAltitude = MappedSubject.create(([db, pilot]) => db ?? pilot, this.defaultThrustReductionAltitude, this.pilotThrustReductionAltitude)

    /**
     * Whether THR RED is from the database
     */
    readonly thrustReductionAltitudeIsPilotEntered = this.pilotThrustReductionAltitude.map((it) => it !== undefined);

    // ACC

    /**
     * ACC pilot entry
     */
    readonly pilotAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * ACC from NAV database
     */
    readonly defaultAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * ACC from pilot if entered, otherwise from database
     */
    readonly accelerationAltitude = MappedSubject.create(([db, pilot]) => db ?? pilot, this.defaultAccelerationAltitude, this.pilotAccelerationAltitude)

    /**
     * Whether ACC is from the database
     */
    readonly accelerationAltitudeIsPilotEntered = this.pilotAccelerationAltitude.map((it) => it !== undefined);

    // EO ACC

    /**
     * EO ACC pilot entry
     */
    readonly pilotEngineOutAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * EO ACC from NAV database
     */
    readonly defaultEngineOutAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * EO ACC from pilot if entered, otherwise from database
     */
    readonly engineOutAccelerationAltitude = MappedSubject.create(([db, pilot]) => db ?? pilot, this.defaultEngineOutAccelerationAltitude, this.pilotEngineOutAccelerationAltitude)

    /**
     * Whether EO ACC is from the database
     */
    readonly engineOutAccelerationAltitudeIsPilotEntered = this.pilotAccelerationAltitude.map((it) => it !== undefined);

    // MISSED THR RED

    /**
     * Missed THR RED pilot entry
     */
    readonly pilotMissedThrustReductionAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * Missed THR RED from NAV database
     */
    readonly defaultMissedThrustReductionAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * Missed THR RED from pilot if entered, otherwise from database
     */
    readonly missedThrustReductionAltitude = MappedSubject.create(([db, pilot]) => db ?? pilot, this.defaultMissedThrustReductionAltitude, this.pilotMissedThrustReductionAltitude)

    /**
     * Whether missed THR RED is from the database
     */
    readonly missedThrustReductionAltitudeIsPilotEntered = this.pilotMissedThrustReductionAltitude.map((it) => it !== undefined);

    // MISSED ACC

    /**
     * Missed ACC pilot entry
     */
    readonly pilotMissedAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * Missed ACC from NAV database
     */
    readonly defaultMissedAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * Missed ACC from pilot if entered, otherwise from database
     */
    readonly missedAccelerationAltitude = MappedSubject.create(([db, pilot]) => db ?? pilot, this.defaultMissedAccelerationAltitude, this.pilotMissedAccelerationAltitude)

    /**
     * Whether missed ACC is from the database
     */
    readonly missedAccelerationAltitudeIsPilotEntered = this.pilotMissedAccelerationAltitude.map((it) => it !== undefined);

    // MISSED EO ACC

    /**
     * Missed EO ACC pilot entry
     */
    readonly pilotMissedEngineOutAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * Missed EO ACC from NAV database
     */
    readonly defaultMissedEngineOutAccelerationAltitude = Subject.create<AltitudeValue>(undefined);

    /**
     * Missed EO ACC from pilot if entered, otherwise from database
     */
    readonly missedEngineOutAccelerationAltitude = MappedSubject.create(([db, pilot]) => db ?? pilot, this.defaultMissedEngineOutAccelerationAltitude, this.pilotMissedEngineOutAccelerationAltitude)

    /**
     * Whether missed EO ACC is from the database
     */
    readonly missedEngineOutAccelerationAltitudeIsPilotEntered = this.pilotMissedEngineOutAccelerationAltitude.map((it) => it !== undefined);

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

    /**
     * TRANS LVL from NAV database
     */
    readonly databaseTransitionLevel = Subject.create<AltitudeValue>(undefined);

    /**
     * TRANS LVL from pilot entry
     */
    readonly pilotTransitionLevel = Subject.create<AltitudeValue>(undefined);

    /**
     * TRANS LVL from pilot if entered, otherwise from database
     */
    readonly transitionLevel = MappedSubject.create(([db, pilot]) => pilot ?? db, this.databaseTransitionLevel, this.pilotTransitionLevel);

    /**
     * Whether TRANS LVL is from the database
     */
    readonly transitionLevelIsFromDatabase = this.pilotTransitionLevel.map((it) => it !== undefined);
}
