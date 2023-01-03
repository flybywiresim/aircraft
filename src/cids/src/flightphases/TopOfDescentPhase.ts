import { FlightPhase } from './FlightPhase';

export class TopOfDescentPhase extends FlightPhase {
    /**
   * Tries to transition to `APPROACH` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.apprPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.apprPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.altitude() > 10000
            && this.flightPhaseManager.cids.altitude() <= (this.flightPhaseManager.cids.cruiseAltitude() - 700)
        );
    }

    public getValue(): number {
        return 7;
    }
}
