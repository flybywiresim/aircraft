// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { PathVector } from '@flybywiresim/fbw-sdk';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/new/plans/ReadonlyFlightPlan';

export class FlightPlanUtils {
  public static getAllPathVectorsInFlightPlan(
    plan: ReadonlyFlightPlan,
    activeLegIndex?: number,
    missedApproach = false,
  ) {
    const array: PathVector[] = []; // TODO optim alloc

    for (let i = activeLegIndex; i < (missedApproach ? plan.legCount : plan.firstMissedApproachLegIndex); i++) {
      const element = plan.elementAt(i);

      if (element.isDiscontinuity === true) {
        continue;
      }

      array.push(...(element.calculated?.path ?? []));
    }

    return array;
  }
}
