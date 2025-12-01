import { FuelPredictions } from './FuelPredictions';

export class FuelPredComputations implements FuelPredictions {
  tripFuel: number | null = null;
  tripTime: number | null = null;
  routeReserveFuel: number | null = null;
  routeReserveFuelPercentage: number | null = null;
  alternateFuel: number | null = null;
  alternateTime: number | null = null;
  finalHoldingFuel: number | null = null;
  finalHoldingTime: number | null = null;
  minimumDestinationFuel: number | null = null;
  takeoffWeight: number | null = null;
  landingWeight: number | null = null;
  destinationFuelOnBoard: number | null = null;
  alternateDestinationFuelOnBoard: number | null = null;
  extraFuel: number | null = null;
  extraTime: number | null = null;

  public reset(): this {
    this.tripFuel = null;
    this.tripTime = null;
    this.routeReserveFuel = null;
    this.routeReserveFuelPercentage = null;
    this.alternateFuel = null;
    this.alternateTime = null;
    this.finalHoldingFuel = null;
    this.finalHoldingTime = null;
    this.minimumDestinationFuel = null;
    this.takeoffWeight = null;
    this.landingWeight = null;
    this.destinationFuelOnBoard = null;
    this.alternateDestinationFuelOnBoard = null;
    this.extraFuel = null;
    this.extraTime = null;

    return this;
  }
}
