import { FlightPhase } from './FlightPhase';

export class DisembarkationPhase extends FlightPhase {
    /**
   * Tries to transition to `AFTER PASSENGER DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.afterDisembarkationPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.afterDisembarkationPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.onGround()
            && this.cids.isStationary()
            && this.cids.door1LPercentOpen() === 100
            && this.cids.deboardingInProgess()
        );
    }

    public getValue(): number {
        return 11;
    }
}
