// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
    DescentAltitudeConstraint,
    GeographicCruiseStep,
    MaxAltitudeConstraint,
    MaxSpeedConstraint,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { Geometry } from '@fmgc/guidance/Geometry';
import {
    altitudeConstraintFromProcedureLeg,
    AltitudeConstraintType,
    pathAngleConstraintFromProcedureLeg,
    speedConstraintFromProcedureLeg,
} from '@fmgc/guidance/lnav/legs';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { ApproachType, LegType } from 'msfs-navdata';
import { distanceTo } from 'msfs-geo';

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

    public readonly legDistancesToEnd: number[] = [];

    public distanceToEnd: NauticalMiles = 0;

    // If you change this property here, make sure you also reset it properly in `reset`
    public finalDescentAngle = -3;

    // If you change this property here, make sure you also reset it properly in `reset`
    public fafDistanceToEnd = 1000 / Math.tan(-this.finalDescentAngle * MathUtils.DEGREES_TO_RADIANS) / 6076.12;

    public get distanceToPresentPosition(): NauticalMiles {
        return this.totalFlightPlanDistance - this.distanceToEnd;
    }

    public finalAltitude: Feet = 50;

    constructor(private flightPlanService: FlightPlanService, private guidanceController: GuidanceController) {
        this.reset();
    }

    updateGeometry(geometry: Geometry, ppos: LatLongAlt) {
        this.reset();
        this.updateDistancesToEnd(geometry);

        let maxSpeed = Infinity;

        const plan = this.flightPlanService.active;

        for (let i = 0; i < plan.firstMissedApproachLegIndex; i++) {
            const leg = plan.elementAt(i);

            if (leg.isDiscontinuity === true) {
                continue;
            }

            const legDistanceToEnd = this.legDistancesToEnd[i];

            if (leg.cruiseStep && !leg.cruiseStep.isIgnored) {
                if (i >= plan.activeLegIndex) {
                    const { waypointIndex, toAltitude, distanceBeforeTermination } = leg.cruiseStep;

                    this.cruiseSteps.push({
                        distanceFromStart: this.totalFlightPlanDistance - legDistanceToEnd - distanceBeforeTermination,
                        toAltitude,
                        waypointIndex,
                        isIgnored: false,
                    });
                } else {
                    // We've already passed the waypoint
                    leg.cruiseStep = undefined; // TODO fms-v2: sync this
                    SimVar.SetSimVarValue('L:A32NX_FM_VNAV_TRIGGER_STEP_DELETED', 'boolean', true);
                }
            }

            const altConstraint = altitudeConstraintFromProcedureLeg(leg.definition);
            const speedConstraint = speedConstraintFromProcedureLeg(leg.definition);
            const pathAngleConstraint = pathAngleConstraintFromProcedureLeg(leg.definition);

            if (leg.constraintType === WaypointConstraintType.CLB) {
                if (altConstraint && altConstraint.type !== AltitudeConstraintType.atOrAbove) {
                    this.climbAlitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - legDistanceToEnd,
                        maxAltitude: altConstraint.altitude1,
                    });
                }

                if (speedConstraint && speedConstraint.speed > 100) {
                    this.climbSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - legDistanceToEnd,
                        maxSpeed: speedConstraint.speed,
                    });
                }
            } else if (leg.constraintType === WaypointConstraintType.DES) {
                if (altConstraint) {
                    this.descentAltitudeConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - legDistanceToEnd,
                        constraint: altConstraint,
                    });
                }

                if (speedConstraint && speedConstraint.speed > 100) {
                    maxSpeed = Math.min(maxSpeed, speedConstraint.speed);

                    this.descentSpeedConstraints.push({
                        distanceFromStart: this.totalFlightPlanDistance - legDistanceToEnd,
                        maxSpeed,
                    });
                }
            }

            if (i === plan.destinationLegIndex && pathAngleConstraint) {
                this.finalDescentAngle = pathAngleConstraint;
            }

            // TODO fms-v2: find fixTypeFlags in msfs-navdata
            // if ((leg.definition.fixTypeFlags & FixTypeFlags.FAF) > 0) {
            //     this.fafDistanceToEnd = leg.additionalData.distanceToEnd;
            // }
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

        const leg = geometry.legs.get(activeLegIndex);

        const nextLeg = leg instanceof VMLeg
            ? this.flightPlanService.active.maybeElementAt(activeLegIndex + 2)
            : this.flightPlanService.active.maybeElementAt(activeLegIndex);
        const nextLegDistanceToEnd = this.legDistancesToEnd[leg instanceof VMLeg ? activeLegIndex + 2 : activeLegIndex];

        if (!leg || leg.isNull) {
            return;
        }

        const inboundTransition = geometry.transitions.get(activeLegIndex - 1);
        const outboundTransition = geometry.transitions.get(activeLegIndex);

        const [_, legDistance, outboundLength] = Geometry.completeLegPathLengths(
            leg, (inboundTransition?.isNull || !inboundTransition?.isComputed) ? null : inboundTransition, outboundTransition,
        );

        if (activeTransIndex === activeLegIndex) {
            // On an outbound transition
            // We subtract `outboundLength` because getDistanceToGo will include the entire distance while we only want the part that's on this leg.
            // For a FixedRadiusTransition, there's also a part on the next leg.
            this.distanceToEnd = outboundTransition.getDistanceToGo(ppos) - outboundLength + (nextLeg ? nextLegDistanceToEnd : 0);
        } else if (activeTransIndex === activeLegIndex - 1) {
            // On an inbound transition
            const trueTrack = SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree');

            let transitionDistanceToGo = inboundTransition.getDistanceToGo(ppos);

            if (inboundTransition instanceof PathCaptureTransition) {
                transitionDistanceToGo = inboundTransition.getActualDistanceToGo(ppos, trueTrack);
            } else if (inboundTransition instanceof FixedRadiusTransition && inboundTransition.isReverted) {
                transitionDistanceToGo = inboundTransition.revertTo.getActualDistanceToGo(ppos, trueTrack);
            }

            this.distanceToEnd = transitionDistanceToGo + legDistance + outboundLength + (nextLeg ? nextLegDistanceToEnd : 0);
        } else {
            const distanceToGo = (leg instanceof VMLeg || leg instanceof IFLeg) && nextLeg && nextLeg.isDiscontinuity === false && nextLeg.isXF()
                ? distanceTo(ppos, nextLeg.terminationWaypoint().location)
                : leg.getDistanceToGo(ppos);

            this.distanceToEnd = distanceToGo + outboundLength + (nextLeg ? nextLegDistanceToEnd : 0);
        }
    }

    private updateFinalAltitude(): void {
        const plan = this.flightPlanService.active;

        const approach = plan.approach;

        // Check if we have a procedure loaded from which we can extract the final altitude
        if (approach && approach.type !== ApproachType.Unknown) {
            // TODO fms-v2: find fixTypeFlags in msfs-navdata
            // for (const leg of approach.legs) {
            // if (leg.fixTypeFlags & FixTypeFlags.MAP && Number.isFinite(leg.altitude1)) {
            //     this.finalAltitude = leg.altitude1 * metersToFeet;
            //
            //     return;
            // }
            // }
        }

        // Check if we only have a runway loaded. In this case, take the threshold elevation.
        const runway = plan.destinationRunway;
        if (runway && Number.isFinite(runway.thresholdLocation.alt)) {
            this.finalAltitude = runway.thresholdLocation.alt + 50;

            return;
        }

        // Check if we only have a destination airport loaded. In this case, take the airport elevation.
        const destinationAirport = plan.destinationAirport;
        // TODO: I think selecting an approach and then deleting it will cause destinationAirport.infos.coordinates.alt to be zero.
        if (destinationAirport && Number.isFinite(destinationAirport.location.alt)) {
            this.finalAltitude = destinationAirport.location.alt + 50;

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

        this.totalFlightPlanDistance = 0;

        const plan = this.flightPlanService.active;

        for (let i = plan.firstMissedApproachLegIndex - 1; i >= plan.activeLegIndex - 1 && i >= 0; i--) {
            const leg = legs.get(i);
            const waypoint = plan.elementAt(i);
            const nextWaypoint = plan.maybeElementAt(i + 1);
            const nextNextWaypoint = plan.maybeElementAt(i + 2);

            if (waypoint.isDiscontinuity === false && nextWaypoint?.isDiscontinuity === true && nextNextWaypoint?.isDiscontinuity === false) {
                const startingPointOfDisco = !(waypoint.type !== LegType.VM && waypoint.type !== LegType.FM)
                    ? legs.get(i - 1) // MANUAL
                    : leg;

                if (!startingPointOfDisco.isNull) {
                    const termination = startingPointOfDisco.terminationWaypoint;

                    if (termination) {
                        const terminationPoint = 'ident' in termination ? termination.location : termination;

                        this.totalFlightPlanDistance += distanceTo(terminationPoint, nextNextWaypoint.terminationWaypoint().location);
                    }
                }
            }

            this.legDistancesToEnd[i] = this.totalFlightPlanDistance;

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

    ignoreCruiseStep(waypointIndex: number) {
        const leg = this.flightPlanService.active.maybeElementAt(waypointIndex);

        if (leg?.isDiscontinuity === false && leg?.cruiseStep) {
            leg.cruiseStep.isIgnored = true;
        }
    }
}
