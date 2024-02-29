// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
    fmsOrigin: string,
    fmsDestination: string,
    fmsAlternate: string,
    /** Identifier of landing runway. */
    fmsLandingRunway: string,
    /** Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistance: number,
    /** Length of selected landing runway, in meters. */
    fmsLandingRunwayLength: number,
    /** Distance to opposite end of runway, in meters. */
    fmsRemainingDistToRwyEnd: number,
    /** Distance to requested stopping distance, in meters. */
    fmsRemainingDistToExit: number,
    /** Estimated runway occupancy time (ROT), in seconds. */
    btvRot: number,
}
