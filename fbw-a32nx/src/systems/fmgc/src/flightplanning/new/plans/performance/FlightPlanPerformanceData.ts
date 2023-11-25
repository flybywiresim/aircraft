// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MappedSubject, Subject } from '@microsoft/msfs-sdk';

type VSpeedValue = number | undefined;

type AltitudeValue = Feet | undefined;

export class FlightPlanPerformanceData {
    public clone(): FlightPlanPerformanceData {
        const cloned = new FlightPlanPerformanceData();

        cloned.v1.set(this.v1.get());
        cloned.vr.set(this.vr.get());
        cloned.v2.set(this.v2.get());

        cloned.pilotThrustReductionAltitude.set(this.pilotThrustReductionAltitude.get());
        cloned.defaultThrustReductionAltitude.set(this.defaultThrustReductionAltitude.get());

        cloned.pilotAccelerationAltitude.set(this.pilotAccelerationAltitude.get());
        cloned.defaultAccelerationAltitude.set(this.defaultAccelerationAltitude.get());

        cloned.pilotEngineOutAccelerationAltitude.set(this.pilotEngineOutAccelerationAltitude.get());
        cloned.defaultEngineOutAccelerationAltitude.set(this.defaultEngineOutAccelerationAltitude.get());

        cloned.pilotMissedThrustReductionAltitude.set(this.pilotMissedThrustReductionAltitude.get());
        cloned.defaultMissedThrustReductionAltitude.set(this.defaultMissedThrustReductionAltitude.get());

        cloned.pilotMissedAccelerationAltitude.set(this.pilotMissedAccelerationAltitude.get());
        cloned.defaultMissedAccelerationAltitude.set(this.defaultMissedAccelerationAltitude.get());

        cloned.pilotMissedEngineOutAccelerationAltitude.set(this.pilotMissedEngineOutAccelerationAltitude.get());
        cloned.defaultMissedEngineOutAccelerationAltitude.set(this.defaultMissedEngineOutAccelerationAltitude.get());

        cloned.databaseTransitionAltitude.set(this.databaseTransitionAltitude.get());
        cloned.pilotTransitionAltitude.set(this.pilotTransitionAltitude.get());

        cloned.databaseTransitionLevel.set(this.databaseTransitionLevel.get());
        cloned.pilotTransitionLevel.set(this.pilotTransitionLevel.get());

        return cloned;
    }

    /**
     * Cruise FL
     */
    readonly cruiseFlightLevel = Subject.create<AltitudeValue>(undefined);

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
    readonly thrustReductionAltitude = MappedSubject.create(
        ([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10), this.defaultThrustReductionAltitude, this.pilotThrustReductionAltitude,
    )

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
    readonly accelerationAltitude = MappedSubject.create(
        ([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10), this.defaultAccelerationAltitude, this.pilotAccelerationAltitude,
    )

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
    readonly engineOutAccelerationAltitude = MappedSubject.create(
        ([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10), this.defaultEngineOutAccelerationAltitude, this.pilotEngineOutAccelerationAltitude,
    )

    /**
     * Whether EO ACC is from the database
     */
    readonly engineOutAccelerationAltitudeIsPilotEntered = this.pilotEngineOutAccelerationAltitude.map((it) => it !== undefined);

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
    readonly missedThrustReductionAltitude = MappedSubject.create(
        ([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10), this.defaultMissedThrustReductionAltitude, this.pilotMissedThrustReductionAltitude,
    )

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
    readonly missedAccelerationAltitude = MappedSubject.create(
        ([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10), this.defaultMissedAccelerationAltitude, this.pilotMissedAccelerationAltitude,
    )

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
    readonly missedEngineOutAccelerationAltitude = MappedSubject.create(
        ([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10),
        this.defaultMissedEngineOutAccelerationAltitude,
        this.pilotMissedEngineOutAccelerationAltitude,
    );

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
    readonly transitionAltitude = MappedSubject.create(([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db, 10), this.databaseTransitionAltitude, this.pilotTransitionAltitude);

    /**
     * Whether TRANS ALT is from the database
     */
    readonly transitionAltitudeIsFromDatabase = this.pilotTransitionAltitude.map((it) => it === undefined);

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
    readonly transitionLevel = MappedSubject.create(([db, pilot]) => FlightPlanPerformanceData.round(pilot ?? db), this.databaseTransitionLevel, this.pilotTransitionLevel);

    /**
     * Whether TRANS LVL is from the database
     */
    readonly transitionLevelIsFromDatabase = this.pilotTransitionLevel.map((it) => it === undefined);

    serialize(): SerializedFlightPlanPerformanceData {
        return {
            cruiseFlightLevel: this.cruiseFlightLevel.get(),
            v1: this.v1.get(),
            vr: this.vr.get(),
            v2: this.v2.get(),
            pilotThrustReductionAltitude: this.pilotThrustReductionAltitude.get(),
            defaultThrustReductionAltitude: this.defaultThrustReductionAltitude.get(),
            pilotAccelerationAltitude: this.pilotAccelerationAltitude.get(),
            defaultAccelerationAltitude: this.defaultAccelerationAltitude.get(),
            pilotEngineOutAccelerationAltitude: this.pilotEngineOutAccelerationAltitude.get(),
            defaultEngineOutAccelerationAltitude: this.defaultEngineOutAccelerationAltitude.get(),
            pilotMissedThrustReductionAltitude: this.pilotMissedThrustReductionAltitude.get(),
            defaultMissedThrustReductionAltitude: this.defaultMissedThrustReductionAltitude.get(),
            pilotMissedAccelerationAltitude: this.pilotMissedAccelerationAltitude.get(),
            defaultMissedAccelerationAltitude: this.defaultMissedAccelerationAltitude.get(),
            pilotMissedEngineOutAccelerationAltitude: this.pilotMissedEngineOutAccelerationAltitude.get(),
            defaultMissedEngineOutAccelerationAltitude: this.defaultMissedEngineOutAccelerationAltitude.get(),
            databaseTransitionAltitude: this.databaseTransitionAltitude.get(),
            pilotTransitionAltitude: this.pilotTransitionAltitude.get(),
            databaseTransitionLevel: this.databaseTransitionLevel.get(),
            pilotTransitionLevel: this.pilotTransitionLevel.get(),
        };
    }

    /**
     * Rounds a number to the nearest multiple
     * @param n the number to round
     * @param r the multiple
     * @returns n rounded to the nereast multiple of r, or null/undefined if n is null/undefined
     */
    private static round(n: number | undefined | null, r: number = 1): number | undefined | null {
        if (n === undefined || n === null) {
            return n;
        }
        return Math.round(n / r) * r;
    }
}

export interface SerializedFlightPlanPerformanceData {
    cruiseFlightLevel: number | undefined,

    v1: number | undefined,

    vr: number | undefined,

    v2: number | undefined,

    pilotThrustReductionAltitude: number | undefined,
    defaultThrustReductionAltitude: number | undefined,

    pilotAccelerationAltitude: number | undefined,
    defaultAccelerationAltitude: number | undefined,

    pilotEngineOutAccelerationAltitude: number | undefined,
    defaultEngineOutAccelerationAltitude: number | undefined,

    pilotMissedThrustReductionAltitude: number | undefined,
    defaultMissedThrustReductionAltitude: number | undefined,

    pilotMissedAccelerationAltitude: number | undefined,
    defaultMissedAccelerationAltitude: number | undefined,

    pilotMissedEngineOutAccelerationAltitude: number | undefined,
    defaultMissedEngineOutAccelerationAltitude: number | undefined,

    databaseTransitionAltitude: number | undefined,
    pilotTransitionAltitude: number | undefined,

    databaseTransitionLevel: number | undefined,
    pilotTransitionLevel: number | undefined,
}
