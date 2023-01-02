import { FlightPhase } from './FlightPhase';

export class DisembarkationPhase extends FlightPhase {
    /**
   * Tries to transition to `AFTER PASSENGER DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (
            this.flightPhaseManager.cids.onGround()
    && this.flightPhaseManager.cids.getTotalPax() === 0
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.afterDisembarkationPhase);
        }
    }

    public getValue(): number {
        return 11;
    }
}
