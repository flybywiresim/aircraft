export function fuelForDisplay(fuelValue, unitsC, timeUnit = 1, fobMultiplier = 1) {
  const fuelWeight = unitsC === '1' ? fuelValue / timeUnit : fuelValue / timeUnit / 0.4535934;
  const roundValue = unitsC === '1' ? 10 * fobMultiplier : 20 * fobMultiplier;
  return Math.round(fuelWeight / roundValue) * roundValue;
}

export function fuelInTanksForDisplay(fuelValue, unitsC, gallon2Kg) {
  const weightInKg = fuelValue * gallon2Kg;
  const fuelWeight = unitsC === '1' ? weightInKg : weightInKg / 0.4535934;
  const roundValue = unitsC === '1' ? 10 : 20;
  return Math.round(fuelWeight / roundValue) * roundValue;
}
