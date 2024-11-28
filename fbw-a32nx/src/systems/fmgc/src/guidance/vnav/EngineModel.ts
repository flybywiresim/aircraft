// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EngineModelParameters } from '@fmgc/flightplanning/AircraftConfigTypes';
import { Common } from './common';

export class EngineModel {
  /**
   * Placeholder
   * @param table
   * @param i
   * @param j
   * @returns
   */
  static tableInterpolation(table: readonly (readonly number[])[], i: number, j: number): number {
    const numRows = table.length;
    const numCols = table[0].length;
    // Iterate through rows to find the upper bound to i
    let r: number;
    for (r = 1; r < numRows; r++) {
      if (table[r][0] > i) {
        break;
      }
    }
    // Get lower bound to i
    const r1 = Math.max(1, r - 1);
    const r2 = Math.min(numRows - 1, r);
    // Iterate through rows to find the upper bound to j
    let c: number;
    for (c = 1; c < numCols; c++) {
      if (table[0][c] > j) {
        break;
      }
    }
    // Get the lower bound to j
    const c1 = Math.max(1, c - 1);
    const c2 = Math.min(numCols - 1, c);

    const interpolatedRowAtC1 =
      r1 === r2 ? table[r1][c1] : Common.interpolate(i, table[r1][0], table[r2][0], table[r1][c1], table[r2][c1]);
    const interpolatedRowAtC2 =
      r1 === r2 ? table[r1][c2] : Common.interpolate(i, table[r1][0], table[r2][0], table[r1][c2], table[r2][c2]);

    if (c1 === c2) {
      return interpolatedRowAtC1;
    }

    return Common.interpolate(j, table[0][c1], table[0][c2], interpolatedRowAtC1, interpolatedRowAtC2);
  }

  /**
   * Retrieve a bilinear interpolated row value from a table
   * @param table
   * @param j Value on column axis
   * @param result Value normally returned as result
   */
  static reverseTableInterpolation(table: readonly (readonly number[])[], j: number, result: number): number {
    const numRows = table.length;
    const numCols = table[0].length;

    let c: number;
    for (c = 1; c < numCols; c++) {
      if (table[0][c] > j) {
        break;
      }
    }
    const c1 = Math.max(1, c - 1);
    const c2 = Math.min(numCols - 1, c);

    let r: number;
    for (r = 1; r < numRows; r++) {
      if (table[r][c1] > result) {
        break;
      }
    }
    const r1 = Math.max(1, r - 1);
    const r2 = Math.min(numRows - 1, r);
    for (r = 1; r < numRows; r++) {
      if (table[r][c2] > result) {
        break;
      }
    }
    const r3 = Math.max(1, r - 1);
    const r4 = Math.min(numRows - 1, r);

    const interpolatedRowAtC1 =
      r1 === r2 ? table[r1][0] : Common.interpolate(result, table[r1][c1], table[r2][c1], table[r1][0], table[r2][0]);
    const interpolatedRowAtC2 =
      r3 === r4 ? table[r3][0] : Common.interpolate(result, table[r3][c2], table[r4][c2], table[r3][0], table[r4][0]);

    return Common.interpolate(j, table[0][c1], table[0][c2], interpolatedRowAtC1, interpolatedRowAtC2);
  }

  /**
   * Placeholder
   * @param cn1 corrected N1 %
   * @param mach mach value
   * @param alt altitude in feet
   * @returns fuel flow, in pounds per hour (per engine)
   */
  static getCorrectedFuelFlow(config: EngineModelParameters, cn1: number, mach: number, alt: number): number {
    const coefficients = [
      -639.6602981, 0.0, 1.03705e2, -2.23264e3, 5.70316e-3, -2.29404, 1.0823e2, 2.77667e-4, -6.1718e2, -7.20713e-2,
      2.19013e-7, 2.49418e-2, -7.31662e-1, -1.00003e-5, -3.79466e1, 1.34552e-3, 5.72612e-9, -2.7195e2, 8.58469e-2,
      -2.72912e-6, 2.02928e-11,
    ];

    const flow =
      coefficients[0] +
      coefficients[1] +
      coefficients[2] * cn1 +
      coefficients[3] * mach +
      coefficients[4] * alt +
      coefficients[5] * cn1 ** 2 +
      coefficients[6] * cn1 * mach +
      coefficients[7] * cn1 * alt +
      coefficients[8] * mach ** 2 +
      coefficients[9] * mach * alt +
      coefficients[10] * alt ** 2 +
      coefficients[11] * cn1 ** 3 +
      coefficients[12] * cn1 ** 2 * mach +
      coefficients[13] * cn1 ** 2 * alt +
      coefficients[14] * cn1 * mach ** 2 +
      coefficients[15] * cn1 * mach * alt +
      coefficients[16] * cn1 * alt ** 2 +
      coefficients[17] * mach ** 3 +
      coefficients[18] * mach ** 2 * alt +
      coefficients[19] * mach * alt ** 2 +
      coefficients[20] * alt ** 3;

    return config.fuelBurnFactor * flow;
  }

  // static getCN1fromUncorrectedThrust(thrust: number)

  static getCorrectedN1(n1: number, theta2: number): number {
    return n1 / Math.sqrt(theta2);
  }

  static getUncorrectedN1(cn1: number, theta2: number): number {
    return cn1 * Math.sqrt(theta2);
  }

  static getUncorrectedN2(cn2: number, theta2: number): number {
    return cn2 * Math.sqrt(theta2);
  }

  static getUncorrectedThrust(correctedThrust: number, delta2: number): number {
    return correctedThrust * delta2;
  }

  static getUncorrectedFuelFlow(correctedFuelFlow: number, delta2: number, theta2: number): number {
    return correctedFuelFlow * delta2 * Math.sqrt(theta2);
  }

  static getCorrectedThrust(uncorrectedThrust: number, delta2: number): number {
    return uncorrectedThrust / delta2;
  }

  static getIdleCorrectedN1(
    parameters: EngineModelParameters,
    altitude: Feet,
    mach: Mach,
    tropoAltitude: Feet,
  ): number {
    const delta = Common.getDelta(altitude, altitude > tropoAltitude);
    const iap = 1 / delta;

    const lowMachCn2 = EngineModel.tableInterpolation(parameters.table1503, 0, iap);
    const highMachCn2 = EngineModel.tableInterpolation(parameters.table1504, 0, iap);

    const cn2 = Common.interpolate(mach, 0, 0.9, lowMachCn2, highMachCn2);
    const cn1 = EngineModel.tableInterpolation(parameters.table1502, cn2, mach);

    return cn1;
  }

  static getClimbThrustCorrectedN1(parameters: EngineModelParameters, altitude: Feet, totalAirTemperature: number) {
    return EngineModel.tableInterpolation(parameters.cn1ClimbLimit, totalAirTemperature, altitude);
  }
}
