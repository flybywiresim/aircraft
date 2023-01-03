import { FlightPhase } from './FlightPhase';

export class DisembarkationPhase extends FlightPhase {
    /**
   * Tries to transition to `AFTER PASSENGER DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.afterDisembarkationPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.afterDisembarkationPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.door1LPercentOpen() === 100
            && this.flightPhaseManager.cids.deboardingInProgess()
        );
    }

    public getValue(): number {
        return 11;
    }
}
