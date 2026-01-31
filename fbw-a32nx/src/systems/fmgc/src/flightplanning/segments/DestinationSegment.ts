// Copyright (c) 2021-2026 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Runway } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { loadAllApproaches, loadAllArrivals, loadAllRunways } from '@fmgc/flightplanning/DataLoading';
import { RestringOptions } from '@fmgc/flightplanning/plans/RestringOptions';
import { NavigationDatabaseService } from '../NavigationDatabaseService';
import { TerminalSegment } from '@fmgc/flightplanning/segments/TerminalSegment';
import { FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/FlightPlanQueuedOperation';

export class DestinationSegment extends TerminalSegment {
  class = SegmentClass.Arrival;

  allLegs: FlightPlanElement[] = [];

  protected airport: Airport | undefined;

  protected runway: Runway | undefined;

  public get destinationAirport() {
    return this.airport;
  }

  public async setAirport(icao: string | undefined, skipUpdateLegs?: boolean) {
    if (icao === undefined) {
      this.airport = undefined;
      this.runway = undefined;

      if (!skipUpdateLegs) {
        await this.refresh();
      }
      return;
    }

    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    const airports = await db.getAirports([icao]);
    const airport = airports.find((a) => a.ident === icao);

    if (!airport) {
      throw new Error(`[FMS/FPM] Can't find airport with ICAO '${icao}'`);
    }

    this.airport = airport;

    this.flightPlan.availableDestinationRunways = await loadAllRunways(this.airport);

    // TODO do we clear arrival/via/approach ...?
    if (!skipUpdateLegs) {
      await this.refresh();
    }

    this.flightPlan.availableArrivals = await loadAllArrivals(this.destinationAirport);
    this.flightPlan.availableApproaches = await loadAllApproaches(this.destinationAirport);
  }

  public get destinationRunway() {
    return this.runway;
  }

  public async setRunway(runwayIdent: string | undefined, setByApproach = false, skipUpdateLegs = false) {
    const oldRunwayIdent = this.runway?.ident;

    if (runwayIdent === undefined) {
      this.runway = undefined;

      if (!skipUpdateLegs) {
        await this.flightPlan.arrivalRunwayTransitionSegment.setProcedure(undefined);
      }
    } else {
      if (!this.airport) {
        throw new Error('[FMS/FPM] Cannot set destination runway without destination airport');
      }

      const db = NavigationDatabaseService.activeDatabase.backendDatabase;
      const runways = await db.getRunways(this.airport.ident);

      const matchingRunway = runways.find((runway) => runway.ident === runwayIdent);

      if (!matchingRunway) {
        throw new Error(`[FMS/FPM] Can't find runway '${runwayIdent}' at ${this.airport.ident}`);
      }

      this.runway = matchingRunway;

      if (!skipUpdateLegs) {
        await this.flightPlan.arrivalRunwayTransitionSegment.setProcedure(matchingRunway.ident);
      }
    }

    if (!skipUpdateLegs) {
      await this.refresh(oldRunwayIdent !== this.runway?.ident && !setByApproach);
    }
  }

  async refresh(doRemoveApproach = true) {
    this.allLegs.length = 0;

    const { approachSegment } = this.flightPlan;

    // We remove the approach if the runway ident changed and the runway was not set by the approach
    if (doRemoveApproach) {
      await approachSegment.setProcedure(undefined);
    }

    if (this.airport && approachSegment.allLegs.length === 0) {
      this.allLegs.push(FlightPlanLeg.fromAirportAndRunway(this, '', this.airport));
    } else {
      this.allLegs.length = 0;
    }

    this.flightPlan.availableApproaches = await loadAllApproaches(this.destinationAirport);

    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
    this.flightPlan.syncSegmentLegsChange(this);
  }

  clone(forPlan: BaseFlightPlan, options?: number): DestinationSegment {
    const newSegment = new DestinationSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [
      ...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment, options) : it)),
    ];
    newSegment.airport = this.airport;
    newSegment.runway = this.runway;

    return newSegment;
  }
}
