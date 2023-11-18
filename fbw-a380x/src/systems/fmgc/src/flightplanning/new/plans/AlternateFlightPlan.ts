// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport } from 'msfs-navdata';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { DestinationSegment } from '@fmgc/flightplanning/new/segments/DestinationSegment';
import { FlightPlanElement } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';

/**
 * An alternate flight plan shares its origin with the destination of a regular flight plan
 */
export class AlternateFlightPlan extends BaseFlightPlan {
    constructor(
        private mainFlightPlan: BaseFlightPlan,
    ) {
        super();

        this.originSegment = new AlternateOriginSegment(this, this.mainFlightPlan.destinationSegment);
    }

    get originAirport(): Airport {
        return this.mainFlightPlan.destinationAirport;
    }

    get allLegs(): FlightPlanElement[] {
        return [
            ...this.originSegment.allLegs,
            ...this.destinationSegment.allLegs,
        ];
    }

    clone(fromMainFlightPlan: BaseFlightPlan): AlternateFlightPlan {
        const newPlan = new AlternateFlightPlan(fromMainFlightPlan);

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

        return newPlan;
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
}
