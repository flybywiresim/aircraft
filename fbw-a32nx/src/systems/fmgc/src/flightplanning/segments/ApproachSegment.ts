// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Approach,
  Runway,
  ApproachUtils,
  LegType,
  areDatabaseItemsEqual,
  WaypointConstraintType,
} from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/segments/ProcedureSegment';
import { RestringOptions } from '../plans/RestringOptions';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class ApproachSegment extends ProcedureSegment<Approach> {
  class = SegmentClass.Arrival;

  allLegs: FlightPlanElement[] = [];

  get procedure(): Approach | undefined {
    return this.approach;
  }

  private approach: Approach | undefined;

  async setProcedure(databaseId: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
    const oldApproachName = this.flightPlan.approach?.ident;

    const db = NavigationDatabaseService.activeDatabase.backendDatabase;

    if (databaseId === undefined) {
      this.approach = undefined;

      if (!skipUpdateLegs) {
        await this.flightPlan.approachViaSegment.setProcedure(undefined);
        await this.flightPlan.arrivalSegment.setProcedure(undefined);

        this.flightPlan.missedApproachSegment.setMissedApproachLegs([]);
        this.allLegs = this.createLegSet(undefined, []);

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
      }

      return;
    }

    const { destinationAirport } = this.flightPlan.destinationSegment;

    if (!destinationAirport) {
      throw new Error('[FMS/FPM] Cannot set approach without destination airport');
    }

    const approaches = await db.getApproaches(destinationAirport.ident);

    const matchingProcedure = approaches.find((approach) => approach.databaseId === databaseId);

    if (!matchingProcedure) {
      throw new Error(`[FMS/FPM] Can't find approach procedure '${databaseId}' for ${destinationAirport.ident}`);
    }

    this.approach = matchingProcedure;

    if (skipUpdateLegs) {
      return;
    }

    const shortApproachName = ApproachUtils.shortApproachName(matchingProcedure);

    this.allLegs = this.createLegSet(
      matchingProcedure,
      matchingProcedure.legs.map((leg) =>
        FlightPlanLeg.fromProcedureLeg(this, leg, shortApproachName, WaypointConstraintType.DES),
      ),
    );
    this.strung = false;

    // Set plan destination runway

    const procedureRunwayIdent = matchingProcedure.runwayIdent;

    if (procedureRunwayIdent) {
      // TODO temporary workaround for bug in msfs backend
      await this.flightPlan.destinationSegment.setDestinationRunway(procedureRunwayIdent, true);
    }

    const mappedMissedApproachLegs = matchingProcedure.missedLegs.map((leg) =>
      FlightPlanLeg.fromProcedureLeg(
        this.flightPlan.missedApproachSegment,
        leg,
        shortApproachName,
        WaypointConstraintType.CLB,
      ),
    );
    this.flightPlan.missedApproachSegment.setMissedApproachLegs(mappedMissedApproachLegs);

    if (oldApproachName !== matchingProcedure.ident) {
      // Clear flight plan approach VIA and arrival if the new approach is different
      await this.flightPlan.approachViaSegment.setProcedure(undefined);
      await this.flightPlan.arrivalSegment.setProcedure(undefined);
    }

    this.flightPlan.availableApproachVias = matchingProcedure.transitions;

    this.flightPlan.syncSegmentLegsChange(this);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.RebuildArrivalAndApproach);
    this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringArrival);
  }

  private createLegSet(procedure: Approach | undefined, approachLegs: FlightPlanElement[]): FlightPlanElement[] {
    const legs = [];

    const airport = this.flightPlan.destinationAirport;
    const runway = this.flightPlan.destinationRunway;

    const shortApproachName = procedure ? ApproachUtils.shortApproachName(procedure) : '';

    if (
      approachLegs.length === 0 &&
      this.flightPlan.destinationAirport &&
      this.flightPlan.destinationSegment.destinationRunway
    ) {
      const cf = FlightPlanLeg.destinationExtendedCenterline(this, runway);

      legs.push(cf);
      legs.push(FlightPlanLeg.fromAirportAndRunway(this, shortApproachName, airport, runway));
    } else {
      const firstApproachLeg = approachLegs[0];

      // Add an IF at the start if first leg of the approach is an FX
      if (firstApproachLeg && firstApproachLeg.isDiscontinuity === false && firstApproachLeg.isFX()) {
        const newLeg = FlightPlanLeg.fromEnrouteFix(this, firstApproachLeg.definition.waypoint, undefined, LegType.IF);

        legs.push(newLeg);
      }

      const lastLeg = approachLegs[approachLegs.length - 1];
      const lastLegIsRunway =
        lastLeg && lastLeg.isDiscontinuity === false && areDatabaseItemsEqual(lastLeg.terminationWaypoint(), runway);

      if (lastLegIsRunway) {
        legs.push(...approachLegs.slice(0, approachLegs.length - 1));

        const runway = this.findRunwayFromRunwayLeg(lastLeg);
        const mappedLeg = FlightPlanLeg.fromAirportAndRunway(this, shortApproachName, airport, runway);

        if (approachLegs.length > 1) {
          mappedLeg.type = lastLeg.type;
          Object.assign(mappedLeg.definition, lastLeg.definition);
        }

        legs.push(mappedLeg);
      } else {
        legs.push(...approachLegs);
      }
    }

    return legs;
  }

  private findRunwayFromRunwayLeg(leg: FlightPlanLeg): Runway | undefined {
    return this.flightPlan.availableDestinationRunways.find((it) =>
      areDatabaseItemsEqual(leg.terminationWaypoint(), it),
    );
  }

  clone(forPlan: BaseFlightPlan): ApproachSegment {
    const newSegment = new ApproachSegment(forPlan);

    newSegment.strung = this.strung;
    newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
    newSegment.approach = this.approach;

    return newSegment;
  }
}
