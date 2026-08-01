// Copyright (c) 2021-2026 FlyByWire Simulations
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
import { Subscribable } from '@microsoft/msfs-sdk';
import { PropagatedWindEntry } from '../data/wind';

export interface ReadonlyFlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData> {
  get index(): number;

  /**
   * The time at which the flightplan was created in miliseconds since epoch. Undefined if no valid creation time is available or for alternate flightplans.
   */
  timeCreated?: number;

  get wasModified(): boolean;

  get legCount(): number;

  get enrouteLegCount(): number;

  get lastIndex(): number;

  get firstMissedApproachLegIndex(): number;

  get firstApproachLegIndex(): number;

  get firstEnrouteLegIndex(): number;

  get lastEnrouteLegIndex(): number;

  get activeLegIndex(): number;

  get activeLeg(): ReadonlyFlightPlanElement;

  get fromLegIndex(): number;

  get isApproachActive(): boolean;

  findLegIndexByFixIdent(ident: string): number;

  get version(): number;

  get originLeg(): ReadonlyFlightPlanElement | undefined;

  get originLegIndex(): number;

  get destinationLeg(): ReadonlyFlightPlanElement | undefined;

  get destinationLegIndex(): number | null;

  readonly availableDestinationRunways: readonly Runway[];

  get endsAtRunway(): boolean;

  hasElement(index: number): boolean;

  elementAt(index: number): ReadonlyFlightPlanElement;

  legElementAt(index: number): ReadonlyFlightPlanLeg;

  maybeElementAt(index: number): ReadonlyFlightPlanElement | undefined;

  get allLegs(): readonly ReadonlyFlightPlanElement[];

  /** Gets the engine out departure legs. */
  getEngineOutDepartureLegs(): readonly ReadonlyFlightPlanElement[];

  get pendingAirways(): ReadonlyPendingAirways | undefined;

  get originAirport(): Airport | undefined;

  get originRunway(): Runway | undefined;

  readonly availableOriginRunways: readonly Runway[];

  get departureRunwayTransition(): ProcedureTransition | undefined;

  get originDeparture(): Departure | undefined;

  readonly availableDepartures: readonly Departure[];

  get departureEnrouteTransition(): ProcedureTransition | undefined;

  get arrivalEnrouteTransition(): ProcedureTransition | undefined;

  /**
   * The arrival procedure. If it's `undefined`, it means that no arrival is set. If it's `null`, it means that the "NO STAR" is explicitly selected.
   */
  get arrival(): Arrival | undefined | null;

  get arrivalRunwayTransition(): ProcedureTransition | undefined;

  readonly availableArrivals: readonly Arrival[];

  get approachVia(): ProcedureTransition | undefined | null;

  get approach(): Approach | undefined;

  readonly availableApproaches: readonly Approach[];

  readonly availableApproachVias: readonly ProcedureTransition[];

  get destinationAirport(): Airport | undefined;

  get destinationRunway(): Runway | undefined;

  segmentPositionForIndex(index: number): readonly [segment: FlightPlanSegment, indexInSegment: number];

  autoConstraintTypeForLegIndex(index: number): WaypointConstraintType;

  glideslopeIntercept(): number | undefined;

  get performanceData(): P;

  propagateWindsAt(atIndex: number, result: PropagatedWindEntry[], maxNumEntries: number): PropagatedWindEntry[];
}

/**
 * Read-only view of a main flight plan. Unlike alternate flight plans, main plans carry operational metadata and own
 * an alternate flight plan.
 */
export interface ReadonlyMainFlightPlan<P extends FlightPlanPerformanceData = FlightPlanPerformanceData>
  extends ReadonlyFlightPlan<P> {
  readonly flags: number;

  readonly flightNumber: Subscribable<string | null>;

  readonly alternateFlightPlan: ReadonlyFlightPlan<P>;

  isActiveOrCopiedFromActive(): boolean;
}
