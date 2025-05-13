// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { FlightPlanElement } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';

export class MissedApproachSegment extends FlightPlanSegment {
  class = SegmentClass.Arrival;

  allLegs: FlightPlanElement[] = [];

  setMissedApproachLegs(legs: FlightPlanElement[]) {
    this.allLegs.length = 0;
    this.allLegs.push(...legs);

    this.flightPlan.syncSegmentLegsChange(this);
  }

  clone(forPlan: BaseFlightPlan, options?: number): MissedApproachSegment {
    const newSegment = new MissedApproachSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];

    return newSegment;
  }
}
