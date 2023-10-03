// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Departure } from 'msfs-navdata';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { ProcedureSegment } from '@fmgc/flightplanning/new/segments/ProcedureSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class DepartureSegment extends ProcedureSegment<Departure> {
    class = SegmentClass.Departure

    get procedure(): Departure | undefined {
        return this.originDeparture;
    }

    originDeparture: Departure

    allLegs: FlightPlanLeg[] = []

    async setProcedure(ident: string | undefined, skipUpdateLegs?: boolean): Promise<void> {
        if (ident === undefined) {
            this.originDeparture = undefined;

            if (!skipUpdateLegs) {
                this.allLegs.length = 0;
            }

            await this.flightPlan.departureRunwayTransitionSegment.setProcedure(undefined);
            await this.flightPlan.setDepartureEnrouteTransition(undefined);
            await this.flightPlan.originSegment.refreshOriginLegs();

            this.flightPlan.syncSegmentLegsChange(this);
            return;
        }

        const db = NavigationDatabaseService.activeDatabase.backendDatabase;

        if (!this.flightPlan.originAirport || !this.flightPlan.originRunway) {
            throw new Error('[FMS/FPM] Cannot set departure procedure without origin airport and runway');
        }

        const proceduresAtAirport = await db.getDepartures(this.flightPlan.originAirport.ident);

        if (proceduresAtAirport.length === 0) {
            throw new Error(`[FMS/FPM] Cannot find procedures at ${this.flightPlan.originAirport.ident}`);
        }

        const matchingProcedure = proceduresAtAirport.find((proc) => proc.ident === ident);

        if (!matchingProcedure) {
            throw new Error(`[FMS/FPM] Can't find procedure '${ident}' for ${this.flightPlan.originAirport.ident}`);
        }

        this.originDeparture = matchingProcedure;

        if (skipUpdateLegs) {
            return;
        }

        this.allLegs = matchingProcedure.commonLegs.map((leg) => FlightPlanLeg.fromProcedureLeg(this, leg, matchingProcedure.ident, WaypointConstraintType.CLB));
        this.strung = false;

        await this.flightPlan.departureRunwayTransitionSegment.setProcedure(this.flightPlan.originRunway.ident);

        this.flightPlan.syncSegmentLegsChange(this);
        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring);
    }

    clone(forPlan: BaseFlightPlan): DepartureSegment {
        const newSegment = new DepartureSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.originDeparture = this.originDeparture;

        return newSegment;
    }
}
