// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Waypoint } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { FlightPlanSegment, SerializedFlightPlanSegment } from './FlightPlanSegment';

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

  /**
   * Sets the contents of this enroute segment using a serialized flight plan segment.
   *
   * @param serialized the serialized flight plan segment
   */
  setFromSerializedSegment(serialized: SerializedFlightPlanSegment): void {
    this.strung = true;
    this.allLegs = serialized.allLegs.map((it) =>
      it.isDiscontinuity === false ? FlightPlanLeg.deserialize(it, this) : it,
    );
  }
}

export interface EnrouteElement {
  airwayIdent?: string;
  waypoint: Waypoint;
}
