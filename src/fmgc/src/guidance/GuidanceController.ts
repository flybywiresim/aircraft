//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { PseudoWaypoint } from '@fmgc/guidance/PsuedoWaypoint';
import { PseudoWaypoints } from '@fmgc/guidance/lnav/PseudoWaypoints';
import { LnavDriver } from './lnav/LnavDriver';
import { FlightPlanManager } from '../flightplanning/FlightPlanManager';
import { GuidanceManager } from './GuidanceManager';
import { VnavDriver } from './vnav/VnavDriver';

// How often the (milliseconds)
const GEOMETRY_RECOMPUTATION_TIMER = 5_000;

export class GuidanceController {
    public flightPlanManager: FlightPlanManager;

    public guidanceManager: GuidanceManager;

    public lnavDriver: LnavDriver;

    public vnavDriver: VnavDriver;

    public pseudoWaypoints: PseudoWaypoints;

    public currentActiveLegPathGeometry: Geometry | null;

    public currentMultipleLegGeometry: Geometry | null;

    public activeLegIndex: number;

    public activeLegDtg: NauticalMiles;

    public activeLegCompleteLegPathDtg: NauticalMiles;

    public displayActiveLegCompleteLegPathDtg: NauticalMiles;

    public currentPseudoWaypoints: PseudoWaypoint[] = [];

    constructor(flightPlanManager: FlightPlanManager, guidanceManager: GuidanceManager) {
        this.flightPlanManager = flightPlanManager;
        this.guidanceManager = guidanceManager;

        this.lnavDriver = new LnavDriver(this);
        this.vnavDriver = new VnavDriver(this);
        this.pseudoWaypoints = new PseudoWaypoints(this);
    }

    init() {
        console.log('[FMGC/Guidance] GuidanceController initialized!');

        this.generateNewGeometry();

        this.lnavDriver.init();
        this.vnavDriver.init();
        this.pseudoWaypoints.init();
    }

    private lastFlightPlanVersion = SimVar.GetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number');

    private geometryRecomputationTimer = 0;

    update(deltaTime: number) {
        this.geometryRecomputationTimer += deltaTime;

        // Generate new geometry when flight plan changes
        const newFlightPlanVersion = this.flightPlanManager.currentFlightPlanVersion;
        if (newFlightPlanVersion !== this.lastFlightPlanVersion) {
            this.lastFlightPlanVersion = newFlightPlanVersion;

            this.generateNewGeometry();
        }

        if (this.geometryRecomputationTimer > GEOMETRY_RECOMPUTATION_TIMER) {
            this.geometryRecomputationTimer = 0;

            const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');

            if (this.currentActiveLegPathGeometry) {
                this.currentActiveLegPathGeometry.recomputeWithParameters(tas, this.activeLegIndex);
            }

            if (this.currentMultipleLegGeometry) {
                this.currentMultipleLegGeometry.recomputeWithParameters(tas, this.activeLegIndex);

                this.vnavDriver.acceptMultipleLegGeometry(this.currentMultipleLegGeometry);
                this.pseudoWaypoints.acceptMultipleLegGeometry(this.currentMultipleLegGeometry);
            }
        }

        this.lnavDriver.update(deltaTime);
        this.vnavDriver.update(deltaTime);
        this.pseudoWaypoints.update(deltaTime);
    }

    /**
     * Called when the lateral flight plan is changed
     */
    generateNewGeometry() {
        this.currentActiveLegPathGeometry = this.guidanceManager.getActiveLegPathGeometry();
        this.currentMultipleLegGeometry = this.guidanceManager.getMultipleLegGeometry();

        // Avoid dual updates if geometry was gonna be recomputed soon
        if (this.geometryRecomputationTimer > GEOMETRY_RECOMPUTATION_TIMER - 1_000) {
            this.geometryRecomputationTimer = 0;
            this.vnavDriver.acceptMultipleLegGeometry(this.currentMultipleLegGeometry);
            this.pseudoWaypoints.acceptMultipleLegGeometry(this.currentMultipleLegGeometry);
        }
    }

    /**
     * Notifies the FMS that a pseudo waypoint must be sequenced.
     *
     * This is to be sued by {@link LnavDriver} only.
     *
     * @param pseudoWaypoint the {@link PseudoWaypoint} to sequence.
     */
    public sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
        this.pseudoWaypoints.sequencePseudoWaypoint(pseudoWaypoint);
    }
}
