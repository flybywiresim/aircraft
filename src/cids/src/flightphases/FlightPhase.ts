import { Cids } from 'cids/src/CIDS';
import { FlightPhaseManager } from '../FlightPhaseManager';

export abstract class FlightPhase {
  protected readonly cids: Cids;

  protected readonly flightPhaseManager: FlightPhaseManager;

  constructor(cids: Cids, flightPhaseManager: FlightPhaseManager) {
      this.cids = cids;
      this.flightPhaseManager = flightPhaseManager;
  }

  protected sendNewFlightPhaseToManager(flightPhase: FlightPhase): void {
      this.flightPhaseManager.setActiveFlightPhase(flightPhase);
  }

  abstract tryTransition(): void;

  abstract testConditions(): boolean;

  abstract getValue(): number;
}
