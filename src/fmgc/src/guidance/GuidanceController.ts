//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { PseudoWaypoint } from '@fmgc/guidance/PsuedoWaypoint';
import { PseudoWaypoints } from '@fmgc/guidance/lnav/PseudoWaypoints';
import { LnavDriver } from './lnav/LnavDriver';
import { FlightPlanManager } from '../flightplanning/FlightPlanManager';
import { GuidanceManager } from './GuidanceManager';
import { VnavDriver } from './vnav/VnavDriver';

export class GuidanceController {
    public flightPlanManager: FlightPlanManager;

    public guidanceManager: GuidanceManager;

    public lnavDriver: LnavDriver;

    public vnavDriver: VnavDriver;

    private pseudoWaypoints: PseudoWaypoints;

    public currentMultipleLegGeometry: Geometry;

    public activeLegIndex: number;

    public activeLegDtg: NauticalMiles;

    public currentPseudoWaypoints: PseudoWaypoint[] = [];

    constructor(flightPlanManager: FlightPlanManager, guidanceManager: GuidanceManager) {
        this.flightPlanManager = flightPlanManager;
        this.guidanceManager = guidanceManager;

        this.lnavDriver = new LnavDriver(this);
        this.vnavDriver = new VnavDriver();
        this.pseudoWaypoints = new PseudoWaypoints(this);
    }

    init() {
        console.log('[FMGC/Guidance] GuidanceController initialized!');

        this.lnavDriver.init();
        this.vnavDriver.init();
        this.pseudoWaypoints.init();

        this.currentMultipleLegGeometry = this.guidanceManager.getMultipleLegGeometry();
    }

    private geometryUpdateTimer = 0;

    update(deltaTime: number) {
        this.geometryUpdateTimer += deltaTime;

        // FIXME probably wanna do this on certain events, rather than on a timer:
        // - FP changes
        // - Predicted atmospheric conditions changes
        if (this.geometryUpdateTimer > 5_000) {
            this.geometryUpdateTimer = 0;

            this.currentMultipleLegGeometry = this.guidanceManager.getMultipleLegGeometry();

            this.lnavDriver.acceptNewMultipleLegGeometry(this.currentMultipleLegGeometry);
            this.vnavDriver.acceptNewMultipleLegGeometry(this.currentMultipleLegGeometry);
            this.pseudoWaypoints.acceptNewMultipleLegGeometry(this.currentMultipleLegGeometry);
        }

        this.lnavDriver.update(deltaTime);
        this.vnavDriver.update(deltaTime);
        this.pseudoWaypoints.update(deltaTime);
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
