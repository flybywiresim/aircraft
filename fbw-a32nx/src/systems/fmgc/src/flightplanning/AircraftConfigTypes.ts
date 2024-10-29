// Copyright (c) 2021-2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export enum VnavDescentMode {
  NORMAL,
  CDA,
  DPO,
}

export interface AircraftConfig {
  lnavConfig: LnavConfig;
  vnavConfig: VnavConfig;
  engineModelParameters: EngineModelParameters;
  flightModelParameters: FlightModelParameters;
  fmSymbolConfig: FMSymbolsConfig;
}

export interface VnavConfig {
  /**
   * VNAV descent calculation mode (NORMAL, CDA or DPO)
   */
  VNAV_DESCENT_MODE: VnavDescentMode;

  /**
   * Whether to emit CDA flap1/2 pseudo-waypoints (only if VNAV_DESCENT_MODE is CDA)
   */
  VNAV_EMIT_CDA_FLAP_PWP: boolean;

  /**
   * Whether to pring debug information and errors during the VNAV computation.
   */
  DEBUG_PROFILE: boolean;

  /**
   * Whether to print guidance debug information on the ND
   */
  DEBUG_GUIDANCE: boolean;

  /**
   * Whether to use debug simvars (VNAV_DEBUG_*) to determine aircraft position and state.
   * This is useful for testing VNAV without having to fly the aircraft. This lets you put the aircraft some distance before destination at a given altitude and speed.
   * The following simvars can be used:
   * - A32NX_FM_VNAV_DEBUG_POINT: Indicates the distance from start (NM) at which to draw a debug pseudowaypoint on the ND
   * - A32NX_FM_VNAV_DEBUG_ALTITUDE: Indicates the indicated altitude (ft) VNAV uses for predictions
   * - A32NX_FM_VNAV_DEBUG_SPEED: Indicates the indicated airspeed (kts) VNAV uses for predictions
   * - A32NX_FM_VNAV_DEBUG_DISTANCE_TO_END: Indicates the distance (NM) to end VNAV uses for predictions
   */
  ALLOW_DEBUG_PARAMETER_INJECTION: boolean;

  VNAV_USE_LATCHED_DESCENT_MODE: boolean;

  /**
   * Percent N1 to add to the predicted idle N1. The real aircraft does also use a margin for this, but I don't know how much
   */
  IDLE_N1_MARGIN: number;

  /**
   * VNAV needs to make an initial estimate of the fuel on board at destination to compute the descent path.
   * We don't want this figure to be too large as it might crash the predictions. So we clamp it to this value.
   * This value is in lbs.
   */
  MAXIMUM_FUEL_ESTIMATE: number;
}

/** Only covers aircraft specific configs, no debug switches */
export interface LnavConfig {
  /* ========== PATHGEN CONFIG ========== */

  /**
   * The minimum TAS we ever compute guidables with
   */
  DEFAULT_MIN_PREDICTED_TAS: number;

  /**
   * Coefficient applied to all transition turn radii
   */
  TURN_RADIUS_FACTOR: number;

  /**
   * The number of transitions to compute after the active leg (-1: no limit, compute all transitions)
   */
  NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE: number;
}

export interface EngineModelParameters {
  /** In pounds of force. Used as a multiplier for results of table 1506 */
  maxThrust: number;

  /** Well... how many engines the plen has */
  numberOfEngines: number;

  /** Fuel burn relative to A320 / base implementation */
  fuelBurnFactor: number;
}

export interface FlightModelParameters {
  Cd0?: number;

  wingSpan: number;

  wingArea: number;

  wingEffcyFactor: number;

  /** in knots/second */
  requiredAccelRateKNS: number;

  /** in m/s^2 */
  requiredAccelRateMS2: number;

  /** in knots/second */
  gravityConstKNS: number;

  /** in m/s^2 */
  gravityConstMS2: number;

  /** From https://github.com/flybywiresim/a32nx/pull/6903#issuecomment-1073168320 */
  machValues: Mach[];

  dragCoefficientCorrections: number[];

  /** Drag coefficient increase due to extended speed brake */
  speedBrakeDrag: number;

  /** Drag coefficient increase due to extended speed brake */
  gearDrag: number;

  /** Drag coefficient factor for tuning */
  dragCoeffFactor: number;
}

export interface FMSymbolsConfig {
  publishDepartureIdent: boolean;
}
