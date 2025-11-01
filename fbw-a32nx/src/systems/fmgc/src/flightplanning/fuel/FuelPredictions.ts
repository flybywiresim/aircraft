export interface FuelPredictions {
  tripFuel: number | null;
  tripTime: number | null;
  routeReserveFuel: number | null;
  routeReserveFuelPercentage: number | null;
  alternateFuel: number | null;
  alternateTime: number | null;
  finalHoldingFuel: number | null;
  finalHoldingTime: number | null;
  minimumDestinationFuel: number | null;
  takeoffWeight: number | null;
  landingWeight: number | null;
  destinationFuelOnBoard: number | null;
  alternateDestinationFuelOnBoard: number | null;
  extraFuel: number | null;
  extraTime: number | null;
}
