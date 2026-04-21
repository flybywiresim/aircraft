//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export function fuelForDisplay(fuelValue: number, metric: boolean, timeUnit = 1, fobMultiplier = 1) {
  const fuelWeight = metric ? fuelValue / timeUnit : fuelValue / timeUnit / 0.4535934;
  const roundValue = metric ? 10 * fobMultiplier : 20 * fobMultiplier;
  return Math.round(fuelWeight / roundValue) * roundValue;
}

export function fuelInTanksForDisplay(fuelValue: number, metric: boolean, gallon2Kg: number) {
  const weightInKg = fuelValue * gallon2Kg;
  const fuelWeight = metric ? weightInKg : weightInKg / 0.4535934;
  const roundValue = metric ? 10 : 20;
  return Math.round(fuelWeight / roundValue) * roundValue;
}
