// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Waypoint } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { FlightPlanSegment } from './FlightPlanSegment';

export class EnrouteSegment extends FlightPlanSegment {
  class = SegmentClass.Enroute;

  allLegs: FlightPlanElement[] = [];

  isSequencedMissedApproach = false;

  insertLeg(leg: FlightPlanLeg) {
    this.allLegs.push(leg);
  }

  insertLegs(...elements: FlightPlanLeg[]) {
    this.allLegs.push(...elements);
  }

  clone(forPlan: BaseFlightPlan, options?: number): EnrouteSegment {
    const newSegment = new EnrouteSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];

    return newSegment;
  }
}

export interface EnrouteElement {
  airwayIdent?: string;
  waypoint: Waypoint;
}
