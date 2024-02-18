// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { MathUtils } from '@flybywiresim/fbw-sdk';

export interface FlightPlanPerformanceData {
    /** in knots */
    v1: number;

    /** in knots */
    vr: number;

    /** in knots */
    v2: number;

    /** in feet */
    databaseTransitionAltitude: number,

    /** as flight level */
    databaseTransitionLevel: number,

    /** in feet */
    pilotTransitionAltitude: number,

    /** as flight level */
    pilotTransitionLevel: number,

    /** in feet */
    get transitionAltitude(): number | undefined;

    get transitionAltitudeIsFromDatabase(): boolean;

    /** as flight level */
    get transitionLevel(): number | undefined;

    get transitionLevelIsFromDatabase(): boolean;

    costIndex: number,

    cruiseFlightLevel: number

    // THR RED

    /**
     * THR RED pilot entry
     */
    pilotThrustReductionAltitude: number;

    /**
     * THR RED from NAV database, in feet
     */
    defaultThrustReductionAltitude: number;

    /** in feet */
    get thrustReductionAltitude(): number | undefined;

    get thrustReductionAltitudeIsPilotEntered(): boolean;

    // ACC

    /**
     * ACC pilot entry, in feet
     */
    pilotAccelerationAltitude: number;

    /**
     * ACC from NAV database, in feet
     */
    defaultAccelerationAltitude: number;

    /** in feet */
    get accelerationAltitude(): number | undefined;

    get accelerationAltitudeIsPilotEntered(): boolean;

    // EO ACC

    /**
     * EO ACC pilot entry, in feet
     */
    pilotEngineOutAccelerationAltitude: number;

    /**
     * EO ACC from NAV database, in feet
     */
    defaultEngineOutAccelerationAltitude: number;

    /** in feet */
    get engineOutAccelerationAltitude(): number | undefined;

    get engineOutAccelerationAltitudeIsPilotEntered(): boolean;

    // MISSED THR RED

    /**
     * Missed THR RED pilot entry, in feet
     */
    pilotMissedThrustReductionAltitude: number;

    /**
     * Missed THR RED from NAV database, in feet
     */
    defaultMissedThrustReductionAltitude: number;

    /** in feet */
    get missedThrustReductionAltitude(): number | undefined;

    get missedThrustReductionAltitudeIsPilotEntered(): boolean;

    // MISSED ACC

    /**
     * Missed ACC pilot entry, in feet
     */
    pilotMissedAccelerationAltitude: number;

    /**
     * Missed ACC from NAV database, in feet
     */
    defaultMissedAccelerationAltitude: number;

    /** in feet */
    get missedAccelerationAltitude(): number | undefined;

    get missedAccelerationAltitudeIsPilotEntered(): boolean;

    // MISSED EO ACC

    /**
     * Missed EO ACC pilot entry, in feet
     */
    pilotMissedEngineOutAccelerationAltitude: number;

    /**
     * Missed EO ACC from NAV database, in feet
     */
    defaultMissedEngineOutAccelerationAltitude: number;

    /** in feet */
    get missedEngineOutAccelerationAltitude(): number | undefined;

    get missedEngineOutAccelerationAltitudeIsPilotEntered(): boolean;

    clone(): this;
}

export type FlightPlanPerformanceDataProperties = Omit<FlightPlanPerformanceData, 'clone'>

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
     * Cruise FL, as flight level (i.e. hundres of feet)
     */
    cruiseFlightLevel: number = undefined;

    /**
     * Cost index
     */
    costIndex: number = undefined;

    /**
     * V1 speed, in knots
     */
    v1: number = undefined;

    /**
     * VR speed, in knots
     */
    vr: number = undefined;

    /**
     * V2 speed, in knots
     */
    v2: number = undefined;

    // THR RED

    /**
     * THR RED pilot entry, in feet
     */
    pilotThrustReductionAltitude: number = undefined;

    /**
     * THR RED from NAV database, in feet
     */
    defaultThrustReductionAltitude: number = undefined;

    /**
     * THR RED from pilot if entered, otherwise from database, in feet
     */
    get thrustReductionAltitude() {
        const rawAlt = this.pilotThrustReductionAltitude ?? this.defaultThrustReductionAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether THR RED is from the database
     */
    get thrustReductionAltitudeIsPilotEntered() {
        return this.pilotThrustReductionAltitude !== undefined;
    }

    // ACC

    /**
     * ACC pilot entry, in feet
     */
    pilotAccelerationAltitude: number = undefined;

    /**
     * ACC from NAV database, in feet
     */
    defaultAccelerationAltitude: number = undefined;

    /**
     * ACC from pilot if entered, otherwise from database
     */
    get accelerationAltitude() {
        const rawAlt = this.pilotAccelerationAltitude ?? this.defaultAccelerationAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether ACC is from the database
     */
    get accelerationAltitudeIsPilotEntered() {
        return this.pilotAccelerationAltitude !== undefined;
    }

    // EO ACC

    /**
     * EO ACC pilot entry, in feet
     */
    pilotEngineOutAccelerationAltitude: number = undefined;

    /**
     * EO ACC from NAV database, in feet
     */
    defaultEngineOutAccelerationAltitude: number = undefined;

    /**
     * EO ACC from pilot if entered, otherwise from database
     */
    get engineOutAccelerationAltitude() {
        const rawAlt = this.pilotEngineOutAccelerationAltitude ?? this.defaultEngineOutAccelerationAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether EO ACC is from the database
     */
    get engineOutAccelerationAltitudeIsPilotEntered() {
        return this.pilotEngineOutAccelerationAltitude !== undefined;
    }

    // MISSED THR RED

    /**
     * Missed THR RED pilot entry, in feet
     */
    pilotMissedThrustReductionAltitude: number = undefined;

    /**
     * Missed THR RED from NAV database, in feet
     */
    defaultMissedThrustReductionAltitude: number = undefined;

    /**
     * Missed THR RED from pilot if entered, otherwise from database
     */
    get missedThrustReductionAltitude() {
        const rawAlt = this.pilotMissedThrustReductionAltitude ?? this.defaultMissedThrustReductionAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether missed THR RED is from the database
     */
    get missedThrustReductionAltitudeIsPilotEntered() {
        return this.pilotMissedThrustReductionAltitude !== undefined;
    }

    // MISSED ACC

    /**
     * Missed ACC pilot entry, in feet
     */
    pilotMissedAccelerationAltitude: number = undefined;

    /**
     * Missed ACC from NAV database, in feet
     */
    defaultMissedAccelerationAltitude: number = undefined;

    /**
     * Missed ACC from pilot if entered, otherwise from database
     */
    get missedAccelerationAltitude() {
        const rawAlt = this.pilotMissedAccelerationAltitude ?? this.defaultMissedAccelerationAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether missed ACC is from the database
     */
    get missedAccelerationAltitudeIsPilotEntered() {
        return this.pilotMissedAccelerationAltitude !== undefined;
    }

    // MISSED EO ACC

    /**
     * Missed EO ACC pilot entry, in feet
     */
    pilotMissedEngineOutAccelerationAltitude: number = undefined;

    /**
     * Missed EO ACC from NAV database, in feet
     */
    defaultMissedEngineOutAccelerationAltitude: number = undefined;

    /**
     * Missed EO ACC from pilot if entered, otherwise from database
     */
    get missedEngineOutAccelerationAltitude() {
        const rawAlt = this.pilotMissedEngineOutAccelerationAltitude ?? this.defaultMissedEngineOutAccelerationAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether missed EO ACC is from the database
     */
    get missedEngineOutAccelerationAltitudeIsPilotEntered() {
        return this.pilotMissedEngineOutAccelerationAltitude !== undefined;
    }

    /**
     * TRANS ALT from NAV database, in feet
     */
    databaseTransitionAltitude: number = undefined;

    /**
     * TRANS ALT from pilot entry, in feet
     */
    pilotTransitionAltitude: number = undefined;

    /**
     * TRANS ALT from pilot if entered, otherwise from database
     */
    get transitionAltitude() {
        const rawAlt = this.pilotTransitionAltitude ?? this.databaseTransitionAltitude;
        return rawAlt !== undefined ? MathUtils.round(rawAlt, -1) : undefined;
    }

    /**
     * Whether TRANS ALT is from the database
     */
    get transitionAltitudeIsFromDatabase() {
        return this.pilotTransitionAltitude === undefined;
    }

    /**
     * TRANS LVL from NAV database, as flight level (i.e. hundreds of feet)
     */
    databaseTransitionLevel: number = undefined;

    /**
     * TRANS LVL from pilot entry, as flight level (i.e. hundreds of feet)
     */
    pilotTransitionLevel: number = undefined;

    /**
     * TRANS LVL from pilot if entered, otherwise from database
     */
    get transitionLevel() {
        const rawLevel = this.pilotTransitionLevel ?? this.databaseTransitionLevel;
        return rawLevel !== undefined ? MathUtils.round(rawLevel, 0) : undefined;
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
