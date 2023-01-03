import { FlightPhase } from './FlightPhase';

export class ApproachPhase extends FlightPhase {
    /**
     * Tries to transition to `FINAL APPROACH AND LANDING`.
     */
    public tryTransition(): void {
        if (this.flightPhaseManager.finalApprAndLandingPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.finalApprAndLandingPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.altitude() < 10000
            && !this.flightPhaseManager.cids.gearDownLocked()
            && this.flightPhaseManager.cids.radioAltitude() > 1000
        );
    }

    public getValue(): number {
        return 8;
    }
}
