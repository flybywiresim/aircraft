import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { FlightPlanManager } from '@fmgc/wtsdk';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { ApproachPathAngleConstraint, DescentAltitudeConstraint, MaxAltitudeConstraint, MaxSpeedConstraint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { Geometry } from '@fmgc/guidance/Geometry';
import { AltitudeConstraintType, SpeedConstraintType } from '@fmgc/guidance/lnav/legs';

type UncategorizedAltitudeConstraint = DescentAltitudeConstraint;

type UncategorizedSpeedConstraint = MaxSpeedConstraint;

export class ConstraintReader {
    public climbAlitudeConstraints: MaxAltitudeConstraint[] = [];

    public descentAltitudeConstraints: DescentAltitudeConstraint[] = [];

    public approachAltitudeConstraints: DescentAltitudeConstraint[] = [];

    public climbSpeedConstraints: MaxSpeedConstraint[] = [];

    public descentSpeedConstraints: MaxSpeedConstraint[] = [];

    public approachSpeedConstraints: MaxSpeedConstraint[] = [];

    public flightPathAngleConstraints: ApproachPathAngleConstraint[] = []

    public totalFlightPlanDistance = 0;

    public distanceToPresentPosition = 0;

    constructor(private flightPlanManager: FlightPlanManager) {
        this.reset();
    }

    extract(geometry: Geometry, activeLegIndex: number) {
        this.reset();

        const { legs, transitions } = geometry;

        this.distanceToPresentPosition = -this.flightPlanManager.getDistanceToActiveWaypoint();

        const uncategorizedAltitudeConstraints: UncategorizedAltitudeConstraint[] = [];
        const uncategorizedSpeedConstraints: UncategorizedSpeedConstraint[] = [];

        for (let i = 0; i < this.flightPlanManager.getWaypointsCount(); i++) {
            const leg = legs.get(i);

            if (!leg) {
                continue;
            }

            const inboundTransition = transitions.get(i - 1);

            const legDistance = Geometry.completeLegPathLengths(
                leg, (inboundTransition?.isNull || !inboundTransition?.isComputed) ? null : inboundTransition, transitions.get(i),
            ).reduce((sum, el) => sum + (!Number.isNaN(el) ? el : 0), 0);
            this.totalFlightPlanDistance += legDistance;

            if (i <= activeLegIndex) {
                this.distanceToPresentPosition += legDistance;
            }

            if (leg.segment === SegmentType.Origin || leg.segment === SegmentType.Departure) {
                if (this.hasValidClimbAltitudeConstraint(leg)) {
                    this.climbAlitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        maxAltitude: leg.metadata.altitudeConstraint.altitude1,
                    });
                }

                if (this.hasValidClimbSpeedConstraint(leg)) {
                    this.climbSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        maxSpeed: leg.metadata.speedConstraint.speed,
                    });
                }
            } else if (leg.segment === SegmentType.Arrival) {
                if (this.hasValidDescentAltitudeConstraint(leg)) {
                    this.descentAltitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        constraint: leg.metadata.altitudeConstraint,
                    });

                    // We also put descent constraints here, because I noticed that some approaches have their constraints on arrival segments
                    this.approachAltitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        constraint: leg.metadata.altitudeConstraint,
                    });
                }

                if (this.hasValidDescentSpeedConstraint(leg)) {
                    this.descentSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        maxSpeed: leg.metadata.speedConstraint.speed,
                    });
                }
            } else if (leg.segment === SegmentType.Approach) {
                if (this.hasValidDescentAltitudeConstraint(leg)) {
                    this.approachAltitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        constraint: leg.metadata.altitudeConstraint,
                    });
                }

                if (this.hasValidDescentSpeedConstraint(leg)) {
                    this.approachSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        maxSpeed: leg.metadata.speedConstraint.speed,
                    });
                }

                if (this.hasValidPathAngleConstraint(leg)) {
                    this.flightPathAngleConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        pathAngle: leg.metadata.pathAngleConstraint,
                    });
                }
            } else if (leg.metadata.altitudeConstraint) {
                uncategorizedAltitudeConstraints.push({
                    distanceFromStart: this.totalFlightPlanDistance,
                    constraint: leg.metadata.altitudeConstraint,
                });
            } else if (this.hasValidSpeedConstraint(leg)) {
                uncategorizedSpeedConstraints.push({
                    distanceFromStart: this.totalFlightPlanDistance,
                    maxSpeed: leg.metadata.speedConstraint.speed,
                });
            }
        }

        for (const uncategorizedAltitudeConstraint of uncategorizedAltitudeConstraints) {
            if (uncategorizedAltitudeConstraint.distanceFromStart < this.totalFlightPlanDistance / 2) {
                this.climbAlitudeConstraints.push({
                    distanceFromStart: uncategorizedAltitudeConstraint.distanceFromStart,
                    maxAltitude: uncategorizedAltitudeConstraint.constraint.altitude1,
                });
            } else {
                this.descentAltitudeConstraints.push({
                    distanceFromStart: uncategorizedAltitudeConstraint.distanceFromStart,
                    constraint: uncategorizedAltitudeConstraint.constraint,
                });
            }
        }

        for (const uncategorizedSpeedConstraint of uncategorizedSpeedConstraints) {
            if (uncategorizedSpeedConstraint.distanceFromStart < this.totalFlightPlanDistance / 2) {
                this.climbSpeedConstraints.push(uncategorizedSpeedConstraint);
            } else {
                this.descentSpeedConstraints.push(uncategorizedSpeedConstraint);
            }
        }
    }

    private hasValidSpeedConstraint(leg: Leg): boolean {
        return leg.metadata.speedConstraint?.speed > 100 && leg.metadata.speedConstraint.type !== SpeedConstraintType.atOrAbove;
    }

    private hasValidClimbAltitudeConstraint(leg: Leg): boolean {
        return leg.metadata.altitudeConstraint && leg.metadata.altitudeConstraint.type !== AltitudeConstraintType.atOrAbove
            && (this.climbAlitudeConstraints.length < 1 || leg.metadata.altitudeConstraint.altitude1 >= this.climbAlitudeConstraints[this.climbAlitudeConstraints.length - 1].maxAltitude);
    }

    private hasValidClimbSpeedConstraint(leg: Leg): boolean {
        return this.hasValidSpeedConstraint(leg)
            && (this.climbSpeedConstraints.length < 1 || leg.metadata.speedConstraint.speed >= this.climbSpeedConstraints[this.climbSpeedConstraints.length - 1].maxSpeed);
    }

    private hasValidDescentAltitudeConstraint(leg: Leg): boolean {
        return !!leg.metadata.altitudeConstraint;
    }

    private hasValidDescentSpeedConstraint(leg: Leg): boolean {
        return this.hasValidSpeedConstraint(leg);
    }

    private hasValidPathAngleConstraint(leg: Leg) {
        // We don't use strict equality because we want to check for null and undefined but not 0, which is falsy in JS
        return leg.metadata.pathAngleConstraint != null;
    }

    resetAltitudeConstraints() {
        this.climbAlitudeConstraints = [];
        this.descentAltitudeConstraints = [];
        this.approachAltitudeConstraints = [];
    }

    resetSpeedConstraints() {
        this.climbSpeedConstraints = [];
        this.descentSpeedConstraints = [];
        this.approachSpeedConstraints = [];
    }

    resetPathAngleConstraints() {
        this.flightPathAngleConstraints = [];
    }

    reset() {
        this.resetAltitudeConstraints();
        this.resetSpeedConstraints();
        this.resetPathAngleConstraints();

        this.totalFlightPlanDistance = 0;
        this.distanceToPresentPosition = 0;
    }
}
