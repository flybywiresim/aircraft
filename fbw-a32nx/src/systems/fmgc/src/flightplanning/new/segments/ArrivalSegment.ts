// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Arrival, LegType } from '@flybywiresim/fbw-sdk';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { ProcedureSegment } from '@fmgc/flightplanning/new/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { RestringOptions } from '../plans/RestringOptions';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class ArrivalSegment extends ProcedureSegment<Arrival> {
    class = SegmentClass.Arrival

    allLegs: FlightPlanElement[] = []

    public get procedure(): Arrival | undefined {
        return this.arrival;
    }

    private arrival: Arrival | undefined

    async setProcedure(databaseId: string | undefined, skipUpdateLegs?: boolean) {
        const oldArrivalName = this.arrival?.ident;

        if (databaseId === undefined) {
            this.arrival = undefined;

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

        const mappedArrivalLegs = legs.map((leg) => FlightPlanLeg.fromProcedureLeg(this, leg, matchingArrival.ident, WaypointConstraintType.DES));

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

    clone(forPlan: BaseFlightPlan): ArrivalSegment {
        const newSegment = new ArrivalSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.arrival = this.arrival;

        return newSegment;
    }
}
