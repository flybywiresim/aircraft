// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { Common, FlapConf } from './common';
import { EngineModel } from './EngineModel';
import { FlightModel } from './FlightModel';

export class CostIndex {
  /**
   * Calculate specific air range (KTAS / uncorrected fuel flow)
   * @param mach
   * @param altitude in feet
   * @param weight in pounds
   * @param isaDev ISA deviation (in celsius)
   * @returns SR in nautical miles per pound of fuel
   */
  static calculateSpecificRange(
    config: AircraftConfig,
    mach: number,
    altitude: number,
    weight: number,
    isaDev: number,
  ): number {
    const theta = Common.getTheta(altitude, isaDev);
    const theta2 = Common.getTheta2(theta, mach);
    const delta = Common.getDelta(theta);
    const delta2 = Common.getDelta2(delta, mach);

    const Vt = Common.machToTAS(mach, theta);
    const thrust = FlightModel.getDrag(config.flightModelParameters, weight, mach, delta, false, false, FlapConf.CLEAN);

    // Divide by 2 to get thrust per engine
    const correctedThrust = thrust / delta2 / 2;
    // Since table 1506 describes corrected thrust as a fraction of max thrust, divide it
    const correctedN1 = EngineModel.reverseTableInterpolation(
      config.engineModelParameters.table1506,
      mach,
      correctedThrust / config.engineModelParameters.maxThrust,
    );

    // Fuel flow units are lbs/hr
    const correctedFuelFlow = EngineModel.getCorrectedFuelFlow(
      config.engineModelParameters,
      correctedN1,
      mach,
      altitude,
    );
    const fuelFlow = EngineModel.getUncorrectedFuelFlow(correctedFuelFlow, delta2, theta2);

    return Vt / fuelFlow;
  }

  /**
   * Generates an initial estimate for Mmrc
   * @param config aircraft specific configuration
   * @param weight in pounds
   * @param delta pressure ratio
   * @returns mach
   */
  static initialMachEstimate(config: AircraftConfig, weight: number, delta: number): number {
    return 1.565 * Math.sqrt(weight / (1481 * config.flightModelParameters.wingArea * delta));
  }

  /**
   * Placeholder
   * @param config aircraft specific configuration
   * @param altitude in feet
   * @param weight in pounds
   * @param isaDev ISA deviation (in celsius)
   * @returns Mmrc
   */
  static naiveFindMmrc(config: AircraftConfig, altitude: number, weight: number, isaDev: number): number {
    const delta = Common.getDelta(altitude);
    const m1 = Math.min(CostIndex.initialMachEstimate(config, weight, delta), 0.78);
    const mRound = Math.round((m1 + Number.EPSILON) * 100) / 100;

    const lowerBound = mRound - 0.1;
    const upperBound = Math.min(mRound + 0.1, 0.79);
    const results = [];
    for (let i = lowerBound; i < upperBound; i += 0.01) {
      results.push(CostIndex.calculateSpecificRange(config, i, altitude, weight, isaDev));
    }

    const indexofMax = results.reduce((iMax, x, i, arr) => (x > arr[iMax] ? i : iMax), 0);
    return lowerBound + indexofMax * 0.01;
  }

  /**
   * Placeholder
   * @param config aircraft specific configuration
   * @param ci in kg/min
   * @param flightLevel altitude in feet / 100
   * @param weight in pounds
   * @param isaDev ISA deviation (in celsius)
   * @param headwind in knots (negative for tailwind)
   * @returns econ mach
   */
  static costIndexToMach(
    config: AircraftConfig,
    ci: number,
    flightLevel: number,
    weight: number,
    isaDev = 0,
    headwind = 0,
  ): number {
    // Add 0.01 mach for every 100 kts of headwind (subtract for tailwind)
    const Mmrc = CostIndex.naiveFindMmrc(config, flightLevel * 100, weight, isaDev) + headwind / 10000;
    return -1 * (0.8 - Mmrc) * Math.exp(-0.05 * ci) + 0.8;
  }

  /**
   * Placeholder
   * @param ci in kg/min
   * @param flightLevel altitude in feet / 100
   * @param weight in pounds - should be total weight at T/C
   * @returns econ climb cas
   */
  static costIndexToClimbCas(ci: number, flightLevel: number, weight: number): number {
    const weightInTons = Math.min(Math.max(Common.poundsToMetricTons(weight), 50), 77);
    const airspeed = 240 + 0.1 * flightLevel + ci + 0.5 * (weightInTons - 50);
    return Math.min(Math.max(airspeed, 270), 340);
  }

  /**
   * Placeholder
   * @param ci in kg/min
   * @param flightLevel altitude in feet / 100
   * @param weight in pounds - should be total weight at T/D
   * @returns econ descent cas
   */
  static costIndexToDescentCas(ci: number, flightLevel: number, weight: number): number {
    const weightInTons = Math.min(Math.max(Common.poundsToMetricTons(weight), 50), 77);
    const airspeed = 205 + 0.13 * flightLevel + 1.5 * ci - 0.05 * (weightInTons - 50);
    return Math.min(Math.max(airspeed, 270), 340);
  }
}
