// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Runway, MathUtils, areDatabaseItemsEqual } from '@flybywiresim/fbw-sdk';
import { FlightPlanSegment, SerializedFlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { loadAirport, loadAllDepartures, loadAllRunways, loadRunway } from '@fmgc/flightplanning/new/DataLoading';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { BaseFlightPlan, FlightPlanQueuedOperation } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { bearingTo } from 'msfs-geo';
import { airportRunwayIdent } from '@fmgc/flightplanning/new/legs/FlightPlanLegNaming';
import { RestringOptions } from '../plans/RestringOptions';
import { FlightPlanElement, FlightPlanLeg, FlightPlanLegFlags } from '../legs/FlightPlanLeg';
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

    private resetOriginLegFlag() {
        this.allLegs.forEach((leg) => {
            if (leg.isDiscontinuity === false) {
                leg.flags &= ~FlightPlanLegFlags.Origin;
            }
        });

        // Do the same for the departure runway transition segment
        this.flightPlan.departureRunwayTransitionSegment?.allLegs?.forEach((leg) => {
            if (leg.isDiscontinuity === false) {
                leg.flags &= ~FlightPlanLegFlags.Origin;
            }
        });

        // Do the same for the departure transition segment
        this.flightPlan.departureSegment?.allLegs?.forEach((leg) => {
            if (leg.isDiscontinuity === false) {
                leg.flags &= ~FlightPlanLegFlags.Origin;
            }
        });

        // Do the same for the departure enroute transition segment
        this.flightPlan.departureEnrouteTransitionSegment?.allLegs?.forEach((leg) => {
            if (leg.isDiscontinuity === false) {
                leg.flags &= ~FlightPlanLegFlags.Origin;
            }
        });
    }

    async refreshOriginLegs() {
        const db = NavigationDatabaseService.activeDatabase.backendDatabase;

        this.resetOriginLegFlag();

        let addOriginLeg = true;
        let addRunwayLeg = true;
        if (this.runway && this.flightPlan.originDeparture) {
            let firstDepartureLeg: FlightPlanElement;
            if (this.flightPlan.departureRunwayTransitionSegment.allLegs.length > 0) {
                firstDepartureLeg = this.flightPlan.departureRunwayTransitionSegment.allLegs[0];
            } else if (this.flightPlan.departureSegment.allLegs.length > 0) {
                firstDepartureLeg = this.flightPlan.departureSegment.allLegs[0];
            } else {
                firstDepartureLeg = this.flightPlan.departureEnrouteTransitionSegment.allLegs[0];
            }

            if (firstDepartureLeg?.isDiscontinuity === false && firstDepartureLeg.isXF()) {
                if (areDatabaseItemsEqual(firstDepartureLeg.terminationWaypoint(), this.runway)) {
                    // TODO should this stuff go into DepartureRunwayTransitionSegment?
                    firstDepartureLeg.flags |= FlightPlanLegFlags.Origin;
                    firstDepartureLeg.ident = airportRunwayIdent(this.originAirport, this.runway);

                    addOriginLeg = false;
                    addRunwayLeg = false;
                } else {
                    const bearing = bearingTo(this.runway.thresholdLocation, firstDepartureLeg.terminationWaypoint().location);
                    const diff = MathUtils.diffAngle(bearing, this.runway.bearing);

                    addRunwayLeg = Math.abs(diff) < 1.0;
                }
            }
        }

        this.allLegs.length = 0;
        if (addOriginLeg) {
            const originLeg = FlightPlanLeg.fromAirportAndRunway(this, this.flightPlan.departureSegment.procedure?.ident ?? '', this.originAirport, addRunwayLeg ? this.runway : undefined);
            originLeg.flags |= FlightPlanLegFlags.Origin;
            this.allLegs.push(originLeg);

            this.strung = false;
        }

        if (this.runway) {
            const newRunwayCompatibleSids = await db.getDepartures(this.runway.airportIdent, this.runway.ident);

            const currentSidCompatibleWithNewRunway = newRunwayCompatibleSids.some((departure) => departure.databaseId === this.flightPlan.originDeparture?.databaseId);

            if (currentSidCompatibleWithNewRunway) {
                const currentSidNewRunwayTransition = this.flightPlan.originDeparture.runwayTransitions.find((transition) => transition.ident === this.runway.ident);

                if (currentSidNewRunwayTransition && this.flightPlan.departureRunwayTransition.ident !== currentSidNewRunwayTransition.ident) {
                    await this.flightPlan.departureRunwayTransitionSegment.setProcedure(currentSidNewRunwayTransition.ident);

                    this.strung = true;
                }
            } else {
                const runwayLeg = this.allLegs[this.allLegs.length - 1];

                if (runwayLeg.isDiscontinuity === true) {
                    throw new Error('[FMS/FPM] Runway leg was discontinuity');
                }

                this.allLegs.push(FlightPlanLeg.originExtendedCenterline(this, runwayLeg));
            }

            this.flightPlan.availableDepartures = newRunwayCompatibleSids;
        }

        this.flightPlan.enqueueOperation(FlightPlanQueuedOperation.Restring, RestringOptions.RestringDeparture);
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

    /**
     * Sets the contents of this segment using a serialized flight plan segment.
     *
     * @param serialized the serialized flight plan segment
     */
    setFromSerializedSegment(serialized: SerializedFlightPlanSegment): void {
        // TODO sync the airport
        // TODO sync the runway
        this.allLegs = serialized.allLegs.map((it) => (it.isDiscontinuity === false ? FlightPlanLeg.deserialize(it, this) : it));
    }
}
