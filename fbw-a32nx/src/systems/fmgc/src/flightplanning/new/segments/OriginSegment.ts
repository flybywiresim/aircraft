// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Runway } from 'msfs-navdata';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { loadAirport, loadAllDepartures, loadAllRunways, loadRunway } from '@fmgc/flightplanning/new/DataLoading';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { FlightPlanElement, FlightPlanLeg } from '../legs/FlightPlanLeg';
import { NavigationDatabaseService } from '../NavigationDatabaseService';

export class OriginSegment extends FlightPlanSegment {
    class = SegmentClass.Departure

    allLegs: FlightPlanElement[] = []

    protected airport: Airport;

    public runway?: Runway;

    get originAirport() {
        return this.airport;
    }

    public async setOriginIcao(icao: string) {
        this.airport = await loadAirport(icao);

        await this.refreshOriginLegs();

        this.flightPlan.availableOriginRunways = await loadAllRunways(this.originAirport);
        this.flightPlan.availableDepartures = await loadAllDepartures(this.originAirport);
    }

    get originRunway() {
        return this.runway;
    }

    public async setOriginRunway(runwayIdent: string | undefined) {
        if (!this.originAirport) {
            throw new Error('[FMS/FPM] Cannot set origin runway with no origin airport');
        }

        if (runwayIdent === undefined) {
            this.runway = undefined;
            await this.refreshOriginLegs();
            return;
        }

        this.runway = await loadRunway(this.originAirport, runwayIdent);

        await this.refreshOriginLegs();

        this.insertNecessaryDiscontinuities();
    }

    async refreshOriginLegs() {
        const db = NavigationDatabaseService.activeDatabase.backendDatabase;

        this.allLegs.length = 0;
        this.allLegs.push(FlightPlanLeg.fromAirportAndRunway(this, this.flightPlan.departureSegment.originDeparture?.ident ?? '', this.originAirport, this.runway));

        if (this.runway) {
            const newRunwayCompatibleSids = await db.getDepartures(this.runway.airportIdent, this.runway.ident);

            const currentSidCompatibleWithNewRunway = newRunwayCompatibleSids.some((departure) => departure.ident === this.flightPlan.originDeparture?.ident);

            if (currentSidCompatibleWithNewRunway) {
                const currentSidNewRunwayTransition = this.flightPlan.originDeparture.runwayTransitions.find((transition) => transition.ident === this.runway.ident);

                if (currentSidNewRunwayTransition && this.flightPlan.departureRunwayTransition.ident !== currentSidNewRunwayTransition.ident) {
                    const mappedTransitionLegs = currentSidNewRunwayTransition.legs.map((leg) => FlightPlanLeg.fromProcedureLeg(this, leg, this.flightPlan.originDeparture.ident));

                    await this.flightPlan.departureRunwayTransitionSegment.setOriginRunwayTransitionSegment(currentSidNewRunwayTransition, mappedTransitionLegs);

                    this.strung = true;
                }
            } else {
                const runwayLeg = this.allLegs[this.allLegs.length - 1];

                if (runwayLeg.isDiscontinuity === true) {
                    throw new Error('[FMS/FPM] Runway leg was discontinuity');
                }

                this.allLegs.push(FlightPlanLeg.originExtendedCenterline(this, runwayLeg));
                this.allLegs.push({ isDiscontinuity: true });
            }

            this.flightPlan.availableDepartures = newRunwayCompatibleSids;
        } else {
            this.allLegs.push({ isDiscontinuity: true });
        }

        this.flightPlan.syncSegmentLegsChange(this);
    }

    clone(forPlan: BaseFlightPlan): OriginSegment {
        const newSegment = new OriginSegment(forPlan);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.airport = this.airport;
        newSegment.runway = this.runway;

        return newSegment;
    }
}
