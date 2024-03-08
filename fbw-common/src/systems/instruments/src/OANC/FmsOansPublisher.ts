// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
    /** (FMS -> OANS) Selected origin airport. */
    fmsOrigin: string,
    /** (FMS -> OANS) Selected destination airport. */
    fmsDestination: string,
    /** (FMS -> OANS) Selected alternate airport. */
    fmsAlternate: string,
    /** (FMS -> OANS) Identifier of departure runway. */
    fmsDepartureRunway: string,
    /** (FMS -> OANS) Identifier of landing runway selected through FMS. */
    fmsLandingRunway: string,
    /** Identifier of landing runway selected for BTV through OANS. */
    oansSelectedLandingRunway: string,
    /** Length of landing runway selected for BTV through OANS, in meters. */
    oansSelectedLandingRunwayLength: number,
    /** Bearing of landing runway selected for BTV through OANS, in degrees. */
    oansSelectedLandingRunwayBearing: number,
    /** Identifier of exit selected for BTV through OANS. */
    oansSelectedExit: string,
    /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistance: number,
    /** (FMS -> OANS) Length of selected landing runway, in meters. */
    // fmsLandingRunwayLength: number,
    /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
    oansRemainingDistToRwyEnd: number,
    /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
    oansRemainingDistToExit: number,
    /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
    btvRot: number,
    /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
    btvTurnAroundIdleReverse: number;
    /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
    btvTurnAroundMaxReverse: number;
}
