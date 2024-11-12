// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { ArincEventBus } from '@flybywiresim/fbw-sdk';
import { SimVarPublisher, SimVarDefinition, SimVarValueType } from '@microsoft/msfs-sdk';
import { Position } from '@turf/turf';

/**
 * Transmitted from FMS to OANS
 */
export interface FmsOansData {
  /** (FMS -> OANS) Selected origin airport. */
  fmsOrigin: string;
  /** (FMS -> OANS) Selected destination airport. */
  fmsDestination: string;
  /** (FMS -> OANS) Selected alternate airport. */
  fmsAlternate: string;
  /** (FMS -> OANS) Identifier of departure runway. */
  fmsDepartureRunway: string;
  /** (FMS -> OANS) Identifier of landing runway selected through FMS. */
  fmsLandingRunway: string;
  /** Identifier of landing runway selected for BTV through OANS. */
  oansSelectedLandingRunway: string;
  /** Arinc429: Length of landing runway selected for BTV through OANS, in meters. */
  oansSelectedLandingRunwayLength: number;
  /** Arinc429: Bearing of landing runway selected for BTV through OANS, in degrees. */
  oansSelectedLandingRunwayBearing: number;
  /** Identifier of exit selected for BTV through OANS. */
  oansSelectedExit: string;
  /** (OANS -> ND) QFU to be displayed in flashing RWY AHEAD warning in ND */
  ndRwyAheadQfu: string;
  /** (OANS -> BTV) Arinc429: Requested stopping distance (through OANS), in meters. */
  oansRequestedStoppingDistance: number;
  /** (OANS -> BTV) Arinc429: Distance to opposite end of runway, in meters. */
  oansRemainingDistToRwyEnd: number;
  /** (OANS -> BTV) Arinc429: Distance to requested stopping distance, in meters. */
  oansRemainingDistToExit: number;

  /** (OANS -> BTV) Projected position, i.e. aircraft position in airport local coordinates */
  oansAirportLocalCoordinates: Position;
  /** (OANS -> BTV) Positions of threshold and opposite threshold after selection of runway. WGS-84. */
  oansThresholdPositions: Position[];
  /** (OANS -> BTV) Position of exit after selection of exit. WGS-84. */
  oansExitPosition: Position;

  /** (BTV -> OANS) Estimated runway occupancy time (ROT), in seconds. */
  btvRot: number;
  /** (BTV -> OANS) Arinc429: Estimated turnaround time, when using idle reverse during deceleration, in minutes. */
  btvTurnAroundIdleReverse: number;
  /** (BTV -> OANS) Arinc429: Estimated turnaround time, when using max. reverse during deceleration, in minutes. */
  btvTurnAroundMaxReverse: number;
  /** Message displayed at the top of the ND (instead of TRUE REF), e.g. BTV 08R/A13 */
  ndBtvMessage: string;
}

export enum FmsOansSimVars {
  oansRequestedStoppingDistance = 'L:A32NX_OANS_BTV_REQ_STOPPING_DISTANCE',
  oansSelectedLandingRunwayLength = 'L:A32NX_OANS_RWY_LENGTH',
  oansSelectedLandingRunwayBearing = 'L:A32NX_OANS_RWY_BEARING',
  oansRemainingDistToRwyEnd = 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_RWY_END',
  oansRemainingDistToExit = 'L:A32NX_OANS_BTV_REMAINING_DIST_TO_EXIT',
  btvRot = 'L:A32NX_BTV_ROT',
  btvTurnAroundIdleReverse = 'L:A32NX_BTV_TURNAROUND_IDLE_REVERSE',
  btvTurnAroundMaxReverse = 'L:A32NX_BTV_TURNAROUND_MAX_REVERSE',
}

/** A publisher to poll and publish nav/com simvars. */
export class FmsOansSimvarPublisher extends SimVarPublisher<FmsOansData> {
  private static simvars = new Map<keyof FmsOansData, SimVarDefinition>([
    [
      'oansRequestedStoppingDistance',
      { name: FmsOansSimVars.oansRequestedStoppingDistance, type: SimVarValueType.Number },
    ],
    [
      'oansSelectedLandingRunwayLength',
      { name: FmsOansSimVars.oansSelectedLandingRunwayLength, type: SimVarValueType.Number },
    ],
    [
      'oansSelectedLandingRunwayBearing',
      { name: FmsOansSimVars.oansSelectedLandingRunwayBearing, type: SimVarValueType.Number },
    ],
    ['oansRemainingDistToRwyEnd', { name: FmsOansSimVars.oansRemainingDistToRwyEnd, type: SimVarValueType.Number }],
    ['oansRemainingDistToExit', { name: FmsOansSimVars.oansRemainingDistToExit, type: SimVarValueType.Number }],
    ['btvRot', { name: FmsOansSimVars.btvRot, type: SimVarValueType.Number }],
    ['btvTurnAroundIdleReverse', { name: FmsOansSimVars.btvTurnAroundIdleReverse, type: SimVarValueType.Number }],
    ['btvTurnAroundMaxReverse', { name: FmsOansSimVars.btvTurnAroundMaxReverse, type: SimVarValueType.Number }],
  ]);

  public constructor(bus: ArincEventBus) {
    super(FmsOansSimvarPublisher.simvars, bus);
  }
}
