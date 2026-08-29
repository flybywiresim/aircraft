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
    // These coefficients should match
    // https://github.com/flybywiresim/aircraft/blob/80b2e662a101be890cee0010d1e4bc659ff375a6/fbw-a32nx/src/wasm/fadec_a32nx/src/Fadec/Polynomials_A32NX.hpp#L321
    // https://github.com/flybywiresim/aircraft/blob/80b2e662a101be890cee0010d1e4bc659ff375a6/fbw-a380x/src/wasm/fadec_a380x/src/Fadec/Polynomials_A380X.hpp#L338
    // TODO separate between A32NX and A380X
    const coefficients = [
      -1.763e2, -2.1542e-1, 4.7119e1, 6.1519e2, 1.8047e-3, -4.4554e-1, -4.394e1, 4.0459e-5, -3.2912e1, -6.2894e-3,
      -1.2544e-7, 1.0938e-2, 4.0936e-1, -5.5841e-6, -2.3829e1, 9.3269e-4, 2.0273e-11, -2.41e2, 1.4171e-2, -9.5581e-7,
      1.2728e-11,
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

  static getClimbThrustCorrectedN1(
    parameters: EngineModelParameters,
    pressureAltitude: Feet,
    outsideTemperature: Celsius,
  ): number {
    let loAltRow = 0;
    let hiAltRow = 0;

    // Check for over/under flows. Else, find top row value
    if (pressureAltitude >= parameters.cn1ClimbLimit[parameters.cn1ClimbLimit.length - 1][0]) {
      hiAltRow = parameters.cn1ClimbLimit.length - 1;
      loAltRow = parameters.cn1ClimbLimit.length - 1;
    } else {
      hiAltRow = parameters.cn1ClimbLimit.reduce((acc, val, idx) => {
        return val[0] <= pressureAltitude ? idx + 1 : acc;
      }, 0);
      loAltRow = hiAltRow - 1;
    }

    // Define key table variables and interpolation
    const cp = Common.interpolate(
      pressureAltitude,
      parameters.cn1ClimbLimit[loAltRow][0],
      parameters.cn1ClimbLimit[hiAltRow][0],
      parameters.cn1ClimbLimit[loAltRow][1],
      parameters.cn1ClimbLimit[hiAltRow][1],
    );
    const lp = Common.interpolate(
      pressureAltitude,
      parameters.cn1ClimbLimit[loAltRow][0],
      parameters.cn1ClimbLimit[hiAltRow][0],
      parameters.cn1ClimbLimit[loAltRow][2],
      parameters.cn1ClimbLimit[hiAltRow][2],
    );
    const cn1Flat = Common.interpolate(
      pressureAltitude,
      parameters.cn1ClimbLimit[loAltRow][0],
      parameters.cn1ClimbLimit[hiAltRow][0],
      parameters.cn1ClimbLimit[loAltRow][3],
      parameters.cn1ClimbLimit[hiAltRow][3],
    );
    const cn1Last = Common.interpolate(
      pressureAltitude,
      parameters.cn1ClimbLimit[loAltRow][0],
      parameters.cn1ClimbLimit[hiAltRow][0],
      parameters.cn1ClimbLimit[loAltRow][4],
      parameters.cn1ClimbLimit[hiAltRow][4],
    );

    if (outsideTemperature <= cp) {
      return cn1Flat;
    }

    const m = (cn1Last - cn1Flat) / (lp - cp);
    const b = cn1Last - m * lp;
    return m * outsideTemperature + b;
  }
}
