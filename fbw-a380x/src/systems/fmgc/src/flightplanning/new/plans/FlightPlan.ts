// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Airway, Waypoint } from 'msfs-navdata';
import { FlightPlanDefinition } from '@fmgc/flightplanning/new/FlightPlanDefinition';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { AlternateFlightPlan } from '@fmgc/flightplanning/new/plans/AlternateFlightPlan';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { FlightPlanElement } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { PendingAirways } from '@fmgc/flightplanning/new/plans/PendingAirways';
// import { FlightPlanPerformanceData } from '@fmgc/flightplanning/new/plans/performance/FlightPlanPerformanceData';

export class FlightPlan extends BaseFlightPlan {
    static empty(): FlightPlan {
        return new FlightPlan();
    }

    static fromDefinition(definition: FlightPlanDefinition): FlightPlan {
        return new FlightPlan();
    }

    /**
     * Alternate flight plan associated with this flight plan
     */
    alternateFlightPlan = new AlternateFlightPlan(this);

    pendingAirways: PendingAirways | undefined;

    /**
     * Performance data for this flight plan
     */
    // performanceData = new FlightPlanPerformanceData();

    clone(): FlightPlan {
        const newPlan = FlightPlan.empty();

        newPlan.originSegment = this.originSegment.clone(newPlan);
        newPlan.departureRunwayTransitionSegment = this.departureRunwayTransitionSegment.clone(newPlan);
        newPlan.departureSegment = this.departureSegment.clone(newPlan);
        newPlan.departureEnrouteTransitionSegment = this.departureEnrouteTransitionSegment.clone(newPlan);
        newPlan.enrouteSegment = this.enrouteSegment.clone(newPlan);
        newPlan.arrivalEnrouteTransitionSegment = this.arrivalEnrouteTransitionSegment.clone(newPlan);
        newPlan.arrivalSegment = this.arrivalSegment.clone(newPlan);
        newPlan.arrivalRunwayTransitionSegment = this.arrivalRunwayTransitionSegment.clone(newPlan);
        newPlan.approachViaSegment = this.approachViaSegment.clone(newPlan);
        newPlan.approachSegment = this.approachSegment.clone(newPlan);
        newPlan.destinationSegment = this.destinationSegment.clone(newPlan);
        newPlan.missedApproachSegment = this.missedApproachSegment.clone(newPlan);
        newPlan.alternateFlightPlan = this.alternateFlightPlan.clone(newPlan);

        newPlan.availableOriginRunways = [...this.availableOriginRunways];
        newPlan.availableDepartures = [...this.availableDepartures];
        newPlan.availableDestinationRunways = [...this.availableDestinationRunways];
        newPlan.availableArrivals = [...this.availableArrivals];
        newPlan.availableApproaches = [...this.availableApproaches];
        newPlan.availableApproachVias = [...this.availableApproachVias];

        newPlan.activeLegIndex = this.activeLegIndex;
        // TODO copy performance data as well (only for SEC F-PLN)

        return newPlan;
    }

    get alternateDestinationAirport(): Airport {
        return this.alternateFlightPlan.destinationAirport;
    }

    async setAlternateDestinationAirport(icao: string) {
        return this.alternateFlightPlan.setDestinationAirport(icao);
    }

    startAirwayEntry(revisedLegIndex: number) {
        const leg = this.elementAt(revisedLegIndex);

        if (leg.isDiscontinuity === true) {
            throw new Error('Cannot start airway entry at a discontinuity');
        }

        if (!leg.isXF() && !leg.isHX()) {
            throw new Error('Cannot create a pending airways entry from a non XF or HX leg');
        }

        this.pendingAirways = new PendingAirways(this, revisedLegIndex, leg);
    }
}
