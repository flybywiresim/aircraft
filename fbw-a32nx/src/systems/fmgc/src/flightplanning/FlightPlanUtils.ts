// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { PathVector } from '@flybywiresim/fbw-sdk';
import { ReadonlyFlightPlan } from './plans/ReadonlyFlightPlan';
import { ReadonlyFlightPlanElement } from './legs/ReadonlyFlightPlanLeg';

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

      array.push(...(element.calculated?.path ?? []));
    }

    return array;
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
