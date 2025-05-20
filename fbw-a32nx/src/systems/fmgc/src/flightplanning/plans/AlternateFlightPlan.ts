// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport } from '@flybywiresim/fbw-sdk';
import { BaseFlightPlan, FlightPlanContext } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { DestinationSegment } from '@fmgc/flightplanning/segments/DestinationSegment';
import { OriginSegment } from '@fmgc/flightplanning/segments/OriginSegment';
import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

/**
 * An alternate flight plan shares its origin with the destination of a regular flight plan
 */
export class AlternateFlightPlan<P extends FlightPlanPerformanceData> extends BaseFlightPlan<P> {
  override originSegment: AlternateOriginSegment = undefined;

  constructor(
    context: FlightPlanContext,
    index: number,
    private mainFlightPlan: BaseFlightPlan<P>,
  ) {
    super(context, index, mainFlightPlan.bus);

    this.originSegment = new AlternateOriginSegment(this, this.mainFlightPlan.destinationSegment);
  }

  get originAirport(): Airport | undefined {
    return this.mainFlightPlan.destinationAirport;
  }

  clone(context: FlightPlanContext, fromMainFlightPlan: BaseFlightPlan<P>): AlternateFlightPlan<P> {
    const newPlan = new AlternateFlightPlan(context, fromMainFlightPlan.index, fromMainFlightPlan);

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

    this.sendEvent('flightPlan.setSegment', {
      syncClientID: this.context.syncClientID,
      planIndex: this.index,
      batchStack: this.context.batchStack,
      forAlternate: true,
      segmentIndex,
      serialized: segment.serialize(),
    });
  }
}

export class AlternateOriginSegment extends OriginSegment {
  constructor(
    flightPlan: BaseFlightPlan<FlightPlanPerformanceData>,
    private readonly mainDestinationSegment: DestinationSegment,
  ) {
    super(flightPlan);
  }

  override get originAirport(): Airport {
    return this.mainDestinationSegment.destinationAirport;
  }

  clone(forPlan: AlternateFlightPlan<FlightPlanPerformanceData>): AlternateOriginSegment {
    // Important that we don't pass in `this.mainDestinationSegment` here, since this will be of the old plan.
    // Instead, pass in `mainDestinationSegment` on the origin of the new plan
    const newSegment = new AlternateOriginSegment(forPlan, forPlan.originSegment.mainDestinationSegment);

    newSegment.strung = this.strung;
    newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
    newSegment.airport = this.airport;
    newSegment.runway = this.runway;

    return newSegment;
  }
}
