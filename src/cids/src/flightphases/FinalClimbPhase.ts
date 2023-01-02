import { FlightPhase } from './FlightPhase';

export class FinalClimbPhase extends FlightPhase {
    /**
   * Tries to transition to `CRUISE` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.cruisePhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.cruisePhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.altitude() > 10000
            && this.cids.altitude() < this.cids.cruiseAltitude()
        );
    }

    public getValue(): number {
        return 5;
    }
}
