// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export enum LandingRunwayConditions {
  Dry,
  Good,
  GoodMedium,
  Medium,
  MediumPoor,
  Poor,
}

export enum LandingFlapsConfig {
  Conf3,
  Full,
}

export enum AutobrakeMode {
  Low,
  Medium,
  Max, // Manual brake is the same as max auto
}

export interface LandingPerformanceCalculator {
  /**
   * Calculates the landing distances for each autobrake mode for the given conditions
   * @param weight Aircraft weight in KGs
   * @param flaps Flap Configuration
   * @param runwayCondition
   * @param approachSpeed Actual approach speed in kts
   * @param windDirection Heading wind is coming from, relative to north
   * @param windMagnitude Magnitude of wind in Knots
   * @param runwayHeading Heading of runway relative to north
   * @param reverseThrust Indicates if reverse thrust is active
   * @param altitude Runway altitude in feet ASL
   * @param temperature OAT of runway
   * @param slope Runway slope in %. Negative is downward slope
   * @param overweightProcedure Overweight procedure is being used if true
   * @param autoland Indicates if the usage of autoland is active
   */
  calculateLandingDistances(
    weight: number,
    flaps: LandingFlapsConfig,
    runwayCondition: LandingRunwayConditions,
    approachSpeed: number,
    windDirection: number,
    windMagnitude: number,
    runwayHeading: number,
    reverseThrust: boolean,
    altitude: number,
    temperature: number,
    slope: number,
    overweightProcedure: boolean,
    pressure: number,
    autoland: boolean,
  ): { maxAutobrakeDist: number; mediumAutobrakeDist: number; lowAutobrakeDist: number };
}
