// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { PseudoWaypoint } from '@fmgc/guidance/PsuedoWaypoint';
import { PseudoWaypoints } from '@fmgc/guidance/lnav/PseudoWaypoints';
import { EfisVectors } from '@fmgc/efis/EfisVectors';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { EfisState } from '@fmgc/guidance/FmsState';
import { EfisSide, Mode, rangeSettings } from '@shared/NavigationDisplay';
import { TaskCategory, TaskQueue } from '@fmgc/guidance/TaskQueue';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { GeometryFactory } from '@fmgc/guidance/geometry/GeometryFactory';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { SimVarString } from '@shared/simvar';
import { getFlightPhaseManager } from '@fmgc/flightphase';
import { FmgcFlightPhase } from '@shared/flightphase';
import { ApproachType } from 'msfs-navdata';
import { NavigationDatabase } from '@fmgc/NavigationDatabase';
import { LnavDriver } from './lnav/LnavDriver';
import { FlightPlanManager } from '../flightplanning/FlightPlanManager';
import { VnavDriver } from './vnav/VnavDriver';

// How often the (milliseconds)
const GEOMETRY_RECOMPUTATION_TIMER = 5_000;

export class GuidanceController {
    lnavDriver: LnavDriver;

    vnavDriver: VnavDriver;

    pseudoWaypoints: PseudoWaypoints;

    efisVectors: EfisVectors;

    activeGeometry: Geometry | null;

    temporaryGeometry: Geometry | null;

    secondaryGeometry: Geometry | null;

    activeLegIndex: number;

    temporaryLegIndex: number = -1;

    activeTransIndex: number;

    activeLegDtg: NauticalMiles;

    activeLegCompleteLegPathDtg: NauticalMiles;

    displayActiveLegCompleteLegPathDtg: NauticalMiles;

    focusedWaypointCoordinates: Coordinates = { lat: 0, long: 0 };

    currentPseudoWaypoints: PseudoWaypoint[] = [];

    automaticSequencing: boolean = true;

    leftEfisState: EfisState;

    rightEfisState: EfisState;

    efisStateForSide: { L: EfisState, R: EfisState };

    private approachMessage: string = '';

    taskQueue = new TaskQueue();

    viewListener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

    get hasTemporaryFlightPlan() {
        return FlightPlanService.hasTemporary;
    }

    private updateEfisState(side: EfisSide, state: EfisState): void {
        const ndMode = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_MODE`, 'Enum') as Mode;
        const ndRange = rangeSettings[SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_RANGE`, 'Enum')];

        if (state?.mode !== ndMode || state?.range !== ndRange) {
            this.taskQueue.cancelAllInCategory(TaskCategory.EfisVectors);
            this.efisVectors.forceUpdate();
        }

        state.mode = ndMode;
        state.range = ndRange;

        this.updateEfisApproachMessage();
    }

    private lastFocusedWpIndex = -1;

    // FIXME only considers the case where F-PLN is shown on the MCDU
    private updateMrpState() {
        if (!FlightPlanService.hasActive) {
            return; // TODO secondary
        }

        // PLAN mode center

        const focusedWpIndex = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT', 'number');

        // FIXME plans other than active primary
        if (!FlightPlanService.active.hasElement(focusedWpIndex)) {
            return;
        }

        const matchingLeg = FlightPlanService.active.elementAt(focusedWpIndex);

        if (!matchingLeg || matchingLeg.isDiscontinuity === true || !matchingLeg.isXF()) {
            return;
        }

        // FIXME HAX
        const matchingGeometryLeg = Array.from(this.activeGeometry.legs.values()).find((leg) => leg.ident === matchingLeg.ident);

        if (!matchingGeometryLeg) {
            // throw new Error('[FMS/MRP] Could not find matching geometry leg');
            SimVar.SetSimVarValue('L:A32NX_SELECTED_WAYPOINT_LAT', 'Degrees', SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'));
            SimVar.SetSimVarValue('L:A32NX_SELECTED_WAYPOINT_LONG', 'Degrees', SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'));
            return;
        }

        if (this.lastFocusedWpIndex !== focusedWpIndex) {
            this.lastFocusedWpIndex = focusedWpIndex;

            this.efisVectors.forceUpdate();
        }

        let termination: Coordinates;
        if ('lat' in matchingGeometryLeg.terminationWaypoint) {
            termination = matchingGeometryLeg.terminationWaypoint;
        } else {
            termination = matchingGeometryLeg.terminationWaypoint.location;
        }

        this.focusedWaypointCoordinates.lat = termination.lat;
        this.focusedWaypointCoordinates.long = termination.long;

        SimVar.SetSimVarValue('L:A32NX_SELECTED_WAYPOINT_LAT', 'Degrees', this.focusedWaypointCoordinates.lat);
        SimVar.SetSimVarValue('L:A32NX_SELECTED_WAYPOINT_LONG', 'Degrees', this.focusedWaypointCoordinates.long);
    }

    private updateMapPartlyDisplayed() {
        if (this.efisStateForSide.L.dataLimitReached || this.efisStateForSide.L.legsCulled) {
            SimVar.SetSimVarValue('L:A32NX_EFIS_L_MAP_PARTLY_DISPLAYED', 'boolean', true);
        } else {
            SimVar.SetSimVarValue('L:A32NX_EFIS_L_MAP_PARTLY_DISPLAYED', 'boolean', false);
        }

        if (this.efisStateForSide.R.dataLimitReached || this.efisStateForSide.R.legsCulled) {
            SimVar.SetSimVarValue('L:A32NX_EFIS_R_MAP_PARTLY_DISPLAYED', 'boolean', true);
        } else {
            SimVar.SetSimVarValue('L:A32NX_EFIS_R_MAP_PARTLY_DISPLAYED', 'boolean', false);
        }
    }

    private updateEfisIdent() {
        // Update EFIS ident

        const efisIdent = this.activeGeometry.legs.get(this.activeLegIndex)?.ident ?? 'PPOS';

        const efisVars = SimVarString.pack(efisIdent, 9);
        // setting the simvar as a number greater than about 16 million causes precision error > 1... but this works..
        SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_IDENT_0', 'string', efisVars[0].toString());
        SimVar.SetSimVarValue('L:A32NX_EFIS_L_TO_WPT_IDENT_1', 'string', efisVars[1].toString());
        SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_IDENT_0', 'string', efisVars[0].toString());
        SimVar.SetSimVarValue('L:A32NX_EFIS_R_TO_WPT_IDENT_1', 'string', efisVars[1].toString());
    }

    private updateEfisApproachMessage() {
        let apprMsg = '';
        // const appr = this.flightPlanManager.getApproach(FlightPlans.Active);
        const appr = FlightPlanService.active.approach;
        if (appr && appr.type !== ApproachType.Unknown) {
            const phase = getFlightPhaseManager().phase;
            if (phase > FmgcFlightPhase.Cruise || (phase === FmgcFlightPhase.Cruise /* && this.flightPlanManager.getDistanceToDestination(FlightPlans.Active) < 250) */)) {
                apprMsg = NavigationDatabase.formatLongApproachIdent(appr);
            }
        }

        if (apprMsg !== this.approachMessage) {
            this.approachMessage = apprMsg;
            const apprMsgVars = SimVarString.pack(apprMsg, 9);
            // setting the simvar as a number greater than about 16 million causes precision error > 1... but this works..
            SimVar.SetSimVarValue('L:A32NX_EFIS_L_APPR_MSG_0', 'string', apprMsgVars[0].toString());
            SimVar.SetSimVarValue('L:A32NX_EFIS_L_APPR_MSG_1', 'string', apprMsgVars[1].toString());
            SimVar.SetSimVarValue('L:A32NX_EFIS_R_APPR_MSG_0', 'string', apprMsgVars[0].toString());
            SimVar.SetSimVarValue('L:A32NX_EFIS_R_APPR_MSG_1', 'string', apprMsgVars[1].toString());
        }
    }

    constructor() {
        this.lnavDriver = new LnavDriver(this);
        this.vnavDriver = new VnavDriver(this);
        this.pseudoWaypoints = new PseudoWaypoints(this);
        this.efisVectors = new EfisVectors(this);
    }

    init() {
        console.log('[FMGC/Guidance] GuidanceController initialized!');

        this.lnavDriver.ppos.lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        this.lnavDriver.ppos.long = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');

        this.activeLegIndex = FlightPlanService.activeOrTemporary.activeLegIndex;

        this.updateGeometries();

        this.leftEfisState = { mode: Mode.ARC, range: 10, dataLimitReached: false, legsCulled: false };
        this.rightEfisState = { mode: Mode.ARC, range: 10, dataLimitReached: false, legsCulled: false };
        this.efisStateForSide = {
            L: this.leftEfisState,
            R: this.rightEfisState,
        };

        this.updateEfisState('L', this.leftEfisState);
        this.updateEfisState('R', this.rightEfisState);

        this.efisStateForSide.L = this.leftEfisState;
        this.efisStateForSide.R = this.leftEfisState;

        this.lnavDriver.init();
        this.vnavDriver.init();
        this.pseudoWaypoints.init();

        Coherent.on('A32NX_IMM_EXIT', (fpIndex, immExit) => {
            const leg = this.activeGeometry.legs.get(fpIndex);
            const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
            if (leg instanceof HMLeg) {
                leg.setImmediateExit(immExit, this.lnavDriver.ppos, tas);
                FlightPlanService.active.incrementVersion();
                this.automaticSequencing = true;
            }
        }, undefined);
    }

    private lastFlightPlanVersion = SimVar.GetSimVarValue(FlightPlanManager.FlightPlanVersionKey, 'number');

    private geometryRecomputationTimer = GEOMETRY_RECOMPUTATION_TIMER + 1;

    update(deltaTime: number) {
        this.geometryRecomputationTimer += deltaTime;

        this.activeLegIndex = FlightPlanService.activeOrTemporary.activeLegIndex;

        this.updateEfisState('L', this.leftEfisState);
        this.updateEfisState('R', this.rightEfisState);

        try {
            // Generate new geometry when flight plan changes
            // const newFlightPlanVersion = FlightPlanService.activeOrTemporary.version;
            // if (newFlightPlanVersion !== this.lastFlightPlanVersion) {
            //     this.lastFlightPlanVersion = newFlightPlanVersion;
            //
            //     this.updateGeometries();
            //     this.geometryRecomputationTimer = 0;
            // }

            if (this.geometryRecomputationTimer > GEOMETRY_RECOMPUTATION_TIMER) {
                this.geometryRecomputationTimer = 0;

                this.updateGeometries();
                // this.recomputeGeometries();
                //
                // if (this.activeGeometry) {
                //     this.vnavDriver.acceptMultipleLegGeometry(this.activeGeometry);
                //     this.pseudoWaypoints.acceptMultipleLegGeometry(this.activeGeometry);
                // }
            }
        } catch (e) {
            console.error('[FMS] Error during LNAV update. See exception below.');
            console.error(e);
        }

        try {
            this.updateMrpState();
        } catch (e) {
            console.error('[FMS] Error during map state computation. See exception below.');
            console.error(e);
        }

        try {
            this.updateMapPartlyDisplayed();
        } catch (e) {
            console.error('[FMS] Error during map partly displayed computation. See exception below.');
            console.error(e);
        }

        try {
            this.lnavDriver.update(deltaTime);
        } catch (e) {
            console.error('[FMS] Error during LNAV driver update. See exception below.');
            console.error(e);
        }

        try {
            this.vnavDriver.update(deltaTime);
        } catch (e) {
            console.error('[FMS] Error during VNAV driver update. See exception below.');
            console.error(e);
        }

        try {
            this.pseudoWaypoints.update(deltaTime);
        } catch (e) {
            console.error('[FMS] Error during pseudo waypoints update. See exception below.');
            console.error(e);
        }

        try {
            this.efisVectors.update(deltaTime);
        } catch (e) {
            console.error('[FMS] Error during EFIS vectors update. See exception below.');
            console.error(e);
        }

        try {
            this.taskQueue.update(deltaTime);
        } catch (e) {
            console.error('[FMS] Error during task queue update. See exception below.');
            console.error(e);
        }
    }

    /**
     * Called when the lateral flight plan is changed
     */
    updateGeometries() {
        if (FlightPlanService.has(FlightPlanIndex.Active)) {
            this.updateActiveGeometry();
        }

        if (FlightPlanService.hasTemporary) {
            this.updateTemporaryGeometry();
        } else {
            this.temporaryGeometry = null;
        }

        if (FlightPlanService.has(FlightPlanIndex.FirstSecondary)) {
            this.updateSecondaryGeometry();
        } else {
            this.secondaryGeometry = null;
        }

        this.recomputeGeometries();

        this.updateEfisIdent();

        this.geometryRecomputationTimer = 0;
        this.vnavDriver.acceptMultipleLegGeometry(this.activeGeometry);
        this.pseudoWaypoints.acceptMultipleLegGeometry(this.activeGeometry);
    }

    private updateActiveGeometry() {
        if (this.activeGeometry) {
            GeometryFactory.updateFromFlightPlan(this.activeGeometry, FlightPlanService.active);
        } else {
            this.activeGeometry = GeometryFactory.createFromFlightPlan(FlightPlanService.active);
        }
    }

    private updateTemporaryGeometry() {
        if (this.temporaryGeometry) {
            GeometryFactory.updateFromFlightPlan(this.temporaryGeometry, FlightPlanService.temporary);
        } else {
            this.temporaryGeometry = GeometryFactory.createFromFlightPlan(FlightPlanService.temporary);
        }
    }

    private updateSecondaryGeometry() {
        if (this.secondaryGeometry) {
            GeometryFactory.updateFromFlightPlan(this.secondaryGeometry, FlightPlanService.secondary(1), false);
        } else {
            this.secondaryGeometry = GeometryFactory.createFromFlightPlan(FlightPlanService.secondary(1), false);
        }
    }

    recomputeGeometries() {
        const tas = SimVar.GetSimVarValue('AIRSPEED TRUE', 'Knots');
        const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'Knots');
        const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

        if (this.activeGeometry) {
            this.activeGeometry.recomputeWithParameters(
                tas,
                gs,
                this.lnavDriver.ppos,
                trueTrack,
                this.activeLegIndex,
                this.activeTransIndex,
            );
        }

        if (this.temporaryGeometry) {
            this.temporaryGeometry.recomputeWithParameters(
                tas,
                gs,
                this.lnavDriver.ppos,
                trueTrack,
                this.temporaryLegIndex,
                this.temporaryLegIndex - 1,
            );
        }

        if (this.secondaryGeometry) {
            this.secondaryGeometry.recomputeWithParameters(
                tas,
                gs,
                this.lnavDriver.ppos,
                trueTrack,
                this.activeLegIndex,
                this.activeTransIndex,
            );
        }

        if (this.secondaryGeometry) {
            this.secondaryGeometry.recomputeWithParameters(
                tas,
                gs,
                this.lnavDriver.ppos,
                trueTrack,
                this.activeLegIndex,
                this.activeTransIndex,
            );
        }
    }

    /**
     * Notifies the FMS that a pseudo waypoint must be sequenced.
     *
     * This is to be sued by {@link LnavDriver} only.
     *
     * @param pseudoWaypoint the {@link PseudoWaypoint} to sequence.
     */
    sequencePseudoWaypoint(pseudoWaypoint: PseudoWaypoint): void {
        this.pseudoWaypoints.sequencePseudoWaypoint(pseudoWaypoint);
    }

    isManualHoldActive(): boolean {
        if (this.activeGeometry) {
            const activeLeg = this.activeGeometry.legs.get(this.activeLegIndex);
            return activeLeg instanceof HMLeg;
        }
        return false;
    }

    isManualHoldNext(): boolean {
        if (this.activeGeometry) {
            const nextLeg = this.activeGeometry.legs.get(this.activeLegIndex + 1);
            return nextLeg instanceof HMLeg;
        }
        return false;
    }

    setHoldSpeed(tas: Knots) {
        let holdLeg: HMLeg;
        if (this.isManualHoldActive()) {
            holdLeg = this.activeGeometry.legs.get(this.activeLegIndex) as unknown as HMLeg;
        } else if (this.isManualHoldNext()) {
            holdLeg = this.activeGeometry.legs.get(this.activeLegIndex + 1) as unknown as HMLeg;
        }

        if (holdLeg) {
            holdLeg.setPredictedTas(tas);
        }
    }
}
