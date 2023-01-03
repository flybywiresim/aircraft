import { FlightPhaseManager } from '../FlightPhaseManager';

export abstract class FlightPhase {
  protected readonly flightPhaseManager: FlightPhaseManager;

  constructor(flightPhaseManager: FlightPhaseManager) {
      this.flightPhaseManager = flightPhaseManager;
  }

  protected sendNewFlightPhaseToManager(flightPhase: FlightPhase): void {
      this.flightPhaseManager.setActiveFlightPhase(flightPhase);
  }

  abstract tryTransition(): void;

  abstract testConditions(): boolean;

  abstract getValue(): number;
}
