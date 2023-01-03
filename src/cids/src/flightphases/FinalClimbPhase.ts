import { FlightPhase } from './FlightPhase';

export class FinalClimbPhase extends FlightPhase {
    /**
   * Tries to transition to `CRUISE` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.cruisePhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.cruisePhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.altitude() > 10000
            && this.flightPhaseManager.cids.altitude() < this.flightPhaseManager.cids.cruiseAltitude()
        );
    }

    public getValue(): number {
        return 5;
    }
}
