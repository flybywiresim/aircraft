// Copyright (c) 2021-2026 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BaseFlightPlan, FlightPlanContext } from '@fmgc/flightplanning/plans/BaseFlightPlan';
import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

/**
 * An alternate flight plan shares its origin with the destination of a regular flight plan
 */
export class AlternateFlightPlan<P extends FlightPlanPerformanceData> extends BaseFlightPlan<P> {
  constructor(
    context: FlightPlanContext,
    index: number,
    private mainFlightPlan: BaseFlightPlan<P>,
  ) {
    super(context, index, mainFlightPlan.bus);
  }

  get performanceData(): P {
    return this.mainFlightPlan.performanceData;
  }

  clone(context: FlightPlanContext, fromMainFlightPlan: BaseFlightPlan<P>, options?: number): AlternateFlightPlan<P> {
    const newPlan = new AlternateFlightPlan(context, fromMainFlightPlan.index, fromMainFlightPlan);

    newPlan.version = this.version;
    newPlan.originSegment = this.originSegment.clone(newPlan, options);
    newPlan.departureRunwayTransitionSegment = this.departureRunwayTransitionSegment.clone(newPlan, options);
    newPlan.departureSegment = this.departureSegment.clone(newPlan, options);
    newPlan.departureEnrouteTransitionSegment = this.departureEnrouteTransitionSegment.clone(newPlan, options);
    newPlan.enrouteSegment = this.enrouteSegment.clone(newPlan, options);
    newPlan.arrivalEnrouteTransitionSegment = this.arrivalEnrouteTransitionSegment.clone(newPlan, options);
    newPlan.arrivalSegment = this.arrivalSegment.clone(newPlan, options);
    newPlan.arrivalRunwayTransitionSegment = this.arrivalRunwayTransitionSegment.clone(newPlan, options);
    newPlan.approachViaSegment = this.approachViaSegment.clone(newPlan, options);
    newPlan.approachSegment = this.approachSegment.clone(newPlan, options);
    newPlan.destinationSegment = this.destinationSegment.clone(newPlan, options);
    newPlan.missedApproachSegment = this.missedApproachSegment.clone(newPlan, options);

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
