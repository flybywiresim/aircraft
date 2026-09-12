// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LegType, PathVector } from '@flybywiresim/fbw-sdk';
import { ReadonlyFlightPlan } from './plans/ReadonlyFlightPlan';
import { ReadonlyFlightPlanElement, ReadonlyFlightPlanLeg } from './legs/ReadonlyFlightPlanLeg';

export class FlightPlanUtils {
  public static getAllPathVectorsInFlightPlan(
    plan: ReadonlyFlightPlan,
    activeLegIndex?: number,
    missedApproach = false,
  ) {
    const array: PathVector[] = []; // TODO optim alloc

    const start = missedApproach
      ? Math.max(plan.activeLegIndex, plan.firstMissedApproachLegIndex)
      : plan.activeLegIndex;
    const end = missedApproach ? plan.legCount : plan.firstMissedApproachLegIndex;

    for (let i = start; i < end; i++) {
      const element = plan.elementAt(i);

      if (element.isDiscontinuity === true) {
        continue;
      }

      if (FlightPlanUtils.isCourseReversal(element) && i > plan.activeLegIndex + 1) {
        continue;
      }

      array.push(...(element.calculated?.path ?? []));
    }

    return array;
  }

  private static isCourseReversal(leg: ReadonlyFlightPlanLeg): boolean {
    switch (leg.type) {
      case LegType.HA:
      case LegType.HF:
      case LegType.HM:
      case LegType.PI:
        return true;
      default:
        return false;
    }
  }

  public static getEngineOutVectorsInFlightPlan(plan: ReadonlyFlightPlan, out: PathVector[]): PathVector[] {
    let vectorCount = 0;

    // We assume here that the plan legs and eosid legs are identical up to the branch.
    // The flight plan should reset the EOSID if any legs prior to the branch are edited
    // to preserve this invariant.
    const eosidLegs = plan.getEngineOutDepartureLegs();
    const planLegs = plan.allLegs;
    const branchIndex = planLegs.findIndex((leg) => leg.isDiscontinuity === false && leg.definition.isEngineOutBranch);

    if (branchIndex < 0) {
      out.length = 0;
      return out;
    }

    for (let i = branchIndex + 1; i < eosidLegs.length; i++) {
      const leg = eosidLegs[i];
      if (leg.isDiscontinuity === true || !leg.calculated || FlightPlanUtils.isCourseReversal(leg)) {
        continue;
      }

      for (let j = 0; j < leg.calculated.path.length; j++) {
        out[vectorCount++] = leg.calculated.path[j];
      }
    }

    out.length = vectorCount;

    return out;
  }

  /**
   * Checks if two flight plan elements are the same, meaning they are either both discontinuities, or have the same UUID.
   *
   * A leg shared a UUID with another leg if one was created during a clone of the other.
   *
   * @param a the first element
   * @param b the second element
   */
  public static areFlightPlanElementsSame(a: ReadonlyFlightPlanElement, b: ReadonlyFlightPlanElement) {
    if (a.isDiscontinuity === true && b.isDiscontinuity === true) {
      return true;
    }

    return a.isDiscontinuity === false && b.isDiscontinuity === false && a.uuid === b.uuid;
  }
}
