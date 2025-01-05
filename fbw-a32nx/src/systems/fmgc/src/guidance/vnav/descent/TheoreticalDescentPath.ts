// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Theoretical descent path model
 */
export interface TheoreticalDescentPathCharacteristics {
  tod: number;
}

export interface IdlePath {
  speedLimitStartDistanceFromEnd: NauticalMiles;
  speedLimitValue: Knots;
}

export interface GeometricPath {
  /**
   * Table of flight path angles indexed by the leg whose termination they end up at
   */
  flightPathAngles: {
    [k: number]: Degrees;
  };
}
