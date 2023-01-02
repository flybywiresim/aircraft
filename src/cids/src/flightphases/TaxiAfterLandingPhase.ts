import { FlightPhase } from './FlightPhase';

export class TaxiAfterLandingPhase extends FlightPhase {
    /**
   * Tries to transition to `DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.taxiAfterLandingPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.disembarkationPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.onGround()
            && this.cids.groundSpeed() < 80
        );
    }

    public getValue(): number {
        return 10;
    }
}
