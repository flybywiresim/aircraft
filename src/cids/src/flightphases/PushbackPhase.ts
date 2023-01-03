import { FlightPhase } from './FlightPhase';

export class PushbackPhase extends FlightPhase {
    /**
   * Tries to transition to `TAXI BEFORE TAKEOFF` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.taxiBeforeTakeoffPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.allDoorsClosedLocked()
            && this.flightPhaseManager.cids.nwStrgPinInserted()
        );
    }

    public getValue(): number {
        return 2;
    }
}
