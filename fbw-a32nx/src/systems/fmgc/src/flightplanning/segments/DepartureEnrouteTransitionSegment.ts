// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { LegType, ProcedureTransition } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { ProcedureSegment } from '@fmgc/flightplanning/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { RestringOptions } from '../plans/RestringOptions';

export class DepartureEnrouteTransitionSegment extends ProcedureSegment<ProcedureTransition> {
  class = SegmentClass.Departure;

  allLegs: FlightPlanElement[] = [];

  get procedure() {
    return this.departureEnrouteTransition;
  }

  // The departure enroute transition. If undefined, no departure enroute transition is set. If null, NO TRANS was explicitly selected.
  private departureEnrouteTransition: ProcedureTransition | undefined | null;

  setProcedure(databaseId: string | undefined | null, skipUpdateLegs?: boolean): Promise<void> {
    if (databaseId === undefined || databaseId === null) {
      this.departureEnrouteTransition = databaseId === undefined ? undefined : null;

      if (!skipUpdateLegs) {
        this.allLegs.length = 0;

        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringDeparture);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, this);
      }

      return;
    }

    const { originAirport, originRunway, originDeparture } = this.flightPlan;

    if (!originAirport || !originRunway || !originDeparture) {
      throw new Error('[FMS/FPM] Cannot set origin enroute transition without destination airport, runway and SID');
    }

    const originEnrouteTransitions = originDeparture.enrouteTransitions;

    const matchingOriginEnrouteTransition = originEnrouteTransitions.find(
      (transition) => transition.databaseId === databaseId,
    );

    if (!matchingOriginEnrouteTransition) {
      throw new Error(
        `[FMS/FPM] Can't find origin enroute transition '${databaseId}' for ${originAirport.ident} ${originDeparture.ident}`,
      );
    }

    this.departureEnrouteTransition = matchingOriginEnrouteTransition;

    if (skipUpdateLegs) {
      return;
    }

    this.allLegs.length = 0;

    const mappedOriginEnrouteTransitionLegs = matchingOriginEnrouteTransition.legs.map((leg) =>
      FlightPlanLeg.fromProcedureLeg(this, leg, matchingOriginEnrouteTransition.ident, WaypointConstraintType.CLB),
    );

    const firstDepartureEnrouteTransitionLeg = mappedOriginEnrouteTransitionLegs[0];

    // Add an IF at the start if first leg of the transition is an FX
    if (firstDepartureEnrouteTransitionLeg?.isFX() && !firstDepartureEnrouteTransitionLeg.isRunway()) {
      const newLeg = FlightPlanLeg.fromEnrouteFix(
        this,
        firstDepartureEnrouteTransitionLeg.definition.waypoint,
        undefined,
        LegType.IF,
      );

      this.allLegs.push(newLeg);
    }

    this.allLegs.push(...mappedOriginEnrouteTransitionLegs);
    this.strung = false;

    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringDeparture);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.SyncSegmentLegs, this);
  }

  clone(forPlan: BaseFlightPlan): DepartureEnrouteTransitionSegment {
    const newSegment = new DepartureEnrouteTransitionSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
    newSegment.departureEnrouteTransition = this.departureEnrouteTransition;

    return newSegment;
  }
}
