// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Transition } from '@fmgc/guidance/lnav/Transition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { Guidable } from '@fmgc/guidance/Guidable';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { CourseCaptureTransition } from '@fmgc/guidance/lnav/transitions/CourseCaptureTransition';
import {
  DirectToFixTransitionGuidanceState,
  DirectToFixTransition,
} from '@fmgc/guidance/lnav/transitions/DirectToFixTransition';
import { PathVector } from '@fmgc/guidance/lnav/PathVector';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { isCourseReversalLeg, isHold } from '@fmgc/guidance/lnav/legs';
import { maxBank } from '@fmgc/guidance/lnav/CommonGeometry';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';
import { CRLeg } from '@fmgc/guidance/lnav/legs/CR';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { TransitionPicker } from '@fmgc/guidance/lnav/TransitionPicker';
import { distanceTo } from 'msfs-geo';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { IFLeg } from '@fmgc/guidance/lnav/legs/IF';
import { FlightPlanElement, FlightPlanLegFlags } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { ControlLaw, CompletedGuidanceParameters, LateralPathGuidance } from './ControlLaws';
import { XFLeg } from '@fmgc/guidance/lnav/legs/XF';
import { BitFlags } from '@microsoft/msfs-sdk';

function isGuidableCapturingPath(guidable: Guidable): boolean {
  return !(
    guidable instanceof CALeg ||
    guidable instanceof CILeg ||
    guidable instanceof CRLeg ||
    guidable instanceof VMLeg ||
    guidable instanceof CourseCaptureTransition
  );
}

function isCiIfXfSequence(leg: Leg, nextLeg: Leg, nextNextLeg: Leg): boolean {
  return leg instanceof CILeg && nextLeg instanceof IFLeg && nextNextLeg instanceof XFLeg;
}

export class Geometry {
  constructor(
    /**
     * The list of transitions between legs.
     * - entry n: transition after leg n
     */
    public transitions: Map<number, Transition>,

    /**
     * The list of legs in this geometry, possibly connected through transitions:
     * - entry n: nth leg, before transition n
     */
    public legs: Map<number, Leg>,

    /**
     * Whether this geometry is for a temporary flight plan
     */
    private temp: boolean,
  ) {}

  public version = 0;

  private listener = RegisterViewListener('JS_LISTENER_SIMVARS', null, true);

  public isComputed = false;

  private cachedVectors = [];

  private missedCachedVectors = [];

  public cachedVectorsVersion = 0;

  public missedCachedVectorsVersion = 0;

  public getAllPathVectors(activeLegIndex?: number, missedApproach = false): PathVector[] {
    if (missedApproach) {
      if (this.version === this.missedCachedVectorsVersion) {
        return this.missedCachedVectors;
      }
    } else if (this.version === this.cachedVectorsVersion) {
      return this.cachedVectors;
    }

    const transmitHoldEntry = !this.temp;

    const ret = [];

    for (const [index, leg] of this.legs.entries()) {
      if (
        (!missedApproach && leg.metadata.isInMissedApproach) ||
        (missedApproach && !leg.metadata.isInMissedApproach)
      ) {
        continue;
      }

      if (leg.isNull) {
        continue;
      }

      // TODO don't transmit any course reversals when this side range >= 160
      const transmitCourseReversal =
        LnavConfig.DEBUG_FORCE_INCLUDE_COURSE_REVERSAL_VECTORS ||
        index === activeLegIndex ||
        index === activeLegIndex + 1;

      if (activeLegIndex !== undefined) {
        if (isCourseReversalLeg(leg) && !transmitCourseReversal) {
          continue;
        }
        if (index < activeLegIndex) {
          continue;
        }
      }
      const legInboundTransition = leg.inboundGuidable instanceof Transition ? leg.inboundGuidable : null;

      if (legInboundTransition && !legInboundTransition.isNull && (!isHold(leg) || transmitHoldEntry)) {
        ret.push(...legInboundTransition.predictedPath);
      }

      if (leg) {
        ret.push(...leg.predictedPath);
      }
    }

    if (missedApproach) {
      this.missedCachedVectors = ret;
      this.missedCachedVectorsVersion = this.version;
    } else {
      this.cachedVectors = ret;
      this.cachedVectorsVersion = this.version;
    }

    return ret;
  }

  /**
   * Recomputes the guidable using new parameters
   *
   * @param tas             predicted true airspeed speed of the current leg (for a leg) or the next leg (for a transition) in knots
   * @param gs              predicted ground speed of the current leg
   * @param ppos            present position coordinates
   * @param trueTrack       present true track
   * @param plan            the associated flight plan
   * @param activeLegIdx    current active leg index
   * @param _activeTransIdx current active transition index
   */
  recomputeWithParameters(
    tas: Knots,
    gs: Knots,
    ppos: Coordinates,
    trueTrack: DegreesTrue,
    plan: BaseFlightPlan,
    activeLegIdx: number,
    _activeTransIdx: number,
  ) {
    this.version++;

    if (LnavConfig.DEBUG_GEOMETRY) {
      console.log(`[FMS/Geometry] Recomputing geometry with current_tas: ${tas}kts`);
      console.time('geometry_recompute');
    }

    for (let i = activeLegIdx ?? 0; this.legs.get(i) || this.legs.get(i + 1); i++) {
      if (!this.legs.has(i)) {
        continue;
      }

      const leg = this.legs.get(i);
      const wasNull = leg.isNull;

      this.computeLeg(plan, i, activeLegIdx, ppos, trueTrack, tas, gs);

      // If a leg became null/not null, we immediately recompute it to calculate the new guidables and transitions
      if ((!wasNull && leg.isNull) || (wasNull && !leg.isNull)) {
        this.computeLeg(plan, i, activeLegIdx, ppos, trueTrack, tas, gs);
      }
    }

    if (LnavConfig.DEBUG_GEOMETRY) {
      console.timeEnd('geometry_recompute');
    }
  }

  static getLegPredictedTas(leg: Leg, currentTas: number) {
    return Math.max(LnavConfig.DEFAULT_MIN_PREDICTED_TAS, leg.predictedTas ?? currentTas);
  }

  static getLegPredictedGs(leg: Leg, currentGs: number) {
    return Math.max(LnavConfig.DEFAULT_MIN_PREDICTED_TAS, leg.predictedGs ?? currentGs);
  }

  private computeLeg(
    plan: BaseFlightPlan,
    index: number,
    activeLegIdx: number,
    ppos: Coordinates,
    trueTrack: DegreesTrue,
    tas: Knots,
    gs: Knots,
  ) {
    const prevLeg = this.legs.get(index - 1);
    const leg = this.legs.get(index);
    const nextLeg = this.legs.get(index + 1);
    const nextNextLeg = this.legs.get(index + 2);

    const inboundTransition = this.transitions.get(index - 1);
    const outboundTransition = this.transitions.get(index);

    const legPredictedTas = Geometry.getLegPredictedTas(leg, tas);
    const legPredictedGs = Geometry.getLegPredictedGs(leg, gs);

    // If the leg is null, we compute the following:
    //  - transition from prevLeg to nextLeg
    //  - nextLeg
    //  - transition from nextLeg to nextNextLeg (in order to compute nextLeg)
    if (leg?.isNull) {
      if (nextLeg) {
        let newInboundTransition: Transition;
        if (
          LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE === -1 ||
          index - activeLegIdx < LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE
        ) {
          newInboundTransition = TransitionPicker.forLegs(prevLeg, nextLeg);
        }

        let newOutboundTransition: Transition;
        if (
          (nextNextLeg && LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE === -1) ||
          index + 1 - activeLegIdx < LnavConfig.NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE
        ) {
          newOutboundTransition = TransitionPicker.forLegs(nextLeg, nextNextLeg);
        }

        if (newInboundTransition && prevLeg) {
          const prevLegPredictedLegTas = Geometry.getLegPredictedTas(prevLeg, tas);
          const prevLegPredictedLegGs = Geometry.getLegPredictedGs(prevLeg, gs);

          newInboundTransition.setNeighboringGuidables(prevLeg, nextLeg);
          newInboundTransition.recomputeWithParameters(
            activeLegIdx === index,
            prevLegPredictedLegTas,
            prevLegPredictedLegGs,
            ppos,
            trueTrack,
          );
        }

        const nextLegPredictedLegTas = Geometry.getLegPredictedTas(nextLeg, tas);
        const nextLegPredictedLegGs = Geometry.getLegPredictedGs(nextLeg, gs);

        nextLeg.setNeighboringGuidables(newInboundTransition ?? prevLeg, newOutboundTransition ?? nextNextLeg);
        nextLeg.recomputeWithParameters(
          activeLegIdx === index,
          nextLegPredictedLegTas,
          nextLegPredictedLegGs,
          ppos,
          trueTrack,
        );

        if (newOutboundTransition) {
          newOutboundTransition.setNeighboringGuidables(nextLeg, nextNextLeg);
          newOutboundTransition.recomputeWithParameters(
            activeLegIdx === index + 1,
            nextLegPredictedLegTas,
            nextLegPredictedLegGs,
            ppos,
            trueTrack,
          );

          nextLeg.recomputeWithParameters(
            activeLegIdx === index,
            nextLegPredictedLegTas,
            nextLegPredictedLegGs,
            ppos,
            trueTrack,
          );
        }
      }
    }

    if (inboundTransition && prevLeg) {
      const prevLegPredictedLegTas = Geometry.getLegPredictedTas(prevLeg, tas);
      const prevLegPredictedLegGs = Geometry.getLegPredictedGs(prevLeg, gs);

      inboundTransition.setNeighboringGuidables(prevLeg, leg);
      inboundTransition.setNeighboringLegs(prevLeg, leg);
      inboundTransition.recomputeWithParameters(
        activeLegIdx === index,
        prevLegPredictedLegTas,
        prevLegPredictedLegGs,
        ppos,
        trueTrack,
      );
    }

    // Compute leg and outbound if previous leg isn't null (we already computed 1 leg forward the previous iteration)
    if (!(prevLeg && prevLeg.isNull)) {
      const shouldSkipNextLeg = isCiIfXfSequence(leg, nextLeg, nextNextLeg);
      const chosenOutboundTransition = shouldSkipNextLeg
        ? TransitionPicker.forLegs(leg, nextNextLeg)
        : outboundTransition;
      const chosenNextLeg = shouldSkipNextLeg ? nextNextLeg : nextLeg;

      leg.setNeighboringGuidables(inboundTransition ?? prevLeg, chosenOutboundTransition ?? chosenNextLeg);
      leg.recomputeWithParameters(activeLegIdx === index, legPredictedTas, legPredictedGs, ppos, trueTrack);

      if (chosenOutboundTransition && chosenNextLeg) {
        chosenOutboundTransition.setNeighboringGuidables(leg, chosenNextLeg);
        chosenOutboundTransition.setNeighboringLegs(leg, chosenNextLeg);
        chosenOutboundTransition.recomputeWithParameters(
          activeLegIdx === index + 1,
          legPredictedTas,
          legPredictedGs,
          ppos,
          trueTrack,
        );

        // Since the outbound transition can have TAD, we recompute the leg again to make sure the end point is at the right place for this cycle
        leg.setNeighboringGuidables(inboundTransition ?? prevLeg, chosenOutboundTransition);
        leg.recomputeWithParameters(activeLegIdx === index, legPredictedTas, legPredictedGs, ppos, trueTrack);
      }
    }

    const element = plan.legElementAt(index);

    // Only copy predictions from geometry to calculated if the leg is not using copied predictions (copied from primary to SEC)
    if (element.calculated && !BitFlags.isAll(element.flags, FlightPlanLegFlags.CopiedWithPredictions)) {
      element.calculated.path.length = 0;

      if (inboundTransition) {
        element.calculated.path.push(...inboundTransition.predictedPath);
      }

      element.calculated.path.push(...leg.predictedPath);
    }
  }

  /**
   * @param activeLegIdx
   * @param ppos
   * @param trueTrack
   * @param gs
   * @param tas
   */
  getGuidanceParameters(
    activeLegIdx: number,
    ppos: Coordinates,
    trueTrack: DegreesTrue,
    gs: Knots,
    tas: Knots,
  ): CompletedGuidanceParameters | undefined {
    const activeLeg = this.legs.get(activeLegIdx);
    const nextLeg = this.legs.get(activeLegIdx + 1);

    // TODO handle in guidance controller state
    const autoSequencing = !activeLeg?.disableAutomaticSequencing;

    let activeGuidable: Guidable | null = null;
    let nextGuidable: Guidable | null = null;

    // first, check if we're abeam with one of the transitions (start or end)
    const fromTransition = this.transitions.get(activeLegIdx - 1);
    const toTransition = this.transitions.get(activeLegIdx);
    if (fromTransition && !fromTransition.isNull && fromTransition.isAbeam(ppos)) {
      if (!fromTransition.isFrozen) {
        fromTransition.freeze();
      }

      // Since CA leg CourseCaptureTransition inbound starts at PPOS, we always consider the CA leg as the active guidable
      if (fromTransition instanceof CourseCaptureTransition && activeLeg instanceof CALeg) {
        activeGuidable = activeLeg;
        nextGuidable = toTransition;
      } else {
        activeGuidable = fromTransition;
        nextGuidable = activeLeg;
      }
    } else if (toTransition && !toTransition.isNull && autoSequencing) {
      // TODO need to check that the previous leg is actually flown first...
      if (toTransition.isAbeam(ppos)) {
        if (toTransition instanceof FixedRadiusTransition && !toTransition.isFrozen) {
          toTransition.freeze();
        }

        activeGuidable = toTransition;
        nextGuidable = nextLeg;
      } else if (activeLeg) {
        activeGuidable = activeLeg;
        nextGuidable = toTransition;
      }
    } else if (activeLeg) {
      activeGuidable = activeLeg;
      if (nextLeg && autoSequencing) {
        nextGuidable = nextLeg;
      }
    }

    // figure out guidance params and roll anticipation
    let guidanceParams: CompletedGuidanceParameters;
    let rad;
    let dtg;
    if (activeGuidable) {
      const phiLimit = maxBank(tas, isGuidableCapturingPath(activeGuidable));
      guidanceParams = {
        ...activeGuidable.getGuidanceParameters(ppos, trueTrack, tas, gs),
        phiLimit,
      };
      dtg = activeGuidable.getDistanceToGo(ppos);

      if (activeGuidable && nextGuidable) {
        rad = this.getGuidableRollAnticipationDistance(gs, activeGuidable, nextGuidable);
        if (rad > 0 && dtg <= rad) {
          const nextGuidanceParams = nextGuidable.getGuidanceParameters(ppos, trueTrack, tas, gs);

          if (nextGuidanceParams.law === ControlLaw.LATERAL_PATH) {
            (guidanceParams as LateralPathGuidance).phiCommand = nextGuidanceParams?.phiCommand ?? 0;
          }
        }
      }
    }

    if (LnavConfig.DEBUG_GUIDANCE) {
      this.listener.triggerToAllSubscribers(
        'A32NX_FM_DEBUG_LNAV_STATUS',
        // eslint-disable-next-line prefer-template
        'A32NX FMS LNAV STATUS\n' +
          `XTE ${(guidanceParams as LateralPathGuidance).crossTrackError?.toFixed(3) ?? '(NO DATA)'}\n` +
          `TAE ${(guidanceParams as LateralPathGuidance).trackAngleError?.toFixed(3) ?? '(NO DATA)'}\n` +
          `PHI ${(guidanceParams as LateralPathGuidance).phiCommand?.toFixed(5) ?? '(NO DATA)'}\n` +
          '---\n' +
          `CURR GUIDABLE ${activeGuidable?.repr ?? '---'}\n` +
          `CURR GUIDABLE DTG ${dtg?.toFixed(3) ?? '---'}\n` +
          (activeGuidable instanceof DirectToFixTransition
            ? `DFX STATE ${DirectToFixTransitionGuidanceState[(activeGuidable as DirectToFixTransition).state]}\n`
            : '') +
          '---\n' +
          `RAD GUIDABLE ${nextGuidable?.repr ?? '---'}\n` +
          `RAD DISTANCE ${rad?.toFixed(3) ?? '---'}\n` +
          '---\n' +
          `L0 ${this.legs.get(activeLegIdx - 1)?.repr ?? '---'}\n` +
          `T0 ${this.transitions.get(activeLegIdx - 1)?.repr ?? '---'}\n` +
          `L1 ${this.legs.get(activeLegIdx)?.repr ?? '---'}\n` +
          `T1 ${this.transitions.get(activeLegIdx)?.repr ?? '---'}\n` +
          `L2 ${this.legs.get(activeLegIdx + 1)?.repr ?? '---'}\n`,
      );
    }

    return guidanceParams;
  }

  getGuidableRollAnticipationDistance(gs: Knots, from: Guidable, to: Guidable) {
    if (!from.endsInCircularArc && !to.startsInCircularArc) {
      return 0;
    }

    // get nominal phi from previous and next leg
    const phiNominalFrom = from.endsInCircularArc ? from.getNominalRollAngle(gs) : 0;
    const phiNominalTo = to.startsInCircularArc ? to.getNominalRollAngle(gs) : 0;

    // TODO consider case where RAD > transition distance

    return Geometry.getRollAnticipationDistance(gs, phiNominalFrom, phiNominalTo);
  }

  static getRollAnticipationDistance(gs: Knots, bankA: Degrees, bankB: Degrees): NauticalMiles {
    // calculate delta phi
    const deltaPhi = Math.abs(bankA - bankB);

    // calculate RAD
    const maxRollRate = 5; // deg / s, TODO picked off the wind
    const k2 = 0.0038;
    const rad = ((gs / 3600) * (Math.sqrt(1 + (2 * k2 * 9.81 * deltaPhi) / maxRollRate) - 1)) / (k2 * 9.81);

    return rad;
  }

  getDistanceToGo(activeLegIdx: number, ppos: LatLongAlt): number | null {
    const activeLeg = this.legs.get(activeLegIdx);
    if (activeLeg) {
      return activeLeg.getDistanceToGo(ppos);
    }

    return null;
  }

  shouldSequenceLeg(activeLegIdx: number, ppos: LatLongAlt): boolean {
    const activeLeg = this.legs.get(activeLegIdx);
    const inboundTransition = this.transitions.get(activeLegIdx - 1);

    // Restrict sequencing in cases where we are still in inbound transition. Make an exception for very short legs as the transition could be overshooting.
    if (
      !inboundTransition?.isNull &&
      inboundTransition?.isAbeam(ppos) &&
      (activeLeg.distance > 0.01 || (activeLeg instanceof XFLeg && activeLeg.overshot))
    ) {
      return false;
    }

    const dtg = activeLeg.getDistanceToGo(ppos);

    if (dtg <= 0 || activeLeg.isNull) {
      return true;
    }

    if (activeLeg) {
      return activeLeg.getDistanceToGo(ppos) < 0.001;
    }

    return false;
  }

  onLegSequenced(_sequencedLeg: Leg, nextLeg: Leg, followingLeg: Leg): void {
    if (isCourseReversalLeg(nextLeg) || isCourseReversalLeg(followingLeg)) {
      this.version++;
    }
  }

  legsInSegment(segmentType: SegmentType): Map<number, Leg> {
    const newMap = new Map<number, Leg>();

    for (const entry of this.legs.entries()) {
      if (entry[1].segment === segmentType) {
        newMap.set(...entry);
      }
    }

    return newMap;
  }

  /**
   * Calculate leg distances and cumulative distances for all flight plan legs
   * @param plan the flight plan
   */
  updateDistances(plan: BaseFlightPlan, fromIndex: number, toIndex: number): void {
    let cumulativeDistance = 0;
    let cumulativeDistanceWithTransitions = 0;

    const flightPlanLegs = plan.allLegs;

    // Set calculated distances on downpath leg
    for (let i = fromIndex; i < toIndex; i++) {
      const flightPlanLeg = flightPlanLegs[i];
      const geometryLeg = this.legs.get(i);

      if (i === fromIndex || i === plan.firstMissedApproachLegIndex) {
        this.initializeCalculatedDistances(flightPlanLeg, geometryLeg);
      } else if (flightPlanLeg.isDiscontinuity === true) {
        const directDistance = this.computeDistanceInDiscontinuity(i);

        cumulativeDistance += directDistance;
        cumulativeDistanceWithTransitions += directDistance;
      } else if (!geometryLeg) {
        if (flightPlanLeg.calculated) {
          flightPlanLeg.calculated = undefined;
        }

        if (LnavConfig.DEBUG_GEOMETRY) {
          console.warn(`[FMS/Geometry] No geometry leg found for flight plan leg ${flightPlanLeg.ident}`);
        }
      } else {
        const [distance, distanceWithTransitions] = this.computeLegDistances(
          geometryLeg,
          this.transitions.get(i - 1),
          this.transitions.get(i),
        );

        cumulativeDistance += distance;
        cumulativeDistanceWithTransitions += distanceWithTransitions;

        if (!flightPlanLeg.calculated) {
          this.initializeCalculatedDistances(flightPlanLeg, geometryLeg);
        }

        flightPlanLeg.calculated.distance = distance;
        flightPlanLeg.calculated.distanceWithTransitions = distanceWithTransitions;
        flightPlanLeg.calculated.cumulativeDistance = cumulativeDistance;
        flightPlanLeg.calculated.cumulativeDistanceWithTransitions = cumulativeDistanceWithTransitions;
        flightPlanLeg.calculated.cumulativeDistanceToEnd = undefined;
        flightPlanLeg.calculated.cumulativeDistanceToEndWithTransitions = undefined;

        geometryLeg.calculated = flightPlanLeg.calculated;
      }
    }

    // Iterate again to compute distance to end using using the previously computed total distance
    this.reflowDistancesToEnd(plan, cumulativeDistance, cumulativeDistanceWithTransitions, fromIndex, toIndex);
  }

  private initializeCalculatedDistances(flightPlanLeg: FlightPlanElement, geometryLeg: Leg) {
    if (flightPlanLeg.isDiscontinuity === true) {
      return;
    }

    if (!flightPlanLeg.calculated) {
      flightPlanLeg.calculated = {
        path: [],
        distance: 0,
        distanceWithTransitions: 0,
        cumulativeDistance: 0,
        cumulativeDistanceWithTransitions: 0,
        cumulativeDistanceToEnd: undefined,
        cumulativeDistanceToEndWithTransitions: undefined,
        endsInTooSteepPath: false,
      };
    }
    flightPlanLeg.calculated.distance = 0;
    flightPlanLeg.calculated.distanceWithTransitions = 0;
    flightPlanLeg.calculated.cumulativeDistance = 0;
    flightPlanLeg.calculated.cumulativeDistanceWithTransitions = 0;
    flightPlanLeg.calculated.cumulativeDistanceToEnd = undefined;
    flightPlanLeg.calculated.cumulativeDistanceToEndWithTransitions = undefined;
    flightPlanLeg.calculated.endsInTooSteepPath = false;

    if (geometryLeg) {
      geometryLeg.calculated = flightPlanLeg.calculated;
    }
  }

  private computeLegDistances(
    leg: Leg,
    inboundTransition: Transition,
    outboundTransition: Transition,
  ): [NauticalMiles, NauticalMiles] {
    // If a leg is null, it usually means that it's some computed intercept that the FMS has deemed non-sensical.
    // Ignore it in the distance calculation in this case
    if (leg.isNull) {
      return [0, 0];
    }

    const [inboundDistance, distance, outboundDistance] = Geometry.completeLegPathLengths(
      leg,
      inboundTransition,
      outboundTransition,
    );

    return [distance, distance + inboundDistance + outboundDistance];
  }

  private computeDistanceInDiscontinuity(discoIndex: number): NauticalMiles {
    const previousLeg = this.legs.get(discoIndex - 1);
    const nextLeg = this.legs.get(discoIndex + 1);

    if (nextLeg instanceof IFLeg && previousLeg) {
      if (previousLeg instanceof VMLeg || previousLeg instanceof FMLeg) {
        if (previousLeg.getPathStartPoint()) {
          return distanceTo(previousLeg.getPathStartPoint(), nextLeg.fix.location);
        }
      } else if (previousLeg.getPathEndPoint()) {
        return distanceTo(previousLeg.getPathEndPoint(), nextLeg.fix.location);
      }
    }

    return 0;
  }

  private reflowDistancesToEnd(
    plan: BaseFlightPlan,
    cumulativeDistance: NauticalMiles,
    cumulativeDistanceWithTransitions: NauticalMiles,
    fromIndex: number,
    toIndex: number,
  ) {
    for (let i = fromIndex; i < toIndex; i++) {
      const leg = plan.allLegs[i];
      if (!leg || leg.isDiscontinuity === true || !leg.calculated) {
        continue;
      }

      leg.calculated.cumulativeDistanceToEnd = cumulativeDistance - leg.calculated.cumulativeDistance;
      leg.calculated.cumulativeDistanceToEndWithTransitions =
        cumulativeDistanceWithTransitions - leg.calculated.cumulativeDistanceWithTransitions;
    }
  }

  /**
   * Returns DTG for a complete leg path, taking into account transitions (including split FXR)
   *
   * @param ppos      present position
   * @param leg       the leg guidable
   * @param inbound   the inbound transition guidable, if present
   * @param outbound  the outbound transition guidable, if present
   */
  static completeLegPathDistanceToGo(ppos: LatLongData, leg: Leg, inbound?: Transition, outbound?: Transition) {
    const [, legPartLength, outboundTransLength] = Geometry.completeLegPathLengths(leg, inbound, outbound);

    if (outbound && outbound.isAbeam(ppos)) {
      return outbound.getDistanceToGo(ppos) - outbound.distance / 2; // Remove half of the transition length, since it is split (Type I)
    }

    if (inbound && inbound.isAbeam(ppos)) {
      return inbound.getDistanceToGo(ppos) + legPartLength + outboundTransLength;
    }

    return (
      leg.getDistanceToGo(ppos) -
      (outbound && outbound instanceof FixedRadiusTransition ? outbound.unflownDistance : 0) +
      outboundTransLength
    );
  }

  /**
   * Returns DTG for a complete leg path, taking into account transitions (including split FXR)
   *
   * @param ppos      present position
   * @param leg       the leg guidable
   * @param inbound   the inbound transition guidable, if present
   * @param outbound  the outbound transition guidable, if present
   */
  static completeLegAlongTrackPathDistanceToGo(
    ppos: LatLongData,
    trueTrack: number,
    leg: Leg,
    inbound?: Transition,
    outbound?: Transition,
  ) {
    const [, legPartLength, outboundTransLength] = Geometry.completeLegPathLengths(leg, inbound, outbound);

    if (outbound && outbound.isAbeam(ppos)) {
      return outbound.getAlongTrackDistanceToGo(ppos, trueTrack) - outbound.distance / 2; // Remove half of the transition length, since it is split (Type I)
    }

    if (inbound && inbound.isAbeam(ppos)) {
      return inbound.getAlongTrackDistanceToGo(ppos, trueTrack) + legPartLength + outboundTransLength;
    }

    return (
      leg.getAlongTrackDistanceToGo(ppos, trueTrack) -
      (outbound && outbound instanceof FixedRadiusTransition ? outbound.unflownDistance : 0) +
      outboundTransLength
    );
  }

  /**
   * Returns lengths of the different segments of a leg, taking into account transitions (including split FXR)
   *
   * @param leg       the leg guidable
   * @param inbound   the inbound transition guidable, if present
   * @param outbound  the outbound transition guidable, if present
   */
  static completeLegPathLengths(leg: Leg, inbound?: Transition, outbound?: Transition): [number, number, number] {
    let inboundLength = 0;
    let outboundLength = 0;

    if (outbound) {
      if (outbound instanceof FixedRadiusTransition && !outbound.isReverted) {
        // Type I transitions are split between the prev and next legs
        outboundLength = outbound.distance / 2;
      }
    }

    if (inbound) {
      if (inbound instanceof FixedRadiusTransition && !inbound.isReverted) {
        // Type I transitions are split between the prev and next legs
        inboundLength = inbound.distance / 2;
      } else {
        inboundLength = inbound.distance;
      }
    }

    return [inboundLength, leg.distance, outboundLength];
  }
}
