// Copyright (c) 2023-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  AircraftConfig,
  EngineModelParameters,
  FlightModelParameters,
  FMSymbolsConfig,
  LnavConfig,
  VnavConfig,
  VnavDescentMode,
} from '@fmgc/flightplanning/AircraftConfigTypes';

const lnavConfig: LnavConfig = {
  DEFAULT_MIN_PREDICTED_TAS: 160,
  TURN_RADIUS_FACTOR: 1.0,
  NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE: -1,
};

const vnavConfig: VnavConfig = {
  VNAV_DESCENT_MODE: VnavDescentMode.NORMAL,
  VNAV_EMIT_CDA_FLAP_PWP: false,
  DEBUG_PROFILE: false,
  DEBUG_GUIDANCE: false,
  ALLOW_DEBUG_PARAMETER_INJECTION: false,
  VNAV_USE_LATCHED_DESCENT_MODE: false,
  IDLE_N1_MARGIN: 3,
  MAXIMUM_FUEL_ESTIMATE: 250_000,
};

const flightModelParams: FlightModelParameters = {
  wingSpan: 262.467,
  wingArea: 9096,
  wingEffcyFactor: 0.7,
  requiredAccelRateKNS: 1.33,
  requiredAccelRateMS2: 0.684,
  gravityConstKNS: 19.0626,
  gravityConstMS2: 9.806665,
  machValues: [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85],
  dragCoefficientCorrections: [0, 0.0002, 0.0003, 0.0004, 0.0008, 0.0015, 0.01],
  speedBrakeDrag: 0.0201,
  gearDrag: 0.00872,
  dragCoeffFactor: 0.87,
};

const engineModelParams: EngineModelParameters = {
  maxThrust: 80_213,
  numberOfEngines: 4,
  fuelBurnFactor: 1.33,
};

const fmsSymbolConfig: FMSymbolsConfig = {
  publishDepartureIdent: true,
};

export const A380AircraftConfig: AircraftConfig = {
  lnavConfig,
  vnavConfig,
  engineModelParameters: engineModelParams,
  flightModelParameters: flightModelParams,
  fmSymbolConfig: fmsSymbolConfig,
};
