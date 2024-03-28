// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Arinc429Word } from 'index-no-react';

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
    oansSelectedLandingRunwayLengthRaw: number,
    /** Bearing of landing runway selected for BTV through OANS, in degrees. */
    oansSelectedLandingRunwayBearingRaw: number,
    /** Identifier of exit selected for BTV through OANS. */
    oansSelectedExit: string,
    /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistanceRaw: number,
    /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
    oansRemainingDistToRwyEndRaw: number,
    /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
    oansRemainingDistToExitRaw: number,
    /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
    btvRotRaw: number,
    /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
    btvTurnAroundIdleReverseRaw: number;
    /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
    btvTurnAroundMaxReverseRaw: number;
    /** Message displayed at the top of the ND (instead of TRUE REF), e.g. BTV 08R/A13 */
    ndBtvMessage: string;
}

export interface FmsOansDataArinc429 {
    /** Length of landing runway selected for BTV through OANS, in meters. */
    oansSelectedLandingRunwayLength: Arinc429Word,
    /** Bearing of landing runway selected for BTV through OANS, in degrees. */
    oansSelectedLandingRunwayBearing: Arinc429Word,
    /** (OANS -> BTV)  Requested stopping distance (through OANS), in meters. */
    oansRequestedStoppingDistance: Arinc429Word,
    /** (OANS -> BTV) Distance to opposite end of runway, in meters. */
    oansRemainingDistToRwyEnd: Arinc429Word,
    /** (OANS -> BTV) Distance to requested stopping distance, in meters. */
    oansRemainingDistToExit: Arinc429Word,
    /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
    btvRot: Arinc429Word,
    /** (BTV -> OANS) Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
    btvTurnAroundIdleReverse: Arinc429Word;
    /** (BTV -> OANS) Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
    btvTurnAroundMaxReverse: Arinc429Word;
}
