import { FlightPlanManager } from '@fmgc/wtsdk';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { ApproachPathAngleConstraint, DescentAltitudeConstraint, MaxAltitudeConstraint, MaxSpeedConstraint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { Geometry } from '@fmgc/guidance/Geometry';
import { AltitudeConstraintType, SpeedConstraintType } from '@fmgc/guidance/lnav/legs';
import { FlightPlans, WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { AltitudeDescriptor } from '@fmgc/types/fstypes/FSEnums';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';

export class ConstraintReader {
    public climbAlitudeConstraints: MaxAltitudeConstraint[] = [];

    public descentAltitudeConstraints: DescentAltitudeConstraint[] = [];

    public climbSpeedConstraints: MaxSpeedConstraint[] = [];

    public descentSpeedConstraints: MaxSpeedConstraint[] = [];

    public flightPathAngleConstraints: ApproachPathAngleConstraint[] = []

    public totalFlightPlanDistance = 0;

    public distanceToPresentPosition = 0;

    constructor(private flightPlanManager: FlightPlanManager) {
        this.reset();
    }

    extract(geometry: Geometry, activeLegIndex: number, activeTransIndex: number, ppos: LatLongAlt) {
        this.reset();

        // We use these to keep track of constraints that have already been passed, yet should still be taken into account
        let maxDescentSpeed = Infinity;
        let maxDescentAltitude = Infinity;

        for (let i = 0; i < this.flightPlanManager.getWaypointsCount(FlightPlans.Active); i++) {
            const leg = geometry.legs.get(i);
            this.updateDistanceFromStart(i, geometry, activeLegIndex, activeTransIndex, ppos);

            const waypoint = this.flightPlanManager.getWaypoint(i, FlightPlans.Active);

            // Here, we accumulate all the speed and altitude constraints behind the aircraft on waypoints that have already been sequenced.
            if (i < activeLegIndex - 1) {
                if (waypoint.additionalData.constraintType === WaypointConstraintType.DES /* DES */) {
                    if (waypoint.speedConstraint > 100) {
                        maxDescentSpeed = Math.min(maxDescentSpeed, waypoint.speedConstraint);
                    }

                    switch (waypoint.legAltitudeDescription) {
                    case AltitudeDescriptor.At:
                    case AltitudeDescriptor.AtOrBelow:
                    case AltitudeDescriptor.Between:
                        maxDescentAltitude = Math.min(maxDescentAltitude, Math.round(waypoint.legAltitude1));
                        break;
                    default:
                        // not constraining
                    }
                }

                continue;
            // Once we reach the first waypoint that's still in the flight plan, we set the most constraining of the speed-/alt constraints on this waypoint.
            } else if (i === activeLegIndex - 1) {
                if (maxDescentSpeed < Infinity) {
                    this.descentSpeedConstraints.push({
                        distanceFromStart: 0,
                        maxSpeed: maxDescentSpeed,
                    });
                }

                if (maxDescentAltitude < Infinity) {
                    this.descentAltitudeConstraints.push({
                        distanceFromStart: 0,
                        constraint: {
                            type: AltitudeConstraintType.atOrBelow,
                            altitude1: maxDescentAltitude,
                            altitude2: undefined,
                        },
                    });
                }
            }

            // I think this is only hit for manual discontinuities
            if (!leg) {
                continue;
            }

            if (waypoint.additionalData.constraintType === WaypointConstraintType.CLB) {
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
            } else if (waypoint.additionalData.constraintType === WaypointConstraintType.DES) {
                if (this.hasValidDescentAltitudeConstraint(leg)) {
                    this.descentAltitudeConstraints.push({
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

                if (this.hasValidPathAngleConstraint(leg)) {
                    this.flightPathAngleConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance,
                        pathAngle: leg.metadata.pathAngleConstraint,
                    });
                }
            }
        }

        if (VnavConfig.DEBUG_PROFILE) {
            console.log(`[FMS/VNAV] Total distance: ${this.totalFlightPlanDistance}`);
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
    }

    resetSpeedConstraints() {
        this.climbSpeedConstraints = [];
        this.descentSpeedConstraints = [];
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

    private updateDistanceFromStart(index: number, geometry: Geometry, activeLegIndex: number, activeTransIndex: number, ppos: LatLongAlt) {
        const { legs, transitions } = geometry;

        const leg = legs.get(index);
        const waypoint = this.flightPlanManager.getWaypoint(index, FlightPlans.Active);
        const nextWaypoint = this.flightPlanManager.getWaypoint(index + 1, FlightPlans.Active);

        if (!leg || leg.isNull) {
            return;
        }

        const inboundTransition = transitions.get(index - 1);
        const outboundTransition = transitions.get(index);

        const [inboundLength, legDistance, outboundLength] = Geometry.completeLegPathLengths(
            leg, (inboundTransition?.isNull || !inboundTransition?.isComputed) ? null : inboundTransition, outboundTransition,
        );

        const correctedInboundLength = Number.isNaN(inboundLength) ? 0 : inboundLength;
        const totalLegLength = legDistance + correctedInboundLength + outboundLength;

        this.totalFlightPlanDistance += totalLegLength;

        if (waypoint.endsInDiscontinuity) {
            const startingPointOfDisco = waypoint.discontinuityCanBeCleared
                ? waypoint
                : this.flightPlanManager.getWaypoint(index - 1, FlightPlans.Active); // MANUAL

            this.totalFlightPlanDistance += Avionics.Utils.computeGreatCircleDistance(startingPointOfDisco.infos.coordinates, nextWaypoint.infos.coordinates);
        }

        if (index < activeLegIndex) {
            this.distanceToPresentPosition += totalLegLength;
        } else if (index === activeLegIndex) {
            if (activeTransIndex < 0) {
                const distanceToGo = leg instanceof VMLeg
                    ? Avionics.Utils.computeGreatCircleDistance(ppos, nextWaypoint.infos.coordinates)
                    : leg.getDistanceToGo(ppos);

                // On a leg, not on any guided transition
                this.distanceToPresentPosition += legDistance + correctedInboundLength - distanceToGo;
            } else if (activeTransIndex === activeLegIndex) {
                // On an outbound transition
                this.distanceToPresentPosition += legDistance + correctedInboundLength - outboundTransition.getDistanceToGo(ppos) - outboundLength;
            } else if (activeTransIndex === activeLegIndex - 1) {
                // On an inbound transition
                this.distanceToPresentPosition += correctedInboundLength - inboundTransition.getDistanceToGo(ppos);
            } else {
                console.error(`[FMS/VNAV] Unexpected transition index (legIndex: ${activeLegIndex}, transIndex: ${activeTransIndex})`);
            }
        }
    }
}
