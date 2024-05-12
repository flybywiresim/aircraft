// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport } from '@flybywiresim/fbw-sdk';
import { BaseFlightPlan } from '@fmgc/flightplanning/new/plans/BaseFlightPlan';
import { DestinationSegment } from '@fmgc/flightplanning/new/segments/DestinationSegment';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/new/plans/performance/FlightPlanPerformanceData';

/**
 * An alternate flight plan shares its origin with the destination of a regular flight plan
 */
export class AlternateFlightPlan<P extends FlightPlanPerformanceData> extends BaseFlightPlan<P> {
  // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
  override originSegment: AlternateOriginSegment = undefined;

  constructor(
    index: number,
    private mainFlightPlan: BaseFlightPlan<P>,
  ) {
    super(index, mainFlightPlan.bus);

    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    this.originSegment = new AlternateOriginSegment(this, this.mainFlightPlan.destinationSegment);
  }

  // @ts-expect-error TS2416 -- TODO fix this manually (strict mode migration)
  get originAirport(): Airport | undefined {
    return this.mainFlightPlan.destinationAirport;
  }

  clone(fromMainFlightPlan: BaseFlightPlan<P>): AlternateFlightPlan<P> {
    const newPlan = new AlternateFlightPlan(fromMainFlightPlan.index, fromMainFlightPlan);

    newPlan.version = this.version;
    newPlan.originSegment = this.originSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.departureRunwayTransitionSegment = this.departureRunwayTransitionSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.departureSegment = this.departureSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.departureEnrouteTransitionSegment = this.departureEnrouteTransitionSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.enrouteSegment = this.enrouteSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.arrivalEnrouteTransitionSegment = this.arrivalEnrouteTransitionSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.arrivalSegment = this.arrivalSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.arrivalRunwayTransitionSegment = this.arrivalRunwayTransitionSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.approachViaSegment = this.approachViaSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.approachSegment = this.approachSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newPlan.destinationSegment = this.destinationSegment.clone(newPlan);
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
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
    flightPlan: BaseFlightPlan<FlightPlanPerformanceData>,
    private readonly mainDestinationSegment: DestinationSegment,
  ) {
    super(flightPlan);
  }

  override get originAirport(): Airport {
    return this.mainDestinationSegment.destinationAirport;
  }

  // @ts-expect-error TS2416 -- TODO fix this manually (strict mode migration)
  clone(forPlan: AlternateFlightPlan<FlightPlanPerformanceData>): AlternateOriginSegment {
    // Important that we don't pass in `this.mainDestinationSegment` here, since this will be of the old plan.
    // Instead, pass in `mainDestinationSegment` on the origin of the new plan
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    const newSegment = new AlternateOriginSegment(forPlan, forPlan.originSegment.mainDestinationSegment);

    newSegment.strung = this.strung;
    // @ts-expect-error TS2345 -- TODO fix this manually (strict mode migration)
    newSegment.allLegs = [...this.allLegs.map((it) => (it.isDiscontinuity === false ? it.clone(newSegment) : it))];
    newSegment.airport = this.airport;
    newSegment.runway = this.runway;

    return newSegment;
  }
}
