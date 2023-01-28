// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Runway } from 'msfs-navdata';
import { FlightPlanElement, FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { loadAllApproaches, loadAllArrivals, loadAllRunways } from '@fmgc/flightplanning/new/DataLoading';
import { FlightPlanSegment } from './FlightPlanSegment';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class DestinationSegment extends FlightPlanSegment {
    class = SegmentClass.Arrival

    allLegs: FlightPlanElement[] = []

    private airport: Airport;

    public get destinationAirport() {
        return this.airport;
    }

    public async setDestinationIcao(icao: string | undefined) {
        if (icao === undefined) {
            this.airport = undefined;
            this.runway = undefined;

            await this.refresh();
            return;
        }

        const db = NavigationDatabaseService.activeDatabase.backendDatabase;

        const airports = await db.getAirports([icao]);
        const airport = airports.find((a) => a.ident === icao);

        if (!airport) {
            throw new Error(`[FMS/FPM] Can't find airport with ICAO '${icao}'`);
        }

        this.airport = airport;

        this.flightPlan.availableDestinationRunways = await loadAllRunways(this.destinationAirport);

        // TODO do we clear arrival/via/approach ...?
        await this.refresh();

        this.flightPlan.availableArrivals = await loadAllArrivals(this.destinationAirport);
        this.flightPlan.availableApproaches = await loadAllApproaches(this.destinationAirport);
    }

    private runway?: Runway;

    public get destinationRunway() {
        return this.runway;
    }

    public async setDestinationRunway(runwayIdent: string, setByApproach = false) {
        const db = NavigationDatabaseService.activeDatabase.backendDatabase;

        if (!this.airport) {
            throw new Error('[FMS/FPM] Cannot set destination runway without destination airport');
        }

        const runways = await db.getRunways(this.airport.ident);

        const matchingRunway = runways.find((runway) => runway.ident === runwayIdent);

        if (!matchingRunway) {
            throw new Error(`[FMS/FPM] Can't find runway '${runwayIdent}' at ${this.airport.ident}`);
        }

        const oldRunwayIdent = this.runway?.ident;

        this.runway = matchingRunway;

        await this.refresh(oldRunwayIdent !== this.runway?.ident && !setByApproach);
    }

    async refresh(doRemoveApproach = true) {
        this.allLegs.length = 0;

        const { approachSegment } = this.flightPlan;

        // We remove the approach if the runway ident changed and the runway was not set by the approach
        if (doRemoveApproach) {
            await approachSegment.setApproachProcedure(undefined);
        }

        if (this.airport && approachSegment.allLegs.length === 0) {
            this.allLegs.push(FlightPlanLeg.fromAirportAndRunway(this, '', this.airport));
        } else {
            this.allLegs.length = 0;
        }

        this.flightPlan.availableApproaches = await loadAllApproaches(this.destinationAirport);

        this.flightPlan.syncSegmentLegsChange(this);
    }

    clone(forPlan: BaseFlightPlan): DestinationSegment {
        const newSegment = new DestinationSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.airport = this.airport;
        newSegment.runway = this.runway;

        return newSegment;
    }
}
