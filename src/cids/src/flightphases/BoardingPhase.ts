import { FlightPhase } from './FlightPhase';

export class BoardingPhase extends FlightPhase {
    /**
   * Tries to transition to `PUSHBACK` or `TAXI BEFORE TAKEOFF` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.pushbackPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.pushbackPhase);
        } else if (this.flightPhaseManager.taxiBeforeTakeoffPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.cids.onGround()
            && this.cids.isStationary()
            && this.cids.door1LPercentOpen() === 100
            && this.cids.boardingInProgress()
        );
    }

    public getValue(): number {
        return 1;
    }
}
