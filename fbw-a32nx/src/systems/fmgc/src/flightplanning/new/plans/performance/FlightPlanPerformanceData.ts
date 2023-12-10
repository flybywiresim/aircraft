// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface FlightPlanPerformanceData {
    v1: number;

    vr: number;

    v2: number;

    databaseTransitionAltitude: number,

    databaseTransitionLevel: number,

    pilotTransitionAltitude: number,

    pilotTransitionLevel: number,

    get transitionAltitude(): AltitudeValue;

    get transitionAltitudeIsFromDatabase(): boolean;

    get transitionLevel(): AltitudeValue;

    get transitionLevelIsFromDatabase(): boolean;

    costIndex: number,

    cruiseFlightLevel: number

    // THR RED

    /**
     * THR RED pilot entry
     */
    pilotThrustReductionAltitude: AltitudeValue;

    /**
     * THR RED from NAV database
     */
    defaultThrustReductionAltitude: AltitudeValue;

    get thrustReductionAltitude(): AltitudeValue;

    get thrustReductionAltitudeIsPilotEntered(): boolean;

    // ACC

    /**
     * ACC pilot entry
     */
    pilotAccelerationAltitude: AltitudeValue;

    /**
     * ACC from NAV database
     */
    defaultAccelerationAltitude: AltitudeValue;

    get accelerationAltitude(): AltitudeValue;

    get accelerationAltitudeIsPilotEntered(): boolean;

    // EO ACC

    /**
     * EO ACC pilot entry
     */
    pilotEngineOutAccelerationAltitude: AltitudeValue;

    /**
     * EO ACC from NAV database
     */
    defaultEngineOutAccelerationAltitude: AltitudeValue;

    get engineOutAccelerationAltitude(): AltitudeValue;

    get engineOutAccelerationAltitudeIsPilotEntered(): boolean;

    // MISSED THR RED

    /**
     * Missed THR RED pilot entry
     */
    pilotMissedThrustReductionAltitude: AltitudeValue;

    /**
     * Missed THR RED from NAV database
     */
    defaultMissedThrustReductionAltitude: AltitudeValue;

    get missedThrustReductionAltitude(): AltitudeValue;

    get missedThrustReductionAltitudeIsPilotEntered(): boolean;

    // MISSED ACC

    /**
     * Missed ACC pilot entry
     */
    pilotMissedAccelerationAltitude: AltitudeValue;

    /**
     * Missed ACC from NAV database
     */
    defaultMissedAccelerationAltitude: AltitudeValue;

    get missedAccelerationAltitude(): AltitudeValue;

    get missedAccelerationAltitudeIsPilotEntered(): boolean;

    // MISSED EO ACC

    /**
     * Missed EO ACC pilot entry
     */
    pilotMissedEngineOutAccelerationAltitude: AltitudeValue;

    /**
     * Missed EO ACC from NAV database
     */
    defaultMissedEngineOutAccelerationAltitude: AltitudeValue;

    get missedEngineOutAccelerationAltitude(): AltitudeValue;

    get missedEngineOutAccelerationAltitudeIsPilotEntered(): boolean;

    clone(): this;
}

export type FlightPlanPerformanceDataProperties = Omit<FlightPlanPerformanceData, 'clone'>

type VSpeedValue = number | undefined;

type AltitudeValue = Feet | undefined;

type CostIndexValue = number | undefined;

// TODO this should remain in fbw-a32nx/ once FMS is moved to fbw-common

export class A320FlightPlanPerformanceData implements FlightPlanPerformanceData {
    public clone(): this {
        const cloned = new A320FlightPlanPerformanceData();

        cloned.v1 = this.v1;
        cloned.vr = this.vr;
        cloned.v2 = this.v2;

        cloned.pilotThrustReductionAltitude = this.pilotThrustReductionAltitude;
        cloned.defaultThrustReductionAltitude = this.defaultThrustReductionAltitude;

        cloned.pilotAccelerationAltitude = this.pilotAccelerationAltitude;
        cloned.defaultAccelerationAltitude = this.defaultAccelerationAltitude;

        cloned.pilotEngineOutAccelerationAltitude = this.pilotEngineOutAccelerationAltitude;
        cloned.defaultEngineOutAccelerationAltitude = this.defaultEngineOutAccelerationAltitude;

        cloned.pilotMissedThrustReductionAltitude = this.pilotMissedThrustReductionAltitude;
        cloned.defaultMissedThrustReductionAltitude = this.defaultMissedThrustReductionAltitude;

        cloned.pilotMissedAccelerationAltitude = this.pilotMissedAccelerationAltitude;
        cloned.defaultMissedAccelerationAltitude = this.defaultMissedAccelerationAltitude;

        cloned.pilotMissedEngineOutAccelerationAltitude = this.pilotMissedEngineOutAccelerationAltitude;
        cloned.defaultMissedEngineOutAccelerationAltitude = this.defaultMissedEngineOutAccelerationAltitude;

        cloned.databaseTransitionAltitude = this.databaseTransitionAltitude;
        cloned.pilotTransitionAltitude = this.pilotTransitionAltitude;

        cloned.databaseTransitionLevel = this.databaseTransitionLevel;
        cloned.pilotTransitionLevel = this.pilotTransitionLevel;

        cloned.cruiseFlightLevel = this.cruiseFlightLevel;
        cloned.costIndex = this.costIndex;

        return cloned as this;
    }

    /**
     * Cruise FL
     */
    cruiseFlightLevel: AltitudeValue = undefined;

    /**
     * Cost index
     */
    costIndex: CostIndexValue = undefined;

    /**
     * V1 speed
     */
    v1: VSpeedValue = undefined;

    /**
     * VR speed
     */
    vr: VSpeedValue = undefined;

    /**
     * V2 speed
     */
    v2: VSpeedValue = undefined;

    // THR RED

    /**
     * THR RED pilot entry
     */
    pilotThrustReductionAltitude: AltitudeValue = undefined;

    /**
     * THR RED from NAV database
     */
    defaultThrustReductionAltitude: AltitudeValue = undefined;

    /**
     * THR RED from pilot if entered, otherwise from database
     */
    get thrustReductionAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotThrustReductionAltitude ?? this.defaultThrustReductionAltitude, 10);
    }

    /**
     * Whether THR RED is from the database
     */
    get thrustReductionAltitudeIsPilotEntered() {
        return this.pilotThrustReductionAltitude !== undefined;
    }

    // ACC

    /**
     * ACC pilot entry
     */
    pilotAccelerationAltitude: AltitudeValue = undefined;

    /**
     * ACC from NAV database
     */
    defaultAccelerationAltitude: AltitudeValue = undefined;

    /**
     * ACC from pilot if entered, otherwise from database
     */
    get accelerationAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotAccelerationAltitude ?? this.defaultAccelerationAltitude, 10);
    }

    /**
     * Whether ACC is from the database
     */
    get accelerationAltitudeIsPilotEntered() {
        return this.pilotAccelerationAltitude !== undefined;
    }

    // EO ACC

    /**
     * EO ACC pilot entry
     */
    pilotEngineOutAccelerationAltitude: AltitudeValue = undefined;

    /**
     * EO ACC from NAV database
     */
    defaultEngineOutAccelerationAltitude: AltitudeValue = undefined;

    /**
     * EO ACC from pilot if entered, otherwise from database
     */
    get engineOutAccelerationAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotEngineOutAccelerationAltitude ?? this.defaultEngineOutAccelerationAltitude, 10);
    }

    /**
     * Whether EO ACC is from the database
     */
    get engineOutAccelerationAltitudeIsPilotEntered() {
        return this.pilotEngineOutAccelerationAltitude !== undefined;
    }

    // MISSED THR RED

    /**
     * Missed THR RED pilot entry
     */
    pilotMissedThrustReductionAltitude: AltitudeValue = undefined;

    /**
     * Missed THR RED from NAV database
     */
    defaultMissedThrustReductionAltitude: AltitudeValue = undefined;

    /**
     * Missed THR RED from pilot if entered, otherwise from database
     */
    get missedThrustReductionAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotMissedThrustReductionAltitude ?? this.defaultMissedThrustReductionAltitude, 10);
    }

    /**
     * Whether missed THR RED is from the database
     */
    get missedThrustReductionAltitudeIsPilotEntered() {
        return this.pilotMissedThrustReductionAltitude !== undefined;
    }

    // MISSED ACC

    /**
     * Missed ACC pilot entry
     */
    pilotMissedAccelerationAltitude: AltitudeValue = undefined;

    /**
     * Missed ACC from NAV database
     */
    defaultMissedAccelerationAltitude: AltitudeValue = undefined;

    /**
     * Missed ACC from pilot if entered, otherwise from database
     */
    get missedAccelerationAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotMissedAccelerationAltitude ?? this.defaultMissedAccelerationAltitude, 10);
    }

    /**
     * Whether missed ACC is from the database
     */
    get missedAccelerationAltitudeIsPilotEntered() {
        return this.pilotMissedAccelerationAltitude !== undefined;
    }

    // MISSED EO ACC

    /**
     * Missed EO ACC pilot entry
     */
    pilotMissedEngineOutAccelerationAltitude: AltitudeValue = undefined;

    /**
     * Missed EO ACC from NAV database
     */
    defaultMissedEngineOutAccelerationAltitude: AltitudeValue = undefined;

    /**
     * Missed EO ACC from pilot if entered, otherwise from database
     */
    get missedEngineOutAccelerationAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotMissedEngineOutAccelerationAltitude ?? this.defaultMissedEngineOutAccelerationAltitude, 10);
    }

    /**
     * Whether missed EO ACC is from the database
     */
    get missedEngineOutAccelerationAltitudeIsPilotEntered() {
        return this.pilotMissedEngineOutAccelerationAltitude !== undefined;
    }

    /**
     * TRANS ALT from NAV database
     */
    databaseTransitionAltitude: AltitudeValue = undefined;

    /**
     * TRANS ALT from pilot entry
     */
    pilotTransitionAltitude: AltitudeValue = undefined;

    /**
     * TRANS ALT from pilot if entered, otherwise from database
     */
    get transitionAltitude() {
        return A320FlightPlanPerformanceData.round(this.pilotTransitionAltitude ?? this.databaseTransitionAltitude, 10);
    }

    /**
     * Whether TRANS ALT is from the database
     */
    get transitionAltitudeIsFromDatabase() {
        return this.pilotTransitionAltitude === undefined;
    }

    /**
     * TRANS LVL from NAV database
     */
    databaseTransitionLevel: AltitudeValue = undefined;

    /**
     * TRANS LVL from pilot entry
     */
    pilotTransitionLevel: AltitudeValue = undefined;

    /**
     * TRANS LVL from pilot if entered, otherwise from database
     */
    get transitionLevel() {
        return A320FlightPlanPerformanceData.round(this.pilotTransitionLevel ?? this.databaseTransitionLevel);
    }

    /**
     * Whether TRANS LVL is from the database
     */
    get transitionLevelIsFromDatabase() {
        return this.pilotTransitionLevel === undefined;
    }

    serialize(): SerializedFlightPlanPerformanceData {
        return {
            cruiseFlightLevel: this.cruiseFlightLevel,
            costIndex: this.costIndex,
            v1: this.v1,
            vr: this.vr,
            v2: this.v2,
            pilotThrustReductionAltitude: this.pilotThrustReductionAltitude,
            defaultThrustReductionAltitude: this.defaultThrustReductionAltitude,
            pilotAccelerationAltitude: this.pilotAccelerationAltitude,
            defaultAccelerationAltitude: this.defaultAccelerationAltitude,
            pilotEngineOutAccelerationAltitude: this.pilotEngineOutAccelerationAltitude,
            defaultEngineOutAccelerationAltitude: this.defaultEngineOutAccelerationAltitude,
            pilotMissedThrustReductionAltitude: this.pilotMissedThrustReductionAltitude,
            defaultMissedThrustReductionAltitude: this.defaultMissedThrustReductionAltitude,
            pilotMissedAccelerationAltitude: this.pilotMissedAccelerationAltitude,
            defaultMissedAccelerationAltitude: this.defaultMissedAccelerationAltitude,
            pilotMissedEngineOutAccelerationAltitude: this.pilotMissedEngineOutAccelerationAltitude,
            defaultMissedEngineOutAccelerationAltitude: this.defaultMissedEngineOutAccelerationAltitude,
            databaseTransitionAltitude: this.databaseTransitionAltitude,
            pilotTransitionAltitude: this.pilotTransitionAltitude,
            databaseTransitionLevel: this.databaseTransitionLevel,
            pilotTransitionLevel: this.pilotTransitionLevel,
        };
    }

    /**
     * Rounds a number to the nearest multiple
     * @param n the number to round
     * @param r the multiple
     * @returns n rounded to the nereast multiple of r, or null/undefined if n is null/undefined
     */
    static round(n: number | undefined | null, r: number = 1): number | undefined | null {
        if (n === undefined || n === null) {
            return n;
        }
        return Math.round(n / r) * r;
    }
}

export interface SerializedFlightPlanPerformanceData {
    cruiseFlightLevel: number | undefined,
    costIndex: number | undefined,

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
