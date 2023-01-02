import { FlightPhase } from './FlightPhase';

export class TopOfDescentPhase extends FlightPhase {
    /**
   * Tries to transition to `APPROACH` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.apprPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.apprPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.altitude() > 10000
            && this.cids.altitude() <= (this.cids.cruiseAltitude() - 700)
        );
    }

    public getValue(): number {
        return 7;
    }
}
