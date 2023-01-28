// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { LegType } from 'msfs-navdata';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { AFLeg } from '@fmgc/guidance/lnav/legs/AF';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';
import { TransitionPicker } from '@fmgc/guidance/lnav/TransitionPicker';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { legMetadataFromFlightPlanLeg } from '@fmgc/guidance/lnav/legs';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { CRLeg } from '@fmgc/guidance/lnav/legs/CR';
import { FDLeg } from '@fmgc/guidance/lnav/legs/FD';
import { CDLeg } from '@fmgc/guidance/lnav/legs/CD';
import { PILeg } from '@fmgc/guidance/lnav/legs/PI';
import { HALeg, HFLeg, HMLeg } from '../lnav/legs/HX';

function getFacilities(): typeof Facilities {
    if ('Facilities' in window) {
        return Facilities;
    }

    return {
        getMagVar(_lat: Degrees, _long: Degrees): Degrees {
            return 0;
        },
    };
}

export namespace GeometryFactory {
    export function createFromFlightPlan(plan: BaseFlightPlan, doGenerateTransitions = true): Geometry {
        const legs = new Map<number, Leg>();
        const transitions = new Map<number, Transition>();

        let runningMagvar = 0;

        const planElements = plan.allLegs;
        for (let i = 0; i < planElements.length; i++) {
            const prevElement = planElements[i - 1];
            const element = planElements[i];
            const nextElement = planElements[i + 1];

            if (element.isDiscontinuity === true) {
                continue;
            }

            if (element.isXF()) {
                const fixLocation = element.terminationWaypoint().location;

                // TODO very sussy... declination/variation does not work like this for terminal procedures
                runningMagvar = getFacilities().getMagVar(fixLocation.lat, fixLocation.long);
            }

            let nextGeometryLeg;
            if (nextElement?.isDiscontinuity === false && nextElement.type !== LegType.CI && nextElement.type !== LegType.VI) {
                nextGeometryLeg = geometryLegFromFlightPlanLeg(runningMagvar, element, nextElement);
            }

            const geometryLeg = geometryLegFromFlightPlanLeg(runningMagvar, prevElement, element, nextGeometryLeg);

            const previousGeometryLwg = legs.get(i - 1);

            if (previousGeometryLwg && doGenerateTransitions && doGenerateTransitionsForLeg(geometryLeg, i, plan)) {
                const transition = TransitionPicker.forLegs(previousGeometryLwg, geometryLeg);

                transitions.set(i - 1, transition);
            }

            legs.set(i, geometryLeg);
        }

        return new Geometry(transitions, legs, false);
    }

    export function updateFromFlightPlan(geometry: Geometry, flightPlan: BaseFlightPlan, doGenerateTransitions = true) {
        geometry.version++;

        if (LnavConfig.DEBUG_GEOMETRY) {
            console.log('[Fms/Geometry/Update] Starting geometry update.');
        }

        let runningMagvar = 0;

        for (let i = 0; i < flightPlan.legCount; i++) {
            const oldLeg = geometry.legs.get(i);

            const previousPlanLeg = flightPlan.allLegs[i - 1];
            const nextPlanLeg = flightPlan.allLegs[i + 1];

            const planLeg = flightPlan.allLegs[i];

            if (planLeg.isDiscontinuity === false && planLeg.isXF()) {
                const fixLocation = planLeg.terminationWaypoint().location;

                // TODO very sussy... declination/variation does not work like this for terminal procedures
                runningMagvar = getFacilities().getMagVar(fixLocation.lat, fixLocation.long);
            }

            // We start at 0 in the loop because we wanna still update runningMagvar from the start of the plan. This avoids changes in leg true courses
            // that can cause unwanted re-creation of new legs.
            if (i < flightPlan.activeLegIndex - 1) {
                continue;
            }

            let nextLeg: Leg;
            if (nextPlanLeg?.isDiscontinuity === false && nextPlanLeg.type !== LegType.CI && nextPlanLeg.type !== LegType.VI && nextPlanLeg.type !== LegType.PI) {
                nextLeg = geometryLegFromFlightPlanLeg(runningMagvar, planLeg, nextPlanLeg);
            }

            const newLeg = planLeg?.isDiscontinuity === false ? geometryLegFromFlightPlanLeg(runningMagvar, previousPlanLeg, planLeg, nextLeg) : undefined;

            if (LnavConfig.DEBUG_GEOMETRY) {
                console.log(`[FMS/Geometry/Update] Old leg #${i} = ${oldLeg?.repr ?? '<none>'}`);
                console.log(`[FMS/Geometry/Update] New leg #${i} = ${newLeg?.repr ?? '<none>'}`);
            }

            const legsMatch = oldLeg?.repr === newLeg?.repr;

            if (legsMatch) {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    console.log('[FMS/Geometry/Update] Old and new leg are the same. Keeping old leg.');
                }

                // Sync fixes

                if (oldLeg instanceof XFLeg && newLeg instanceof XFLeg) {
                    oldLeg.fix = newLeg.fix;
                    oldLeg.metadata = newLeg.metadata;
                }

                const prevLeg = geometry.legs.get(i - 1);

                const oldInboundTransition = geometry.transitions.get(i - 1);
                const newInboundTransition = TransitionPicker.forLegs(prevLeg, newLeg);

                const transitionsMatch = oldInboundTransition?.repr === newInboundTransition?.repr;

                if (!transitionsMatch && doGenerateTransitions && doGenerateTransitionsForLeg(newLeg, i, flightPlan)) {
                    geometry.transitions.set(i - 1, newInboundTransition);
                }
            } else {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    if (!oldLeg) console.log('[FMS/Geometry/Update] No old leg. Adding new leg.');
                    else if (!newLeg) console.log('[FMS/Geometry/Update] No new leg. Removing old leg.');
                    else console.log('[FMS/Geometry/Update] Old and new leg are different. Keeping new leg.');
                }

                if (newLeg) {
                    geometry.legs.set(i, newLeg);

                    const prevLeg = geometry.legs.get(i - 1);

                    if (prevLeg && doGenerateTransitions && doGenerateTransitionsForLeg(newLeg, i, flightPlan)) {
                        const newInboundTransition = TransitionPicker.forLegs(prevLeg, newLeg);

                        if (LnavConfig.DEBUG_GEOMETRY) {
                            console.log(`[FMS/Geometry/Update] Set new inbound transition for new leg (${newInboundTransition?.repr ?? '<none>'})`);
                        }

                        if (newInboundTransition) {
                            geometry.transitions.set(i - 1, newInboundTransition);
                        } else {
                            geometry.transitions.delete(i - 1);
                        }
                    } else {
                        geometry.transitions.delete(i - 1);
                    }
                } else {
                    geometry.legs.delete(i);
                    geometry.transitions.delete(i - 1);
                    geometry.transitions.delete(i);
                }
            }
        }

        // Trim geometry

        for (const [index] of geometry.legs.entries()) {
            const legBeforePrev = index < flightPlan.activeLegIndex - 1;
            const legAfterLastWpt = index >= flightPlan.legCount;

            if (legBeforePrev || legAfterLastWpt) {
                if (LnavConfig.DEBUG_GEOMETRY) {
                    console.log(`[FMS/Geometry/Update] Removed leg #${index} (${geometry.legs.get(index)?.repr ?? '<unknown>'}) because of trimming.`);
                }

                geometry.legs.delete(index);
                geometry.transitions.delete(index - 1);
            }
        }

        if (LnavConfig.DEBUG_GEOMETRY) {
            console.log('[Fms/Geometry/Update] Done with geometry update.');
        }
    }
}

function geometryLegFromFlightPlanLeg(runningMagvar: Degrees, previousFlightPlanLeg: FlightPlanElement | undefined, flightPlanLeg: FlightPlanLeg, nextGeometryLeg?: Leg): Leg {
    const legType = flightPlanLeg.type;

    if (previousFlightPlanLeg?.isDiscontinuity === true && legType !== LegType.IF && legType !== LegType.CF) {
        throw new Error('[FMS/Geometry] Leg type after discontinuity can only be IF or CF');
    }

    const metadata = legMetadataFromFlightPlanLeg(flightPlanLeg);

    const waypoint = flightPlanLeg.terminationWaypoint();
    const recommendedNavaid = flightPlanLeg.definition.recommendedNavaid;
    const trueCourse = flightPlanLeg.definition.magneticCourse + runningMagvar;
    const trueTheta = flightPlanLeg.definition.theta + runningMagvar;
    const length = flightPlanLeg.definition.length;

    switch (legType) {
    case LegType.AF: {
        const recommendedNavaid = flightPlanLeg.definition.recommendedNavaid;
        const navaid = recommendedNavaid.location;
        const rho = flightPlanLeg.definition.rho;

        return new AFLeg(waypoint, navaid, rho, trueTheta, trueCourse, metadata, SegmentType.Departure);
    }
    case LegType.CA:
    case LegType.FA:
    case LegType.VA: { // TODO FA, VA legs in geometry
        const altitude = flightPlanLeg.definition.altitude1;

        return new CALeg(trueCourse, altitude, metadata, SegmentType.Departure);
    }
    case LegType.CD:
        return new CDLeg(trueCourse, length, recommendedNavaid, metadata, SegmentType.Departure);
    case LegType.CF:
        return new CFLeg(waypoint, trueCourse, metadata, SegmentType.Departure);
    case LegType.CI:
    case LegType.VI: { // TODO VI leg in geometry
        if (!nextGeometryLeg) {
            throw new Error('[FMS/Geometry] Cannot make a CI leg without the next geometry leg being defined');
        }

        return new CILeg(trueCourse, nextGeometryLeg, metadata, SegmentType.Departure);
    }
    case LegType.CR:
    case LegType.VR: // TODO VR leg in geometry
        return new CRLeg(trueCourse, { ident: recommendedNavaid.ident, coordinates: recommendedNavaid.location, theta: trueTheta - runningMagvar }, trueTheta, metadata, SegmentType.Departure);
    case LegType.HA:
        return new HALeg(waypoint, metadata, SegmentType.Departure);
    case LegType.HF:
        return new HFLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.HM:
        return new HMLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.DF:
        return new DFLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.FC:
    case LegType.FD:
        return new FDLeg(trueCourse, length, waypoint, legType === LegType.FC ? waypoint : recommendedNavaid, metadata, SegmentType.Departure);
    case LegType.IF:
        return new IFLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.PI:
        if (!(nextGeometryLeg instanceof CFLeg)) {
            throw new Error('[FMS/Geometry] Cannot create a PI leg before a non-CF leg');
        }

        return new PILeg(recommendedNavaid, nextGeometryLeg, metadata, SegmentType.Approach);
    case LegType.RF:
    case LegType.TF: {
        const prev = previousFlightPlanLeg as FlightPlanLeg;

        if (!prev.isXF()) {
            throw new Error('[FMS/Geometry] Cannot create a TF leg after a non-XF leg');
        }

        const prevWaypoint = prev.terminationWaypoint();
        const waypoint = flightPlanLeg.terminationWaypoint();
        const center = flightPlanLeg.definition.arcCentreFix;

        if (legType === LegType.RF) {
            return new RFLeg(prevWaypoint, waypoint, center.location, metadata, SegmentType.Departure);
        }

        return new TFLeg(prevWaypoint, waypoint, metadata, SegmentType.Departure);
    }
    case LegType.VD:
        break;
    case LegType.FM:
    case LegType.VM: {
        return new VMLeg(trueCourse, metadata, SegmentType.Departure);
    }
    default:
        break;
    }

    throw new Error(`[FMS/Geometry] Could not generate geometry leg for flight plan leg type=${LegType[legType]}`);
}

function doGenerateTransitionsForLeg(leg: Leg, legIndex: number, plan: BaseFlightPlan) {
    const generateAllTransitions = LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE === -1;
    const positionFromActiveLeg = legIndex - plan.activeLegIndex;

    const inRange = generateAllTransitions || positionFromActiveLeg < 2;

    if (!inRange) {
        return false;
    }

    if (leg.metadata.isInMissedApproach) {
        return legIndex <= plan.firstMissedApproachLegIndex;
    }

    return true;
}
