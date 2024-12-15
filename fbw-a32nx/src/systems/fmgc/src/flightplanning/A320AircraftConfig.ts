// Copyright (c) 2021-2024 FlyByWire Simulations
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
  MAXIMUM_FUEL_ESTIMATE: 40000,
};

const flightModelParams: FlightModelParameters = {
  Cd0: 0.01873,
  wingSpan: 117.454,
  wingArea: 1317.47,
  wingEffcyFactor: 0.7,
  requiredAccelRateKNS: 1.33,
  requiredAccelRateMS2: 0.684,
  gravityConstKNS: 19.0626,
  gravityConstMS2: 9.806665,
  machValues: [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85],
  dragCoefficientCorrections: [0, 0.0002, 0.0003, 0.0004, 0.0008, 0.0015, 0.01],
  speedBrakeDrag: 0.01008,
  gearDrag: 0.0372,
  dragCoeffFactor: 1,
};

const engineModelParams: EngineModelParameters = {
  maxThrust: 27120,
  numberOfEngines: 2,
  fuelBurnFactor: 1.0,
};

const fmsSymbolConfig: FMSymbolsConfig = {
  publishDepartureIdent: false,
};

export const A320AircraftConfig: AircraftConfig = {
  lnavConfig,
  vnavConfig,
  engineModelParameters: engineModelParams,
  flightModelParameters: flightModelParams,
  fmSymbolConfig: fmsSymbolConfig,
};
