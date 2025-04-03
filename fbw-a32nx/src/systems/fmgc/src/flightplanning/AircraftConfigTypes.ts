// Copyright (c) 2021-2022 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlapConf } from '@fmgc/guidance/vnav/common';

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

  /**
   * Label used for pseudo-waypoints that mark where the aircraft crosses
   * climb/descent speed limit altitudes.
   * Configurable since different Airbus aircraft use different labels (e.g. A320 vs A380).
   */
  LIM_PSEUDO_WPT_LABEL: '(LIM)' | '(SPDLIM)';

  /**
   * The maximum operating speed in knots
   */
  VMO: number;

  /**
   * The maximum operating Mach number
   */
  MMO: number;
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

  /**
   * Maximum corrected N1 in CLB thrust
   * Each row represents a different altitude and the corresponding engine thrust
   * limits. The columns in each row represent the following parameters:
   * 1. Altitude (in feet)
   * 2. Corner Point (CP) - the temperature below which the engine can operate at full thrust without any restrictions.
   * 3. Limit Point (LP) - the temperature above which the engine thrust starts to be limited.
   * 4. CN1 Flat - the engine's N1 fan speed limit at the CP temperature.
   * 5. CN1 Last - the engine's N1 fan speed limit at the LP temperature.
   * @returns Corrected N1 (CN1)
   */
  cn1ClimbLimit: readonly (readonly number[])[];

  /**
   * Table 1502 - CN2 vs CN1 @ Mach 0, 0.2, 0.9
   * n2_to_n1_table
   * @param i row index (n2)
   * @param j 1 = Mach 0, 2 = Mach 0.2, 3 = Mach 0.9
   * @returns Corrected N1 (CN1)
   */
  table1502: readonly (readonly number[])[];

  /**
   * Table 1503 - Turbine LoMach (0) CN2 vs. Throttle @ IAP Ratio 1.00000000, 1.20172257, 1.453783983, 2.175007333, 3.364755652, 4.47246108, 5.415178313
   * mach_0_corrected_commanded_ne_table
   * @param i row index (thrust lever position)
   * @param j IAP ratio
   * @returns Corrected N2 (CN2)
   */
  table1503: readonly (readonly number[])[];

  /**
   * Table 1504 - Turbine HiMach (0.9) CN2 vs. Throttle @ IAP Ratio 1.00000000, 1.20172257, 1.453783983, 2.175007333, 3.364755652, 4.47246108, 5.415178313
   * mach_hi_corrected_commanded_ne_table
   * @param i row index (thrust lever position)
   * @param j IAP ratio
   * @returns Corrected N2 (CN2)
   */
  table1504: readonly (readonly number[])[];

  /**
   * Table 1506 - Corrected net Thrust vs CN1 @ Mach 0 to 0.9 in 0.1 steps
   * n1_and_mach_on_thrust_table
   * @param i row index (CN1)
   * @param j mach
   * @returns Corrected net thrust (pounds of force)
   */
  table1506: readonly (readonly number[])[];
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

  /**
   * Coefficents for the drag polar polynomial. The drag polar polynomial maps Cl to Cd.
   * The coefficients are ordered in increasing powers of Cl.
   */
  dragPolarCoefficients: Record<FlapConf, number[]>;
}

export interface FMSymbolsConfig {
  publishDepartureIdent: boolean;
}
