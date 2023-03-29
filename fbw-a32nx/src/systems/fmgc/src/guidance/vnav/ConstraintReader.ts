import { GeographicCruiseStep, DescentAltitudeConstraint, MaxAltitudeConstraint, MaxSpeedConstraint } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { Geometry } from '@fmgc/guidance/Geometry';
import { AltitudeConstraintType, getAltitudeConstraintFromWaypoint, getPathAngleConstraintFromWaypoint, getSpeedConstraintFromWaypoint } from '@fmgc/guidance/lnav/legs';
import { FlightPlans, WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { MathUtils } from '@shared/MathUtils';
import { FixTypeFlags } from '@fmgc/types/fstypes/FSEnums';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';

/**
 * This entire class essentially represents an interface to the flightplan.
 */
export class ConstraintReader {
    public climbAlitudeConstraints: MaxAltitudeConstraint[] = [];

    public descentAltitudeConstraints: DescentAltitudeConstraint[] = [];

    public climbSpeedConstraints: MaxSpeedConstraint[] = [];

    public descentSpeedConstraints: MaxSpeedConstraint[] = [];

    public cruiseSteps: GeographicCruiseStep[] = [];

    public totalFlightPlanDistance = 0;

    public distanceToEnd: NauticalMiles = 0;

    // If you change this property here, make sure you also reset it properly in `reset`
    public finalDescentAngle = -3;

    // If you change this property here, make sure you also reset it properly in `reset`
    public fafDistanceToEnd = 1000 / Math.tan(-this.finalDescentAngle * MathUtils.DEGREES_TO_RADIANS) / 6076.12;

    public get distanceToPresentPosition(): NauticalMiles {
        return this.totalFlightPlanDistance - this.distanceToEnd;
    }

    public finalAltitude: Feet = 50;

    constructor(private guidanceController: GuidanceController) {
        this.reset();
    }

    updateGeometry(geometry: Geometry, ppos: LatLongAlt) {
        this.reset();
        this.updateDistancesToEnd(geometry);

        const fpm = this.guidanceController.flightPlanManager;
        let maxSpeed = Infinity;

        for (let i = 0; i < fpm.getWaypointsCount(FlightPlans.Active); i++) {
            const waypoint = fpm.getWaypoint(i, FlightPlans.Active);

            if (waypoint.additionalData.cruiseStep) {
                if (i >= fpm.getActiveWaypointIndex()) {
                    const { waypointIndex, toAltitude, distanceBeforeTermination } = waypoint.additionalData.cruiseStep;

                    this.cruiseSteps.push({
                        distanceFromStart: this.totalFlightPlanDistance - waypoint.additionalData.distanceToEnd - distanceBeforeTermination,
                        toAltitude,
                        waypointIndex,
                        isIgnored: false,
                    });
                } else {
                    // We've already passed the waypoint
                    waypoint.additionalData.cruiseStep = undefined;
                    SimVar.SetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', 'boolean', true);
                }
            }

            const altConstraint = getAltitudeConstraintFromWaypoint(waypoint);
            const speedConstraint = getSpeedConstraintFromWaypoint(waypoint);
            const pathAngleConstraint = getPathAngleConstraintFromWaypoint(waypoint);

            if (waypoint.additionalData.constraintType === WaypointConstraintType.CLB) {
                if (altConstraint && altConstraint.type !== AltitudeConstraintType.atOrAbove) {
                    this.climbAlitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - waypoint.additionalData.distanceToEnd,
                        maxAltitude: altConstraint.altitude1,
                    });
                }

                if (speedConstraint && waypoint.speedConstraint > 100) {
                    this.climbSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - waypoint.additionalData.distanceToEnd,
                        maxSpeed: speedConstraint.speed,
                    });
                }
            } else if (waypoint.additionalData.constraintType === WaypointConstraintType.DES) {
                if (altConstraint) {
                    this.descentAltitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - waypoint.additionalData.distanceToEnd,
                        constraint: altConstraint,
                    });
                }

                if (speedConstraint && waypoint.speedConstraint > 100) {
                    maxSpeed = Math.min(maxSpeed, speedConstraint.speed);

                    this.descentSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - waypoint.additionalData.distanceToEnd,
                        maxSpeed,
                    });
                }
            }

            if (i === fpm.getDestinationIndex() && pathAngleConstraint) {
                this.finalDescentAngle = pathAngleConstraint;
            }

            if ((waypoint.additionalData.fixTypeFlags & FixTypeFlags.FAF) > 0) {
                this.fafDistanceToEnd = waypoint.additionalData.distanceToEnd;
            }
        }

        this.updateFinalAltitude();
        this.updateDistanceToEnd(ppos);
    }

    public updateDistanceToEnd(ppos: LatLongAlt) {
        if (VnavConfig.ALLOW_DEBUG_PARAMETER_INJECTION) {
            this.distanceToEnd = SimVar.GetSimVarValue('L:A32NX_FM_VNAV_DEBUG_DISTANCE_TO_END', 'nautical miles');
            return;
        }

        const geometry = this.guidanceController.activeGeometry;
        const activeLegIndex = this.guidanceController.activeLegIndex;
        const activeTransIndex = this.guidanceController.activeTransIndex;
        const fpm = this.guidanceController.flightPlanManager;

        const leg = geometry.legs.get(activeLegIndex);
        if (!leg || leg.isNull) {
            return;
        }

        const nextWaypoint: WayPoint | undefined = leg instanceof VMLeg
            ? fpm.getWaypoint(activeLegIndex + 1, FlightPlans.Active)
            : fpm.getWaypoint(activeLegIndex, FlightPlans.Active);

        const inboundTransition = geometry.transitions.get(activeLegIndex - 1);
        const outboundTransition = geometry.transitions.get(activeLegIndex);

        const [_, legDistance, outboundLength] = Geometry.completeLegPathLengths(
            leg, (inboundTransition?.isNull || !inboundTransition?.isComputed) ? null : inboundTransition, outboundTransition,
        );

        if (activeTransIndex === activeLegIndex) {
            // On an outbound transition
            // We subtract `outboundLength` because getDistanceToGo will include the entire distance while we only want the part that's on this leg.
            // For a FixedRadiusTransition, there's also a part on the next leg.
            this.distanceToEnd = outboundTransition.getDistanceToGo(ppos) - outboundLength + (nextWaypoint?.additionalData?.distanceToEnd ?? 0);
        } else if (activeTransIndex === activeLegIndex - 1) {
            // On an inbound transition
            const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

            let transitionDistanceToGo = inboundTransition.getDistanceToGo(ppos);

            if (inboundTransition instanceof PathCaptureTransition) {
                transitionDistanceToGo = inboundTransition.getActualDistanceToGo(ppos, trueTrack);
            } else if (inboundTransition instanceof FixedRadiusTransition && inboundTransition.isReverted) {
                transitionDistanceToGo = inboundTransition.revertTo.getActualDistanceToGo(ppos, trueTrack);
            }

            this.distanceToEnd = transitionDistanceToGo + legDistance + outboundLength + (nextWaypoint?.additionalData?.distanceToEnd ?? 0);
        } else {
            const distanceToGo = leg instanceof VMLeg || leg instanceof IFLeg
                ? Avionics.Utils.computeGreatCircleDistance(ppos, nextWaypoint?.infos?.coordinates)
                : leg.getDistanceToGo(ppos);

            this.distanceToEnd = distanceToGo + outboundLength + (nextWaypoint?.additionalData?.distanceToEnd ?? 0);
        }
    }

    private updateFinalAltitude(): void {
        const metersToFeet = 3.2808399;

        const fpm = this.guidanceController.flightPlanManager;
        const approach = fpm.getApproach();

        // Check if we have a procedure loaded from which we can extract the final altitude
        if (approach && approach.approachType !== ApproachType.APPROACH_TYPE_UNKNOWN) {
            for (const leg of approach.finalLegs) {
                if (leg.fixTypeFlags & FixTypeFlags.MAP && Number.isFinite(leg.altitude1)) {
                    this.finalAltitude = leg.altitude1 * metersToFeet;

                    return;
                }
            }
        }

        // Check if we only have a runway loaded. In this case, take the threshold elevation.
        const runway = fpm.getDestinationRunway();
        if (runway && Number.isFinite(runway.thresholdElevation)) {
            this.finalAltitude = runway.thresholdElevation * metersToFeet + 50;

            return;
        }

        // Check if we only have a destination airport loaded. In this case, take the airport elevation.
        const destinationAirport = fpm.getDestination();
        // TODO: I think selecting an approach and then deleting it will cause destinationAirport.infos.coordinates.alt to be zero.
        if (destinationAirport && Number.isFinite(destinationAirport.infos.coordinates.alt)) {
            this.finalAltitude = destinationAirport.infos.coordinates.alt + 50;

            return;
        }

        // Last resort. Not sure how we'd get here.
        // If I do change this, I should probably change it in the reset() function.
        this.finalAltitude = 50;
    }

    reset() {
        this.climbAlitudeConstraints = [];
        this.descentAltitudeConstraints = [];
        this.climbSpeedConstraints = [];
        this.descentSpeedConstraints = [];
        this.cruiseSteps = [];

        this.totalFlightPlanDistance = 0;
        this.distanceToEnd = 0;
        this.finalDescentAngle = -3;
        this.fafDistanceToEnd = 1000 / Math.tan(-this.finalDescentAngle * MathUtils.DEGREES_TO_RADIANS) / 6076.12;
        this.finalAltitude = 50;
    }

    private updateDistancesToEnd(geometry: Geometry) {
        const { legs, transitions } = geometry;
        const fpm = this.guidanceController.flightPlanManager;

        this.totalFlightPlanDistance = 0;

        for (let i = fpm.getWaypointsCount(FlightPlans.Active) - 1; i >= fpm.getActiveWaypointIndex() - 1 && i >= 0; i--) {
            const leg = legs.get(i);
            const waypoint = fpm.getWaypoint(i, FlightPlans.Active);
            const nextWaypoint = fpm.getWaypoint(i + 1, FlightPlans.Active);

            if (waypoint.endsInDiscontinuity) {
                const startingPointOfDisco = waypoint.discontinuityCanBeCleared
                    ? waypoint
                    : fpm.getWaypoint(i - 1, FlightPlans.Active); // MANUAL

                this.totalFlightPlanDistance += Avionics.Utils.computeGreatCircleDistance(startingPointOfDisco.infos.coordinates, nextWaypoint.infos.coordinates);
            }

            waypoint.additionalData.distanceToEnd = this.totalFlightPlanDistance;

            if (!leg || leg.isNull) {
                continue;
            }

            const inboundTransition = transitions.get(i - 1);
            const outboundTransition = transitions.get(i);

            const [inboundLength, legDistance, outboundLength] = Geometry.completeLegPathLengths(
                leg, (inboundTransition?.isNull || !inboundTransition?.isComputed) ? null : inboundTransition, outboundTransition,
            );

            const correctedInboundLength = Number.isNaN(inboundLength) ? 0 : inboundLength;
            const totalLegLength = legDistance + correctedInboundLength + outboundLength;

            this.totalFlightPlanDistance += totalLegLength;
        }
    }
}
