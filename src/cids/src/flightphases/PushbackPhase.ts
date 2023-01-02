import { FlightPhase } from './FlightPhase';

export class PushbackPhase extends FlightPhase {
    /**
   * Tries to transition to `TAXI BEFORE TAKEOFF` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.taxiBeforeTakeoffPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.onGround()
            && this.cids.isStationary()
            && this.cids.allDoorsClosedLocked()
            && this.cids.nwStrgPinInserted()
        );
    }

    public getValue(): number {
        return 2;
    }
}
