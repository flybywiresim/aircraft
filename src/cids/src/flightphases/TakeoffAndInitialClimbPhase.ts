import { FlightPhase } from './FlightPhase';

export class TakeoffAndInitialClimbPhase extends FlightPhase {
    /**
   * Tries to transition to `FINAL CLIMB`, CRUISE or `DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.finalClimbPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.finalClimbPhase);
        } else if (this.flightPhaseManager.cruisePhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.cruisePhase); // Should the cruising altitude be lower than 10 000 ft this will transition to CRUISE.
        } else if (this.flightPhaseManager.disembarkationPhase.testConditions()) { // In case of returning to the gate this will transition to the disembarkation phase for deboarding.
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.disembarkationPhase);
        }
    }

    public testConditions(): boolean {
        return (
            (
                this.flightPhaseManager.cids.thrustLever1Position() > 74
                && this.flightPhaseManager.cids.thrustLever2Position() > 74
            )
            && (
                this.flightPhaseManager.cids.onGround()
                || this.flightPhaseManager.cids.altitude() < 10000
            )
        );
    }

    public getValue(): number {
        return 4;
    }
}
