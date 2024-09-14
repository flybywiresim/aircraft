// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Arrival, LegType } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { RestringOptions } from '../plans/RestringOptions';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class ArrivalSegment extends ProcedureSegment<Arrival> {
  class = SegmentClass.Arrival;

  allLegs: FlightPlanElement[] = [];

  public get procedure() {
    return this.arrival;
  }

  /**
   * The arrival procedure. If it's `undefined`, it means that no arrival is set. If it's `null`, it means that the "NO STAR" is explicitly selected.
   */
  private arrival: Arrival | undefined | null;

  async setProcedure(databaseId: string | undefined | null, skipUpdateLegs?: boolean) {
    const oldArrivalName = this.arrival?.ident;

    if (databaseId === undefined || databaseId === null) {
      this.arrival = databaseId === undefined ? undefined : null;

      if (!skipUpdateLegs) {
        this.allLegs.length = 0;

        // We don't have to await any of this because of how we use it, but this might be something to clean up in the future

        this.flightPlan.arrivalEnrouteTransitionSegment.setProcedure(undefined);
        this.flightPlan.arrivalRunwayTransitionSegment.setProcedure(undefined);

        this.flightPlan.syncSegmentLegsChange(this);
      }

      return;
    }

    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const { destinationAirport, destinationRunway } = this.flightPlan.destinationSegment;

    if (!destinationAirport) {
      throw new Error('[FMS/FPM] Cannot set approach without destination airport');
    }

    const arrivals = await db.getArrivals(destinationAirport.ident);

    const matchingArrival = arrivals.find((arrival) => arrival.databaseId === databaseId);

    if (!matchingArrival) {
      throw new Error(`[FMS/FPM] Can't find arrival procedure '${databaseId}' for ${destinationAirport.ident}`);
    }

    if (skipUpdateLegs) {
      return;
    }

    const legs = [...matchingArrival.commonLegs];

    this.arrival = matchingArrival;
    this.allLegs.length = 0;
    this.strung = false;

    if (oldArrivalName !== matchingArrival.ident) {
      // Clear enroute transition if arrival is different
      this.flightPlan.arrivalEnrouteTransitionSegment.setProcedure(undefined);
    }

    const mappedArrivalLegs = legs.map((leg) =>
      FlightPlanLeg.fromProcedureLeg(this, leg, matchingArrival.ident, WaypointConstraintType.DES),
    );

    const firstArrivalLeg = mappedArrivalLegs[0];

    // Add an IF at the start if first leg of the arrival is an XF
    if (firstArrivalLeg?.isFX()) {
      const newLeg = FlightPlanLeg.fromEnrouteFix(this, firstArrivalLeg.definition.waypoint, undefined, LegType.IF);

      this.allLegs.push(newLeg);
    }

    this.allLegs.push(...mappedArrivalLegs);

    await this.flightPlan.arrivalRunwayTransitionSegment.setProcedure(destinationRunway?.ident);

    this.flightPlan.syncSegmentLegsChange(this);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
  }

  clone(forPlan: BaseFlightPlan, options?: number): ArrivalSegment {
    const newSegment = new ArrivalSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];
    newSegment.arrival = this.arrival;

    return newSegment;
  }
}
