// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Departure, LegType } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { ProcedureSegment } from '@fmgc/flightplanning/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/data/constraint';
import { RestringOptions } from '../plans/RestringOptions';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class DepartureSegment extends ProcedureSegment<Departure> {
  class = SegmentClass.Departure;

  get procedure() {
    return this.originDeparture;
  }

  // The departure procedure. If undefined, no departure is set. If null, NO SID was explicitly selected.
  private originDeparture: Departure | undefined | null;

  allLegs: FlightPlanLeg[] = [];

  async setProcedure(databaseId: string | undefined | null, skipUpdateLegs?: boolean): Promise<void> {
    if (databaseId === undefined || databaseId === null) {
      this.originDeparture = databaseId === undefined ? undefined : null;

      if (!skipUpdateLegs) {
        this.allLegs.length = 0;
      }

      await this.flightPlan.departureRunwayTransitionSegment.setProcedure(undefined, skipUpdateLegs);
      await this.flightPlan.departureEnrouteTransitionSegment.setProcedure(undefined, skipUpdateLegs);

      if (!skipUpdateLegs) {
        await this.flightPlan.originSegment.refreshOriginLegs();

        this.flightPlan.syncSegmentLegsChange(this);
      }

      return;
    }

    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    if (!this.flightPlan.originAirport) {
      throw new Error('[FMS/FPM] Cannot set departure procedure without origin airport');
    }

    const proceduresAtAirport = await db.getDepartures(this.flightPlan.originAirport.ident);

    if (proceduresAtAirport.length === 0) {
      throw new Error(`[FMS/FPM] Cannot find procedures at ${this.flightPlan.originAirport.ident}`);
    }

    const matchingProcedure = proceduresAtAirport.find((proc) => proc.databaseId === databaseId);

    if (!matchingProcedure) {
      throw new Error(`[FMS/FPM] Can't find procedure '${databaseId}' for ${this.flightPlan.originAirport.ident}`);
    }

    this.originDeparture = matchingProcedure;

    if (skipUpdateLegs) {
      return;
    }

    this.allLegs.length = 0;

    const departureSegmentLegs = matchingProcedure.commonLegs.map((leg) =>
      FlightPlanLeg.fromProcedureLeg(this, leg, matchingProcedure.ident, WaypointConstraintType.CLB),
    );

    const firstDepartureLeg = departureSegmentLegs[0];

    // Add an IF at the start if first leg of the departure is an FX
    if (firstDepartureLeg?.isFX() && !firstDepartureLeg.isRunway()) {
      const newLeg = FlightPlanLeg.fromEnrouteFix(this, firstDepartureLeg.definition.waypoint, undefined, LegType.IF);

      this.allLegs.push(newLeg);
    }

    this.allLegs.push(...departureSegmentLegs);
    this.strung = false;

    await this.flightPlan.departureRunwayTransitionSegment.setProcedure(this.flightPlan.originRunway?.ident);

    this.flightPlan.syncSegmentLegsChange(this);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringDeparture);
    await this.flightPlan.flushOperationQueue();
  }

  clone(forPlan: BaseFlightPlan, options?: number): DepartureSegment {
    const newSegment = new DepartureSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];
    newSegment.originDeparture = this.originDeparture;

    return newSegment;
  }
}
