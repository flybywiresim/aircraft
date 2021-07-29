import { WayPoint } from '@fmgc/types/fstypes/FSTypes';

import { LateralMode, VerticalMode } from '@shared/autopilot';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { FlightPlanManager, WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceComponent } from '../GuidanceComponent';
import { Leg, AltitudeConstraint, AltitudeConstraintType, SpeedConstraint, SpeedConstraintType } from '@fmgc/guidance/lnav/legs';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { GuidanceController } from '../GuidanceController';

import { Common, FlapConf, VerticalLeg, VerticalWaypointType } from './common';
import { EngineModel } from './EngineModel';
import { FlightModel } from './FlightModel';
import { Predictions } from './Predictions';
import { LatLongData } from '@typings/fs-base-ui/html_ui/JS/Types';
import { Transition } from '../lnav/transitions';
import { Type1Transition } from '../lnav/transitions/Type1';
import { Feet, Knots } from '@typings/types';

export class ClimbProfile implements GuidanceComponent {
    private guidanceController: GuidanceController;

    private fpm: FlightPlanManager;

    private activeWaypoint: WayPoint;

    private initialAltitude: number;

    private thrustReductionAltitude: number;

    private accelerationAltitude: number;

    private v2speed: number;

    private climbCAS: number;

    private climbMach: number;

    private zeroFuelWeight: number;

    private fuelWeight: number;

    private targetAltitude: number;

    private tropoAltitude: number;

    private isaDeviation: number;

    private fpChecksum: number;

    public distanceFromPposToSpdLim: number;

    public distanceFromPposToEarlyLeveloff: number;

    public distanceFromPposToStartOfClimb: number;

    public distanceFromPposToTopOfClimb: number;

    constructor(
        guidanceController: GuidanceController,
        fpm: FlightPlanManager,
        flightLevel: number,
        flightLevelTemp: number,
        tropoAltitude: number,
        zeroFuelWeight: number,
        fuelWeight: number,
        originWaypoint: WayPoint,
        thrustReductionAltitude: number,
        accelerationAltitude:number,
        v2speed: number,
        climbCAS: number,
        climbMach: number,
    ) {
        this.guidanceController = guidanceController;
        this.fpm = fpm;
        this.activeWaypoint = originWaypoint;

        // TODO: Field elevation -> initial altitude, especially if active runway hasn't been selected yet
        this.initialAltitude = undefined;
        this.thrustReductionAltitude = 1500;
        this.accelerationAltitude = 1500;
        this.v2speed = undefined;
        this.climbCAS = undefined;
        this.climbMach = undefined;
        this.zeroFuelWeight = undefined;
        this.fuelWeight = undefined;
        this.targetAltitude = undefined;
        this.tropoAltitude = undefined;
        this.isaDeviation = 0;

        // this.targetAltitude = flightLevel * 100;
        // this.tropoAltitude = tropoAltitude;
        // this.isaDeviation = Math.round(flightLevelTemp - Common.getIsaTemp(this.targetAltitude, this.targetAltitude > this.tropoAltitude));

        // this.zeroFuelWeight = zeroFuelWeight;
        // this.fuelWeight = fuelWeight;

        // this.climbCAS = climbCAS;
        // this.climbMach = climbMach;

        // this.v2speed = v2speed;
        // this.thrustReductionAltitude = thrustReductionAltitude;
        // this.accelerationAltitude = accelerationAltitude;

        // The checksum to compare against the flight plan.
        this.fpChecksum = -1;

        // Results
        this.distanceFromPposToSpdLim = undefined;
        this.distanceFromPposToEarlyLeveloff = undefined;
        this.distanceFromPposToStartOfClimb = undefined;
        this.distanceFromPposToTopOfClimb = undefined;
    }

    init(): void {
        // console.log('[FMGC/Guidance] ClimbProfile initialized!');
    }

    update(_deltaTime: number): void {
        // Get data
        // - "L:AIRLINER_V2_SPEED", "Knots"
        // - "L:AIRLINER_THR_RED_ALT", "Number"
        // - "L:AIRLINER_ACC_ALT", "Number"
        // - "L:AIRLINER_CRUISE_ALTITUDE", "number"
        // Needs simvars:
        // - ZFW
        // - Block fuel
        // - Cruise temperature
        // - Climb CAS
        // - Econ mach

        const geometry = this.guidanceController.guidanceManager.getMultipleLegGeometry();
        // const currentLeg = geometry.legs.get(1);

        // Check if conditions are met to start climb profile predictions

        // Update distance between PPOS and pseudo-waypoints (subtract delta distance from last frame)

        // Recompute if lateral/vertical revision or x number of seconds have passed since last recomputation
        // or if passing a constraint waypoint
        this.recompute(geometry.legs);
    }

    recompute(legs: Map<number, Leg>, transitions: Map<number, Transition>, climbN1: number, ppos: LatLongAlt):void {
        const forwardLegs = new Map([...legs].reverse());
        const altConstraintsToIgnore = new Set();
        let lastClbAltCeiling: Feet;
        let lastDesAltFloor: Feet;

        // Ignore conflicting altitude constraints
        for (const [i, leg] of forwardLegs.entries()) {
            if (leg.segment === SegmentType.Departure
                || leg.segment === SegmentType.Missed
                || (leg.segment === SegmentType.Enroute && leg instanceof TFLeg && leg.constraintType === WaypointConstraintType.CLB)) {
                if (leg.altitudeConstraint !== undefined) {
                    const currentCeiling = leg.altitudeConstraint.type === AltitudeConstraintType.range
                        ? Math.max(leg.altitudeConstraint.altitude1, leg.altitudeConstraint.altitude2)
                        : leg.altitudeConstraint.altitude1;
                    if (lastClbAltCeiling !== undefined && currentCeiling < lastClbAltCeiling) {
                        altConstraintsToIgnore.add(i);
                    } else {
                        lastClbAltCeiling = currentCeiling;
                    }
                }
            } else if (leg.segment === SegmentType.Arrival
                || leg.segment === SegmentType.Approach
                || (leg.segment === SegmentType.Enroute && leg instanceof TFLeg && leg.constraintType === WaypointConstraintType.DES)) {
                if (leg.altitudeConstraint !== undefined) {
                    const currentFloor = leg.altitudeConstraint.type === AltitudeConstraintType.range
                        ? Math.min(leg.altitudeConstraint.altitude1, leg.altitudeConstraint.altitude2)
                        : leg.altitudeConstraint.altitude1;
                    if (lastDesAltFloor !== undefined && currentFloor > lastDesAltFloor) {
                        altConstraintsToIgnore.add(i);
                    } else {
                        lastDesAltFloor = currentFloor;
                    }
                }
            }
        }

        const terminators = new Map();

        // Iterate backwards through legs to populate climb constraints
        let previousID: number;
        for (const [i, leg] of legs.entries()) {
            // Skip manual legs
            if (leg.terminatorLocation === undefined) {
                continue;
            }

            let VL: VerticalLeg;
            VL.distanceFromRef = 0;
            VL.altIgnored = false;
            VL.speedIgnored = false;

            let lastClbAltConstraint: AltitudeConstraint;
            let lastClbSpeedConstraint: SpeedConstraint;
            if (previousID !== undefined && (previousID - i) > 1) {
                // Predict discontinuity path as orthodromic between surrounding waypoints
                let discTerminator: LatLongData;
                if (legs.get(previousID).initialLocation !== undefined) {
                    discTerminator = legs.get(previousID).initialLocation;
                } else {
                    discTerminator = legs.get(previousID).terminatorLocation;
                }
                VL.length = Avionics.Utils.computeGreatCircleDistance(leg.terminatorLocation, discTerminator);
            } else {
                VL.length = leg.distance;

                if (leg.segment === SegmentType.Departure
                    || leg.segment === SegmentType.Missed
                    || (leg.segment === SegmentType.Enroute && leg instanceof TFLeg && leg.constraintType === WaypointConstraintType.CLB)) {
                    // Handle altitude constraints during climb
                    if (leg.altitudeConstraint !== undefined) {
                        // Apply constraint from current leg
                        VL.altConstraint = leg.altitudeConstraint;
                        VL.altConstraintDirectlyApplied = true;
                        lastClbAltConstraint = leg.altitudeConstraint;
                    } else if (lastClbAltConstraint !== undefined && lastClbAltConstraint.type !== AltitudeConstraintType.atOrAbove) {
                        // Propagate previous constraint backwards
                        const ceilingAlt = lastClbAltConstraint.type === AltitudeConstraintType.range
                            ? Math.max(leg.altitudeConstraint.altitude1, leg.altitudeConstraint.altitude2)
                            : leg.altitudeConstraint.altitude1;
                        VL.altConstraint = {
                            type: AltitudeConstraintType.atOrBelow,
                            altitude1: ceilingAlt,
                            altitude2: undefined,
                        };
                        VL.altConstraintDirectlyApplied = false;
                    }

                    // Handle speed constraints during climb
                    if (leg.speedConstraint !== undefined) {
                        // Apply constraint from current leg
                        VL.speedConstraint = leg.speedConstraint;
                        lastClbSpeedConstraint = leg.speedConstraint;
                        VL.speedConstraintDirectlyApplied = true;
                    } else if (lastClbSpeedConstraint !== undefined) {
                        // Propagate previous constraint backwards
                        VL.speedConstraint = lastClbSpeedConstraint;
                        VL.speedConstraint.type = SpeedConstraintType.atOrBelow;
                        VL.speedConstraintDirectlyApplied = false;
                    }
                    VL.constraintType = VerticalWaypointType.CLB;
                } else if (leg.segment === SegmentType.Arrival
                    || leg.segment === SegmentType.Approach
                    || (leg.segment === SegmentType.Enroute && leg instanceof TFLeg && leg.constraintType === WaypointConstraintType.DES)) {
                    // Descending constraints
                    VL.constraintType = VerticalWaypointType.DES;
                    if (leg.altitudeConstraint !== undefined) {
                        // Apply constraint from current leg
                        VL.altConstraint = leg.altitudeConstraint;
                        VL.speedConstraintDirectlyApplied = true;
                    }
                } else {
                    // Enroute constraints
                    VL.constraintType = VerticalWaypointType.CRZ;
                    if (leg.speedConstraint !== undefined) {
                        // Apply constraint from current leg
                        VL.speedConstraint = leg.speedConstraint;
                        VL.speedConstraintDirectlyApplied = true;
                    }
                }
            }

            terminators.set(i, VL);
        }

        let lastDesSpeedConstraint: SpeedConstraint;
        // Iterate forwards through legs to populate descent speed constraints
        // TODO: combine with first (forward) for loop above
        for (const [i, leg] of forwardLegs.entries()) {
            if (terminators.get(i).constraintType === VerticalWaypointType.DES) {
                // Descending constraints
                if (leg.speedConstraint !== undefined) {
                    // Apply constraint from current leg
                    terminators.get(i).speedConstraint = leg.speedConstraint;
                    lastDesSpeedConstraint = leg.speedConstraint;
                } else if (lastDesSpeedConstraint !== undefined) {
                    // Propagate previous constraint backwards
                    terminators.get(i).speedConstraint = lastDesSpeedConstraint;
                    terminators.get(i).speedConstraint.type = SpeedConstraintType.atOrBelow;
                }
            }
        }

        // Get field elevation
        // TODO: replace ppos.alt with airport field elevation once data available
        const departureElevation = this.fpm.getDepartureRunway() !== undefined ? this.fpm.getDepartureRunway().elevation : ppos.alt;

        // TODO: If below field elevation + accel altitude, perform necessary calculations to find distance from takeoff to accel altitude
        // TODO: specify start point (either mid-runway if runway selected, or origin airport lat/long)
        if (ppos.alt < departureElevation + this.accelerationAltitude) {
            const mInitialAltitude = Math.max(departureElevation, ppos.alt);
            const takeoffStepResult = Predictions.altitudeStep(
                mInitialAltitude,
                (departureElevation + this.accelerationAltitude) - mInitialAltitude,
                this.v2speed + 10,
                this.climbMach,
                climbN1,
                this.zeroFuelWeight,
                this.fuelWeight,
                0,
                this.isaDeviation,
                this.tropoAltitude,
            );
        }

        const firstStepSize = (Math.ceil((this.initialAltitude + 100) / 1000) * 1000) - this.initialAltitude;
        let finalStepAltitude;
        let finalStepSize;
        if (this.targetAltitude % 1000 === 0) {
            finalStepAltitude = this.targetAltitude - 1000;
            finalStepSize = 1000;
        } else {
            finalStepAltitude = (Math.floor((this.targetAltitude - 100) / 1000) * 1000);
            finalStepSize = this.targetAltitude - finalStepAltitude;
        }

        // First step
        const firstStepResult = Predictions.altitudeStep(
            this.initialAltitude,
            firstStepSize,
            this.climbCAS,
            this.climbMach,
            climbN1,
            this.zeroFuelWeight,
            this.fuelWeight,
            0,
            this.isaDeviation,
            this.tropoAltitude,
        );

        let predDistanceTraveled = firstStepResult.distanceTraveled;
        let predTimeElapsed = firstStepResult.timeElapsed;
        let predFuelWeight = this.fuelWeight - firstStepResult.fuelBurned;

        // Loop (ignoring constraints for now)
        // TODO: stop at each waypoint as well as SPD LIM, and record time elapsed and fuel weight
        for (let alt = this.initialAltitude + firstStepSize; alt < finalStepAltitude; alt += 1000) {
            const stepResult = Predictions.altitudeStep(
                alt,
                1000,
                this.climbCAS,
                this.climbMach,
                climbN1,
                this.zeroFuelWeight,
                predFuelWeight,
                0,
                this.isaDeviation,
                this.tropoAltitude,
            );
            predDistanceTraveled += stepResult.distanceTraveled;
            predTimeElapsed += stepResult.timeElapsed;
            predFuelWeight -= stepResult.fuelBurned;
        }

        const finalStepResult = Predictions.altitudeStep(
            finalStepAltitude,
            finalStepSize,
            this.climbCAS,
            this.climbMach,
            climbN1,
            this.zeroFuelWeight,
            predFuelWeight,
            0,
            this.isaDeviation,
            this.tropoAltitude,
        );
        predDistanceTraveled += finalStepResult.distanceTraveled;
        predTimeElapsed += finalStepResult.timeElapsed;
        predFuelWeight -= finalStepResult.fuelBurned;

        this.distanceFromPposToTopOfClimb = predDistanceTraveled;
    }

    /**
     * The active flight plan.
     * @type {ManagedFlightPlan}
     */
    get flightplan(): ManagedFlightPlan {
        return this.fpm.getFlightPlan(0);
    }

    get currentWaypoints(): WayPoint[] {
        return this.flightplan.waypoints.slice(this.flightplan.activeWaypointIndex);
    }

    get allWaypoints(): WayPoint[] {
        return this.flightplan.waypoints;
    }
}
