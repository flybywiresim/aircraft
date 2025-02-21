// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { LegType, ProcedureTransition, WaypointConstraintType } from '@flybywiresim/fbw-sdk';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/segments/ProcedureSegment';
import { RestringOptions } from '../plans/RestringOptions';

export class DepartureRunwayTransitionSegment extends ProcedureSegment<ProcedureTransition> {
  class = SegmentClass.Departure;

  allLegs: FlightPlanElement[] = [];

  get procedure(): ProcedureTransition | undefined {
    return this.departureRunwayTransition;
  }

  private departureRunwayTransition: ProcedureTransition | undefined = undefined;

  async setProcedure(runwayIdent: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
    const existingDeparture = this.flightPlan.originDeparture;

    if (existingDeparture) {
      const matchingTransition =
        runwayIdent !== undefined
          ? existingDeparture.runwayTransitions.find((it) => it.ident === runwayIdent)
          : undefined;

      this.departureRunwayTransition = matchingTransition;
    } else {
      this.departureRunwayTransition = undefined;
    }

    if (!skipUpdateLegs) {
      const legs =
        this.departureRunwayTransition?.legs.map((it) =>
          FlightPlanLeg.fromProcedureLeg(this, it, existingDeparture?.ident ?? '', WaypointConstraintType.CLB),
        ) ?? [];

      const firstDepartureRunwayTransitionLeg = legs[0];

      // Add an IF at the start if first leg of the transition is an FX
      if (firstDepartureRunwayTransitionLeg?.isFX() && !firstDepartureRunwayTransitionLeg.isRunway()) {
        const newLeg = FlightPlanLeg.fromEnrouteFix(
          this,
          firstDepartureRunwayTransitionLeg.definition.waypoint,
          undefined,
          LegType.IF,
        );

        this.allLegs.push(newLeg);
      }

      this.allLegs.length = 0;
      this.allLegs.push(...legs);
      this.strung = false;

      await this.flightPlan.originSegment.refreshOriginLegs();

      this.flightPlan.syncSegmentLegsChange(this);
      this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringDeparture);
    }
  }

  clone(forPlan: BaseFlightPlan): DepartureRunwayTransitionSegment {
    const newSegment = new DepartureRunwayTransitionSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
    newSegment.departureRunwayTransition = this.departureRunwayTransition;

    return newSegment;
  }
}
