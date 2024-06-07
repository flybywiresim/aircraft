// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface FlightPlanDefinition {

    originIcao: string,

    originRunwayIdent?: string,

    originDepartureIdent?: string,

    originEnrouteTransitionIdent?: string,

    enrouteSegments?: EnrouteSegmentDefinition[],

    arrivalEnrouteTransitionIDent?: string,

    arrivalIdent?: string,

    arrivalRunwayTransitionIdent?: string,

    approachIdent?: string,

    destinationRunwayIdent?: string,

    destinationIcao: string,

}

export interface EnrouteSegmentDefinition {
    airwayIdent?: string,

    via?: string,
}
