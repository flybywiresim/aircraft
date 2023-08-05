// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport } from 'msfs-navdata';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { DestinationSegment } from '@fmgc/flightplanning/new/segments/DestinationSegment';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';

/**
 * An alternate flight plan shares its origin with the destination of a regular flight plan
 */
export class AlternateFlightPlan extends BaseFlightPlan {
    constructor(
        index: number,
        private mainFlightPlan: BaseFlightPlan,
    ) {
        super(index, mainFlightPlan.bus);

        this.originSegment = new AlternateOriginSegment(this, this.mainFlightPlan.destinationSegment);
    }

    get originAirport(): Airport {
        return this.mainFlightPlan.destinationAirport;
    }

    clone(fromMainFlightPlan: BaseFlightPlan): AlternateFlightPlan {
        const newPlan = new AlternateFlightPlan(fromMainFlightPlan.index, fromMainFlightPlan);

        newPlan.version = this.version;
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

        newPlan.availableOriginRunways = [...this.availableOriginRunways];
        newPlan.availableDepartures = [...this.availableDepartures];
        newPlan.availableDestinationRunways = [...this.availableDestinationRunways];
        newPlan.availableArrivals = [...this.availableArrivals];
        newPlan.availableApproaches = [...this.availableApproaches];
        newPlan.availableApproachVias = [...this.availableApproachVias];

        return newPlan;
    }

    incrementVersion() {
        this.version++;
        this.mainFlightPlan.incrementVersion();
    }

    syncSegmentLegsChange(segment: FlightPlanSegment) {
        const segmentIndex = this.orderedSegments.indexOf(segment);

        const legs = segment.allLegs.map((it) => (it.isDiscontinuity === false ? it.serialize() : it));

        this.sendEvent('flightPlan.setSegmentLegs', { planIndex: this.index, forAlternate: true, segmentIndex, legs });
    }
}

export class AlternateOriginSegment extends OriginSegment {
    constructor(
        flightPlan: BaseFlightPlan,
        private readonly mainDestinationSegment: DestinationSegment,
    ) {
        super(flightPlan);
    }

    get originAirport(): Airport {
        return this.mainDestinationSegment.destinationAirport;
    }

    clone(forPlan: BaseFlightPlan): AlternateOriginSegment {
        const newSegment = new AlternateOriginSegment(forPlan, this.mainDestinationSegment);

        newSegment.strung = this.strung;
        newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
        newSegment.airport = this.airport;
        newSegment.runway = this.runway;

        return newSegment;
    }
}
