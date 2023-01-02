import { FlightPhase } from './FlightPhase';

export class FinalApproachAndLandingPhase extends FlightPhase {
    /**
     * Tries to transition to `TAXI AFTER LANDING` phase.
     */
    public tryTransition(): void {
        if (this.flightPhaseManager.taxiAfterLandingPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiAfterLandingPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.gearDownLocked()
            && this.cids.groundSpeed() >= 80
        );
    }

    public getValue(): number {
        return 9;
    }
}
