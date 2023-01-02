import { FlightPhase } from './FlightPhase';

export class ApproachPhase extends FlightPhase {
    /**
     * Tries to transition to `FINAL APPROACH AND LANDING`.
     */
    public tryTransition(): void {
        if (this.flightPhaseManager.finalApprAndLandingPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.finalApprAndLandingPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.altitude() < 10000
            && !this.cids.gearDownLocked()
            && this.cids.radioAltitude() > 1000
        );
    }

    public getValue(): number {
        return 8;
    }
}
