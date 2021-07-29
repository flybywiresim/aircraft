/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// Auto-added?
import { WayPoint } from '@fmgc/types/fstypes/FSTypes';

import { LateralMode, VerticalMode } from '@shared/autopilot';
import { ManagedFlightPlan } from '@fmgc/flightplanning/ManagedFlightPlan';
import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { GuidanceComponent } from '../GuidanceComponent';
import { Leg, TFLeg } from '../Geometry';
import { GuidanceController } from '../GuidanceController';

// Local imports
import { FlapConf } from './common';
import { EngineModel } from './EngineModel';
import { FlightModel } from './FlightModel';

export class VnavDriver implements GuidanceComponent {
    private guidanceController: GuidanceController;

    public fpm: FlightPlanManager;

    public activeWaypoint: WayPoint;

    public verticalFlightPlan: VerticalWaypoint[];

    public verticalFlightPlanSegments: VerticalSegment[];

    public firstPossibleDescentWaypointIndex: number;

    public lastClimbWaypointIndex: number;

    public firstPathSegmentIndex: number;

    public pathExists: boolean;

    public activeConstraint: Constraint;

    public atConstraints: AtConstraint[];

    public firstDescentConstraintIndex: number;

    private fpChecksum: number;

    constructor(guidanceController: GuidanceController, fpm: FlightPlanManager) {
        this.guidanceController = guidanceController;
        this.fpm = fpm;

        this.activeWaypoint = undefined;
        this.verticalFlightPlan = [];
        this.verticalFlightPlanSegments = [];

        this.firstPossibleDescentWaypointIndex = 0;
        this.lastClimbWaypointIndex = 0;

        // The index of the first path segment (path segments run in reverse order to 0,
        // so the first one is the highest number).
        this.firstPathSegmentIndex = 0;

        // Whether or not a descent path has been calculated/exists
        this.pathExists = false;

        // The next constraint
        this.activeConstraint = undefined;

        // The at constraints in the current plan for segment building.
        this.atConstraints = [];

        // The flight plan index of the waypoint with the first descent constraint
        this.firstDescentConstraintIndex = undefined;

        // The checksum to compare against the flight plan.
        this.fpChecksum = -1;
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

    init(): void {
        console.log('[FMGC/Guidance] VnavDriver initialized!');
    }

    update(_deltaTime: number): void {
        // TODO: Write code for following operations:

        // Update active lateral waypoint
        // Get vertical segment from active waypoint

        // Check if conditions for VNAV to update/run are valid
        // If VNAV can be run:
        // - Update current position and distance from active waypoint
        // - If flight plan is changed:
        //      - Re-build vertical flight plan
        // - Manage constraints
        // - Calculate ToD
        //      - ToD present if we haven't descended to first
    }

    calculateTopOfClimb(): void {
        // Calculated in TAKE-OFF or CLIMB phase
        // Targets the lowest altitude of either a waypoint constraint, FCU altitude, or cruise level
    }

    calculateTopOfDescent(): void {

    }

    buildVerticalFlightPlan(): void {
        // TODO: IDLE SEGMENT

        const waypointCount = this.allWaypoints.length;

        this.verticalFlightPlan = [];
        this.atConstraints = [];
        this.activeConstraint = undefined;
        this.firstDescentConstraintIndex = undefined;

        let lastClimbWaypointIndex = 0;
        let firstPossibleDescentWaypointIndex = 0;
        let firstApproachWaypointIndex = this.getFirstApproachWaypointIndex();
        let lastApproachWaypointIndex = this.getLastApproachWaypointIndex();

        for (let i = 0; i < waypointCount; i++) {
            const segmentType = this.fpm.getSegmentFromWaypoint(this.allWaypoints[i]).type;
            const isClimb = !!((segmentType === SegmentType.Departure || segmentType === SegmentType.Missed));
            const constraints = this.parseConstraints(this.allWaypoints[i]);
            const VWP = new VerticalWaypoint(i, this.allWaypoints[i].ident, isClimb);

            VWP.legDistanceTo = i > 0 ? this.allWaypoints[i].cumulativeDistanceInFP - this.allWaypoints[i - 1].cumulativeDistanceInFP : 0;
            VWP.upperConstraintAltitude = constraints.upperConstraint;
            VWP.lowerConstraintAltitude = constraints.lowerConstraint;
            VWP.isAtConstraint = constraints.isAtConstraint;
            VWP.hasConstraint = constraints.hasConstraint;

            // Check if current waypoint is the first descent constraint waypoint
            // If it is, then set the appropriate variable's index to current index
            if (this.firstDescentConstraintIndex === undefined && !isClimb && constraints.hasConstraint) {
                this.firstDescentConstraintIndex = i;
            }

            // If current waypoint is part of approach, turn into "AT" constraint
            if (firstApproachWaypointIndex !== undefined && i >= firstApproachWaypointIndex && VWP.lowerConstraintAltitude > 0) {
                VWP.upperConstraintAltitude = constraints.lowerConstraint;
                VWP.isAtConstraint = true;
                firstApproachWaypointIndex = undefined;
                // console.log("setting " + vwp.ident + " as first approach waypoint AT constraint " + constraints.lowerConstraint + "FT");
            }

            // Assign target altitude if "AT" constraint
            if (VWP.isAtConstraint || (VWP.hasConstraint && VWP.upperConstraintAltitude < Infinity)) {
                if (VWP.isAtConstraint) {
                    VWP.waypointFPTA = VWP.upperConstraintAltitude;
                }
                const atConstraint: AtConstraint = {
                    index: i,
                    altitude: VWP.upperConstraintAltitude,
                };
                // console.log("at constraint " + atConstraint.index + " " + vwp.ident);
                this.atConstraints.push(atConstraint);
            }

            // Add vertical waypoint to vertical flight plan and update some index variables
            this.verticalFlightPlan.push(VWP);
            lastClimbWaypointIndex = (isClimb && i < lastApproachWaypointIndex) ? i : lastClimbWaypointIndex;
            firstPossibleDescentWaypointIndex = (isClimb && VWP.hasConstraint && i < lastApproachWaypointIndex) ? i : firstPossibleDescentWaypointIndex;

            const segmentBuildStartIndex = Math.max(this.flightplan.activeWaypointIndex - 1, lastClimbWaypointIndex);

            // TODO: Build vertical segments
            this.verticalFlightPlanSegments = [];
            const nextSegmentEndIndex = undefined;
            let segmentIndex = 0;
            for (let j = lastApproachWaypointIndex; j > segmentBuildStartIndex; j--) {
                // console.log("j:" + j + ", " + this.verticalFlightPlan[j].ident + " segment:" + this.verticalFlightPlan[j].segment + " FPTA:" + this.verticalFlightPlan[j].waypointFPTA);
                if (!this.verticalFlightPlan[j].segment && this.verticalFlightPlan[j].waypointFPTA) {
                    this.verticalFlightPlanSegments.push(this.buildVerticalSegment(segmentIndex, j));
                    segmentIndex++;
                }
            }

            this.lastClimbWaypointIndex = lastClimbWaypointIndex;
            this.firstPossibleDescentWaypointIndex = firstPossibleDescentWaypointIndex;
            this.firstPathSegmentIndex = this.verticalFlightPlanSegments.length - 1;
            const isPath = !(segmentIndex === 0 && nextSegmentEndIndex === undefined);

            // TODO: VNAV STATE
        }
    }

    buildVerticalSegment(segmentIndex: number, j: number): VerticalSegment {
        // pass
    }

    /**
     * Placeholder
     * @param waypoint
     * @returns
     */
    parseConstraints(waypoint: WayPoint): Constraint {
        const constraints = {
            upperConstraint: Infinity,
            lowerConstraint: 0,
            isAtConstraint: false,
            hasConstraint: false,
        };
        switch (waypoint.legAltitudeDescription) {
        case 1:
            // AT constraint
            constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
            constraints.lowerConstraint = Math.floor(waypoint.legAltitude1);
            constraints.isAtConstraint = true;
            constraints.hasConstraint = true;
            break;
        case 2:
            // AT OR ABOVE constraint
            constraints.lowerConstraint = Math.floor(waypoint.legAltitude1);
            constraints.hasConstraint = true;
            break;
        case 3:
            // AT OR BELOW constraint
            constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
            constraints.hasConstraint = true;
            break;
        case 4:
            // Altitude range constraint
            constraints.lowerConstraint = Math.floor(waypoint.legAltitude2);
            constraints.upperConstraint = Math.floor(waypoint.legAltitude1);
            constraints.hasConstraint = true;
            break;
        case 5:
            // AT OR ABOVE constraint, using alt2
            constraints.lowerConstraint = Math.floor(waypoint.legAltitude2);
            constraints.hasConstraint = true;
            break;
        default:
            break;
        }
        return constraints;
    }

    /**
     * Placeholder
     * @returns
     */
    getFirstApproachWaypointIndex(): number {
        const approach = this.fpm.getApproachWaypoints();
        if (approach && approach.length > 0) {
            return this.allWaypoints.indexOf(approach[0]);
        }
        return undefined;
    }

    /**
     * Placeholder
     * @returns
     */
    getLastApproachWaypointIndex(): number {
        const approach = this.fpm.getApproachWaypoints();
        if (approach && approach.length > 0) {
            return this.allWaypoints.indexOf(approach[approach.length - 1]);
        }
        return undefined;
    }

    /**
     * Placeholder
     * @returns
     */
    getLandingRunwayElevation(): number | undefined {
        const approachRunway = this.fpm.getApproachRunway();
        if (approachRunway !== undefined) {
            return approachRunway.elevation;
        }

        // TODO: Get destination airport elevation as fallback
        // const destAirport = this.fpm.getDestination();

        return undefined;
    }

    /**
     * Placeholder
     * @returns
     */
    getGlidepathFPA(): number {
        const approach = this.fpm.getApproachWaypoints();
        if (approach.length > 0) {
            const lastApproachWaypoint = approach[approach.length - 1];
            if (lastApproachWaypoint.isRunway) {
                let fafAltitude = undefined;
                let fafDistance = undefined;
                for (let i = approach.length - 2; i >= 0; i--) {
                    const waypoint = approach[i];
                    const distance = lastApproachWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                    // Check if meets FAF conditions
                    if (waypoint.legAltitudeDescription > 0 && waypoint.legAltitudeDescription < 3 && waypoint.legAltitude1 > 0 && distance > 3) {
                        fafAltitude = waypoint.legAltitude1;
                        fafDistance = lastApproachWaypoint.cumulativeDistanceInFP - waypoint.cumulativeDistanceInFP;
                        break;
                    }
                }
                const altitudeDifference = fafAltitude - lastApproachWaypoint.legAltitude1;
                return VnavDriver.calculateFPA(altitudeDifference, fafDistance);
            }
        }
        return undefined;
    }

    /**
     * Placeholder
     * @param verticalDistance
     * @param lateralDistance
     * @returns FPA
     */
    static calculateFPA(verticalDistance: number, lateralDistance: number): number {
        return (180 / Math.PI) * (Math.atan(Math.abs(verticalDistance) / (lateralDistance * 6076.12)));
    }
}

class VerticalWaypoint {
    public indexInFlightPlan: number;

    public ident: string;

    public waypointFPA: number;

    public waypointFPTA: number;

    public upperConstraintAltitude: number;

    public lowerConstraintAltitude: number;

    public upperConstraintFPA: number;

    public lowerConstraintFPA: number;

    public legDistanceTo: number;

    public isClimb: boolean;

    public isAtConstraint: boolean;

    public hasConstraint: boolean;

    public segment: VerticalSegment;

    constructor(index = undefined, ident = undefined, isClimb = false) {
        // The waypoint's index in the lateral flight plan
        this.indexInFlightPlan = index;

        // The ident of the vertical waypoint.
        this.ident = ident;

        // The calculated flight path angle TO the waypoint.
        this.waypointFPA = undefined;

        // The calculated flight plan target altitude for the waypoint.
        this.waypointFPTA = undefined;

        // The highest altitude allowed at this vertical wapyoint.
        this.upperConstraintAltitude = undefined;

        // The lowest altitude allowed at this vertical wapyoint.
        this.lowerConstraintAltitude = undefined;

        // The FPA from the upper constraint altitude to the next fixed vnav target.
        this.upperConstraintFPA = undefined;

        // The FPA from the lower constraint altitude to the next fixed vnav target.
        this.lowerConstraintFPA = undefined;

        // The leg distance from the prior waypoint to this waypoint.
        this.legDistanceTo = undefined;

        // Whether this waypoint is part of the climb or not.
        this.isClimb = isClimb;

        // Whether this waypoint is an AT constraint.
        this.isAtConstraint = false;

        // Whether this waypoint has a constraint.
        this.hasConstraint = false;

        // Which vertical path segment is this waypoint part of.
        this.segment = undefined;
    }
}

class VerticalSegment {
    // TODO: Add support for IDLE and repressurization segments

    public startIndex: number;

    public targetIndex: number;

    public fpa: number;

    public distanceToNextTod: number;

    public segmentStartsLevel: boolean;

    public segmentEndsLevel: boolean;

    constructor(startIndex = undefined, targetIndex = undefined, fpa = undefined, distanceToNextTod = 0, segmentStartsLevel = false, segmentEndsLevel = false) {
        // The first waypoint index of this segment.
        this.startIndex = startIndex;

        // The last waypoint index of this segment and the vertical target of this segment.
        this.targetIndex = targetIndex;

        // The segment flight path angle (fpa).
        this.fpa = fpa;

        // The distance from the end of this segment to the next TOD;
        // 0 if it is a continuous descent or at the end of the path.
        this.distanceToNextTod = distanceToNextTod;

        // If the segment starts flat/with a TOD.
        this.segmentStartsLevel = segmentStartsLevel;

        // If the segment ends flat/level.
        this.segmentEndsLevel = segmentEndsLevel;
    }
}

enum VnavState {
    NONE,
    REPRESSURIZATION,
    IDLE,
    GEOMETRIC
}

interface Constraint {
    upperConstraint: number;
    lowerConstraint: number;
    isAtConstraint: boolean;
    hasConstraint: boolean;
}

interface AtConstraint {
    index: number;
    altitude: number;
}
