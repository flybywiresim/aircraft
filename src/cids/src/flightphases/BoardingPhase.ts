import { FlightPhase } from './FlightPhase';

export class BoardingPhase extends FlightPhase {
    /**
   * Tries to transition to `PUSHBACK` or `TAXI BEFORE TAKEOFF` phase.
   */
    public tryTransition(): void {
        if (this.flightPhaseManager.pushbackPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.pushbackPhase);
        } else if (this.flightPhaseManager.taxiBeforeTakeoffPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.door1LPercentOpen() === 100
            && this.flightPhaseManager.cids.boardingInProgress()
        );
    }

    public getValue(): number {
        return 1;
    }
}
