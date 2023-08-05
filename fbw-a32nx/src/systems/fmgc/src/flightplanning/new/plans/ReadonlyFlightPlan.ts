// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Airport, Approach, Arrival, Departure, ProcedureTransition, Runway } from 'msfs-navdata';
import { FlightPlanSegment } from '@fmgc/flightplanning/new/segments/FlightPlanSegment';
import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanElement, FlightPlanLeg } from '../legs/FlightPlanLeg';

export interface ReadonlyFlightPlan {
    get legCount(): number;

    get lastIndex(): number;

    get firstMissedApproachLegIndex(): number;

    get firstApproachLegIndex(): number;

    get activeLegIndex(): number;

    get activeLeg(): FlightPlanElement;

    get isApproachActive(): boolean;

    findLegIndexByFixIdent(ident: string): number;

    get version(): number;

    get originLeg(): FlightPlanElement;

    get originLegIndex(): number;

    get destinationLeg(): FlightPlanElement;

    get destinationLegIndex(): number;

    get endsAtRunway(): boolean;

    hasElement(index: number): boolean;

    elementAt(index: number): FlightPlanElement;

    legElementAt(index: number): FlightPlanLeg;

    maybeElementAt(index: number): FlightPlanElement | undefined;

    get originAirport(): Airport | undefined;

    get originRunway(): Runway | undefined;

    get departureRunwayTransition(): ProcedureTransition | undefined;

    get originDeparture(): Departure | undefined;

    get departureEnrouteTransition(): ProcedureTransition | undefined;

    get arrivalEnrouteTransition(): ProcedureTransition | undefined;

    get arrival(): Arrival | undefined;

    get arrivalRunwayTransition(): ProcedureTransition | undefined;

    get approachVia(): ProcedureTransition | undefined;

    get approach(): Approach | undefined;

    get destinationAirport(): Airport | undefined;

    get destinationRunway(): Runway | undefined;

    segmentPositionForIndex(index: number): readonly [segment: FlightPlanSegment, indexInSegment: number];

    autoConstraintTypeForLegIndex(index: number): WaypointConstraintType;

    glideslopeIntercept(): number | undefined;

    allLegs: readonly FlightPlanElement[];
}
