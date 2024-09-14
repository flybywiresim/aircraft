// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LegType, ProcedureTransition } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { RestringOptions } from '../plans/RestringOptions';

export class ArrivalRunwayTransitionSegment extends ProcedureSegment<ProcedureTransition> {
  class = SegmentClass.Arrival;

  allLegs: FlightPlanElement[] = [];

  public get procedure(): ProcedureTransition | undefined {
    return this.arrivalRunwayTransition;
  }

  private arrivalRunwayTransition: ProcedureTransition | undefined = undefined;

  async setProcedure(runwayIdent: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
    const existingArrival = this.flightPlan.arrival;

    if (existingArrival) {
      const matchingTransition =
        runwayIdent !== undefined
          ? existingArrival.runwayTransitions.find((it) => it.ident === runwayIdent)
          : undefined;

      this.arrivalRunwayTransition = matchingTransition;
    } else {
      this.arrivalRunwayTransition = undefined;
    }

    if (!skipUpdateLegs) {
      const legs =
        this.arrivalRunwayTransition?.legs.map((it) =>
          FlightPlanLeg.fromProcedureLeg(this, it, existingArrival?.ident ?? '', WaypointConstraintType.DES),
        ) ?? [];

      const firstArrivalRunwayTransitionLeg = legs[0];

      // Add an IF at the start if first leg of the transition is an FX
      if (firstArrivalRunwayTransitionLeg?.isFX()) {
        const newLeg = FlightPlanLeg.fromEnrouteFix(
          this,
          firstArrivalRunwayTransitionLeg.definition.waypoint,
          undefined,
          LegType.IF,
        );

        this.allLegs.push(newLeg);
      }

      this.allLegs.length = 0;
      this.allLegs.push(...legs);
      this.strung = false;

      this.flightPlan.syncSegmentLegsChange(this);

      this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
      this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
    }
  }

  clone(forPlan: BaseFlightPlan, options?: number): ArrivalRunwayTransitionSegment {
    const newSegment = new ArrivalRunwayTransitionSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];
    newSegment.arrivalRunwayTransition = this.arrivalRunwayTransition;

    return newSegment;
  }
}
