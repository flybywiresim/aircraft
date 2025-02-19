// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { isVhfNavaid, LegType, ApproachType } from '@flybywiresim/fbw-sdk';
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
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { FALeg } from '@fmgc/guidance/lnav/legs/FA';
import { HALeg, HFLeg, HMLeg } from '../lnav/legs/HX';
import { A32NX_Util } from '@shared/A32NX_Util';

export namespace GeometryFactory {
  export function createFromFlightPlan(plan: BaseFlightPlan, doGenerateTransitions = true): Geometry {
    const legs = new Map<number, Leg>();
    const transitions = new Map<number, Transition>();

    const planElements = plan.allLegs;
    for (let i = 0; i < planElements.length; i++) {
      const prevElement = planElements[i - 1];
      const element = planElements[i];
      const nextElement = planElements[i + 1];
      const nextNextElement = planElements[i + 2];

      if (element.isDiscontinuity === true) {
        continue;
      }

      const magVar = getMagCorrection(i, plan);

      let nextGeometryLeg: Leg;
      if (
        nextElement?.isDiscontinuity === false &&
        nextElement.type !== LegType.CI &&
        nextElement.type !== LegType.VI
      ) {
        nextGeometryLeg = isXiIfXf(element, nextElement, nextNextElement)
          ? geometryLegFromFlightPlanLeg(magVar, nextElement, nextNextElement)
          : geometryLegFromFlightPlanLeg(magVar, element, nextElement);
      }

      const geometryLeg = geometryLegFromFlightPlanLeg(magVar, prevElement, element, nextGeometryLeg);

      if (isXiIfXf(prevElement, element, nextElement)) {
        geometryLeg.isNull = true;
      }

      const previousGeometryLeg = legs.get(i - 1);
      if (previousGeometryLeg && doGenerateTransitions && doGenerateTransitionsForLeg(geometryLeg, i, plan)) {
        const transition = TransitionPicker.forLegs(previousGeometryLeg, geometryLeg);

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

    for (let i = 0; i < flightPlan.legCount; i++) {
      const oldLeg = geometry.legs.get(i);

      const prevPlanLeg = flightPlan.allLegs[i - 1];
      const nextPlanLeg = flightPlan.allLegs[i + 1];
      const nextNextPlanLeg = flightPlan.allLegs[i + 2];

      const planLeg = flightPlan.allLegs[i];

      // We start at 0 in the loop because we wanna still update runningMagvar from the start of the plan. This avoids changes in leg true courses
      // that can cause unwanted re-creation of new legs.
      if (i < flightPlan.activeLegIndex - 1) {
        continue;
      }

      const magVar = planLeg.isDiscontinuity === false ? getMagCorrection(i, flightPlan) : 0;

      let nextLeg: Leg = undefined;
      if (nextPlanLeg?.isDiscontinuity === false && !nextPlanLeg.isXI()) {
        nextLeg = isXiIfXf(planLeg, nextPlanLeg, nextNextPlanLeg)
          ? geometryLegFromFlightPlanLeg(magVar, nextPlanLeg, nextNextPlanLeg)
          : geometryLegFromFlightPlanLeg(magVar, planLeg, nextPlanLeg);
      }

      const newLeg =
        planLeg?.isDiscontinuity === false
          ? geometryLegFromFlightPlanLeg(magVar, prevPlanLeg, planLeg, nextLeg)
          : undefined;

      if (isXiIfXf(prevPlanLeg, planLeg, nextPlanLeg)) {
        newLeg.isNull = true;
      }

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
        }

        if (oldLeg && newLeg) {
          oldLeg.metadata = newLeg.metadata;
        }

        const prevLeg = geometry.legs.get(i - 1);

        if (prevLeg && newLeg) {
          const oldInboundTransition = geometry.transitions.get(i - 1);
          const newInboundTransition = TransitionPicker.forLegs(prevLeg, newLeg);

          const transitionsMatch = oldInboundTransition?.repr === newInboundTransition?.repr;

          if (!transitionsMatch && doGenerateTransitions && doGenerateTransitionsForLeg(newLeg, i, flightPlan)) {
            geometry.transitions.set(i - 1, newInboundTransition);
          }
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
              console.log(
                `[FMS/Geometry/Update] Set new inbound transition for new leg (${newInboundTransition?.repr ?? '<none>'})`,
              );
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
      const legBeforePrev = index < flightPlan.fromLegIndex;
      const legAfterLastWpt = index >= flightPlan.legCount;

      if (legBeforePrev || legAfterLastWpt) {
        if (LnavConfig.DEBUG_GEOMETRY) {
          console.log(
            `[FMS/Geometry/Update] Removed leg #${index} (${geometry.legs.get(index)?.repr ?? '<unknown>'}) because of trimming.`,
          );
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

function geometryLegFromFlightPlanLeg(
  magVar: Degrees,
  previousFlightPlanLeg: FlightPlanElement | undefined,
  flightPlanLeg: FlightPlanLeg,
  nextGeometryLeg?: Leg,
): Leg {
  const legType = flightPlanLeg.type;

  if (previousFlightPlanLeg?.isDiscontinuity === true && legType !== LegType.IF && legType !== LegType.CF) {
    throw new Error('[FMS/Geometry] Leg type after discontinuity can only be IF or CF');
  }

  const metadata = legMetadataFromFlightPlanLeg(flightPlanLeg);

  const waypoint = flightPlanLeg.terminationWaypoint();
  const recommendedNavaid = flightPlanLeg.definition.recommendedNavaid;
  const trueCourse = A32NX_Util.magneticToTrue(flightPlanLeg.definition.magneticCourse, magVar);
  const magneticTheta = flightPlanLeg.definition.theta;
  const trueTheta = A32NX_Util.magneticToTrue(flightPlanLeg.definition.theta, magVar);
  const length = flightPlanLeg.definition.length;

  switch (legType) {
    case LegType.AF: {
      const recommendedNavaid = flightPlanLeg.definition.recommendedNavaid;
      const navaid = recommendedNavaid.location;
      const rho = flightPlanLeg.definition.rho;

      return new AFLeg(waypoint, navaid, rho, trueTheta, trueCourse, metadata, SegmentType.Departure);
    }
    case LegType.CA:
    case LegType.VA: {
      // TODO FA, VA legs in geometry
      const altitude = flightPlanLeg.definition.altitude1;

      return new CALeg(trueCourse, altitude, metadata, SegmentType.Departure);
    }
    case LegType.CD:
    case LegType.VD: // TODO FA, VA legs in geometry
      return new CDLeg(trueCourse, length, recommendedNavaid, metadata, SegmentType.Departure);
    case LegType.CF:
      return new CFLeg(waypoint, trueCourse, length, metadata, SegmentType.Departure);
    case LegType.CI:
    case LegType.VI: {
      // TODO VI leg in geometry
      if (!nextGeometryLeg) {
        throw new Error('[FMS/Geometry] Cannot make a CI leg without the next geometry leg being defined');
      }

      return new CILeg(trueCourse, nextGeometryLeg, metadata, SegmentType.Departure);
    }
    case LegType.CR:
    case LegType.VR: // TODO VR leg in geometry
      return new CRLeg(
        trueCourse,
        { ident: recommendedNavaid.ident, coordinates: recommendedNavaid.location, theta: magneticTheta },
        trueTheta,
        metadata,
        SegmentType.Departure,
      );
    case LegType.HA:
      return new HALeg(waypoint, metadata, SegmentType.Departure);
    case LegType.HF:
      return new HFLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.HM:
      return new HMLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.DF:
      return new DFLeg(waypoint, metadata, SegmentType.Departure);
    case LegType.FA:
      return new FALeg(waypoint, trueCourse, flightPlanLeg.definition.altitude1, metadata, SegmentType.Departure);
    case LegType.FC:
    case LegType.FD:
      return new FDLeg(
        trueCourse,
        length,
        waypoint,
        legType === LegType.FC ? waypoint : recommendedNavaid,
        metadata,
        SegmentType.Departure,
      );
    case LegType.FM:
      return new FMLeg(flightPlanLeg.terminationWaypoint(), trueCourse, metadata, SegmentType.Departure);
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

      if (!prev.isXF() && !prev.isHX()) {
        throw new Error('[FMS/Geometry] Cannot create a TF leg after a non-XF/HX leg');
      }

      const prevWaypoint = prev.terminationWaypoint();
      const waypoint = flightPlanLeg.terminationWaypoint();
      const center = flightPlanLeg.definition.arcCentreFix;

      if (legType === LegType.RF) {
        return new RFLeg(prevWaypoint, waypoint, center.location, metadata, SegmentType.Departure);
      }

      return new TFLeg(prevWaypoint, waypoint, metadata, SegmentType.Departure);
    }
    case LegType.VM: {
      return new VMLeg(trueCourse, metadata, SegmentType.Departure);
    }
    default:
      break;
  }

  throw new Error(`[FMS/Geometry] Could not generate geometry leg for flight plan leg type=${LegType[legType]}`);
}

function getMagCorrection(legIndex: number, plan: BaseFlightPlan): number {
  // we try to interpret PANS OPs as accurately as possible within the limits of available data
  const currentLeg = plan.legElementAt(legIndex);

  let airportMagVar = 0;
  if (legIndex <= plan.findLastDepartureLeg()[2]) {
    airportMagVar =
      plan.originAirport.magneticVariation ??
      Facilities.getMagVar(plan.originAirport.location.lat, plan.originAirport.location.long);
  } else if (legIndex >= plan.findFirstArrivalLeg()[2]) {
    airportMagVar =
      plan.destinationAirport.magneticVariation ??
      Facilities.getMagVar(plan.destinationAirport.location.lat, plan.destinationAirport.location.long);
  }

  const isLegOnApproach =
    legIndex >= plan.firstApproachLegIndex - plan.approachViaSegment.legCount &&
    legIndex < plan.firstMissedApproachLegIndex;

  // magnetic tracks to/from a VOR always use VOR station declination
  if (isVhfNavaid(currentLeg.definition.waypoint)) {
    const vor = currentLeg.definition.waypoint;

    if (vor?.stationDeclination === undefined) {
      console.warn('Leg coded incorrectly (missing vor fix or station declination)', currentLeg, vor);
      return airportMagVar;
    }

    return vor.stationDeclination;
  } else if (isLegOnApproach) {
    return getApproachMagCorrection(legIndex, plan) ?? airportMagVar;
  }

  // for all other terminal procedure legs we use airport magnetic variation
  return airportMagVar;
}

function getApproachMagCorrection(legIndex: number, plan: BaseFlightPlan): number | undefined {
  const approachType = plan.approach.type;
  const currentLeg = plan.legElementAt(legIndex);

  // we use station declination for VOR/DME approaches
  if (
    approachType === ApproachType.Vor ||
    approachType === ApproachType.VorDme ||
    approachType === ApproachType.Vortac
  ) {
    // find a leg with the reference navaid for the procedure
    for (
      let i = plan.firstMissedApproachLegIndex - 1;
      i >= plan.firstMissedApproachLegIndex - plan.approachViaSegment.legCount;
      i--
    ) {
      const leg = plan.allLegs[i];
      if (leg.isDiscontinuity === false && isVhfNavaid(leg.definition.recommendedNavaid)) {
        return leg.definition.recommendedNavaid.stationDeclination;
      }
    }

    console.warn('VOR/DME approach coded incorrectly (missing recommended navaid or station declination)', currentLeg);
    return undefined;
  }

  // for RNAV procedures use recommended navaid station declination for these leg types
  let useStationDeclination =
    currentLeg.type === LegType.CF || currentLeg.type === LegType.FA || currentLeg.type === LegType.FM;

  switch (approachType) {
    case ApproachType.LocBackcourse:
    case ApproachType.Ils:
    case ApproachType.Loc:
    case ApproachType.Mls:
    case ApproachType.Igs:
    case ApproachType.Sdf:
    case ApproachType.Lda:
    case ApproachType.MlsTypeA:
    case ApproachType.MlsTypeBC:
      useStationDeclination = useStationDeclination && legIndex < plan.getFinalApproachCourseFixIndex();
  }

  if (useStationDeclination) {
    const recNavaid = currentLeg.definition.recommendedNavaid;

    if (!recNavaid || !isVhfNavaid(recNavaid)) {
      console.warn('Leg coded incorrectly (missing recommended navaid or station declination)', currentLeg, recNavaid);
      return undefined;
    }

    return recNavaid.stationDeclination;
  }
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

function isXiIfXf(
  prev: FlightPlanElement | undefined,
  current: FlightPlanElement | undefined,
  next: FlightPlanElement | undefined,
): next is FlightPlanLeg {
  return (
    prev?.isDiscontinuity === false &&
    prev?.isXI() &&
    current?.isDiscontinuity === false &&
    current?.type === LegType.IF &&
    next?.isDiscontinuity === false &&
    next?.isXF()
  );
}
