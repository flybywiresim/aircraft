import { FlightPhase } from './FlightPhase';

export class CruisePhase extends FlightPhase {
    /**
   * Tries to transition to `TOP OF DESCENT` or `APPROACH` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.todPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.todPhase);
        } else if (this.flightPhaseManager.apprPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.apprPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.altCrzActive()
            || (
                this.cids.altitude() > (this.cids.cruiseAltitude() - 500)
                && this.cids.altitude() < (this.cids.cruiseAltitude() + 500)
            )
        );
    }

    public getValue(): number {
        return 6;
    }
}
