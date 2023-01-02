import { FlightPhase } from './FlightPhase';

export class AfterDisembarkationPhase extends FlightPhase {
    /**
     * Tries to transition to `BOARDING`, `PUSHBACK` or `TAXI BEFORE TAKEOFF`.
     */
    public tryTransition(): void {
        if (this.flightPhaseManager.boardingPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.boardingPhase);
        } else if (this.flightPhaseManager.pushbackPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.pushbackPhase);
        } else if (this.flightPhaseManager.takeoffAndInitClimbPhase.testConditions()) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public testConditions(): boolean {
        return this.cids.getTotalPax() === 0;
    }

    public getValue(): number {
        return 12;
    }
}
