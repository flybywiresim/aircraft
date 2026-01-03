// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { PathVector } from '@flybywiresim/fbw-sdk';
import { ReadonlyFlightPlan } from './plans/ReadonlyFlightPlan';
import { ReadonlyFlightPlanElement } from './legs/ReadonlyFlightPlanLeg';
import { LnavConfig } from '../guidance/LnavConfig';

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

    for (let index = start; index < end; index++) {
      const element = plan.elementAt(index);

      if (element.isDiscontinuity === true) {
        continue;
      }

      const transmitCourseReversal =
        LnavConfig.DEBUG_FORCE_INCLUDE_COURSE_REVERSAL_VECTORS ||
        (activeLegIndex !== undefined && (index === activeLegIndex || index === activeLegIndex + 1));

      if (element.isCourseReversal() && !transmitCourseReversal) {
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
