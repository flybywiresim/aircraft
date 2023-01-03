import { FlightPhase } from './FlightPhase';

export class TaxiAfterLandingPhase extends FlightPhase {
    /**
   * Tries to transition to `DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.taxiAfterLandingPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.disembarkationPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.groundSpeed() < 80
        );
    }

    public getValue(): number {
        return 10;
    }
}
