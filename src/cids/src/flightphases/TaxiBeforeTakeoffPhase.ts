import { FlightPhase } from './FlightPhase';

export class TaxiBeforeTakeoffPhase extends FlightPhase {
    /**
   * Tries to transition to `TAKEOFF AND INITIAL CLIMB` phase.
   */
    public tryTransition(): void { // FIXME: should use #testCondition()
        if (
            this.flightPhaseManager.cids.thrustLever1Position() > 74
            && this.flightPhaseManager.cids.thrustLever2Position() > 74
            && (
                this.flightPhaseManager.cids.onGround()
                || this.flightPhaseManager.cids.altitude() < 10000
            )
        ) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.takeoffAndInitialClimbPhase);
        }
    }

    public testConditions(): boolean {
        return (
            !this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.thrustLever1Position() < 75
            && this.flightPhaseManager.cids.thrustLever2Position() < 75
        );
    }

    public getValue(): number {
        return 3;
    }
}
