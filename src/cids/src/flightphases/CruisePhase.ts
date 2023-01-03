import { FlightPhase } from './FlightPhase';

export class CruisePhase extends FlightPhase {
    /**
   * Tries to transition to `TOP OF DESCENT` or `APPROACH` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.todPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.todPhase);
        } else if (this.flightPhaseManager.apprPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.apprPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.altCrzActive()
            || (
                this.flightPhaseManager.cids.altitude() > (this.flightPhaseManager.cids.cruiseAltitude() - 500)
                && this.flightPhaseManager.cids.altitude() < (this.flightPhaseManager.cids.cruiseAltitude() + 500)
            )
        );
    }

    public getValue(): number {
        return 6;
    }
}
