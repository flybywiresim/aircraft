// Copyright (c) 2021-2025 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  Airport,
  Approach,
  Arrival,
  Departure,
  ProcedureTransition,
  Runway,
  WaypointConstraintType,
} from '@flybywiresim/fbw-sdk';
import { FlightPlanSegment } from '@fmgc/flightplanning/segments/FlightPlanSegment';
import { ReadonlyFlightPlanElement, ReadonlyFlightPlanLeg } from '@fmgc/flightplanning/legs/ReadonlyFlightPlanLeg';
import { ReadonlyPendingAirways } from '@fmgc/flightplanning/plans/ReadonlyPendingAirways';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

export interface ReadonlyFlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> {
  get index(): number;

  get legCount(): number;

  get enrouteLegCount(): number;

  get lastIndex(): number;

  get firstMissedApproachLegIndex(): number;

  get firstApproachLegIndex(): number;

  get firstEnrouteLegIndex(): number;

  get lastEnrouteLegIndex(): number;

  get activeLegIndex(): number;

  get activeLeg(): ReadonlyFlightPlanElement;

  get isApproachActive(): boolean;

  findLegIndexByFixIdent(ident: string): number;

  get version(): number;

  get originLeg(): ReadonlyFlightPlanElement | undefined;

  get originLegIndex(): number;

  get destinationLeg(): ReadonlyFlightPlanElement | undefined;

  get destinationLegIndex(): number;

  get endsAtRunway(): boolean;

  hasElement(index: number): boolean;

  elementAt(index: number): ReadonlyFlightPlanElement;

  legElementAt(index: number): ReadonlyFlightPlanLeg;

  maybeElementAt(index: number): ReadonlyFlightPlanElement | undefined;

  get allLegs(): readonly ReadonlyFlightPlanElement[];

  get pendingAirways(): ReadonlyPendingAirways | undefined;

  get originAirport(): Airport | undefined;

  get originRunway(): Runway | undefined;

  get departureRunwayTransition(): ProcedureTransition | undefined;

  get originDeparture(): Departure | undefined;

  get departureEnrouteTransition(): ProcedureTransition | undefined;

  get arrivalEnrouteTransition(): ProcedureTransition | undefined;

  /**
   * The arrival procedure. If it's `undefined`, it means that no arrival is set. If it's `null`, it means that the "NO STAR" is explicitly selected.
   */
  get arrival(): Arrival | undefined | null;

  get arrivalRunwayTransition(): ProcedureTransition | undefined;

  get approachVia(): ProcedureTransition | undefined | null;

  get approach(): Approach | undefined;

  get destinationAirport(): Airport | undefined;

  get destinationRunway(): Runway | undefined;

  segmentPositionForIndex(index: number): readonly [segment: FlightPlanSegment, indexInSegment: number];

  autoConstraintTypeForLegIndex(index: number): WaypointConstraintType;

  glideslopeIntercept(): number | undefined;

  get performanceData(): P;
}
