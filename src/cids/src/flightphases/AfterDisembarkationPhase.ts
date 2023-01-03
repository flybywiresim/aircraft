import { FlightPhase } from './FlightPhase';

export class AfterDisembarkationPhase extends FlightPhase {
    /**
     * Tries to transition to `BOARDING`, `PUSHBACK` or `TAXI BEFORE TAKEOFF`.
     */
    public tryTransition(): void {
        if (this.flightPhaseManager.boardingPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.boardingPhase);
        } else if (this.flightPhaseManager.pushbackPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.pushbackPhase);
        } else if (this.flightPhaseManager.taxiBeforeTakeoffPhase.testConditions()) {
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public testConditions(): boolean {
        return this.flightPhaseManager.cids.getTotalPax() === 0;
    }

    public getValue(): number {
        return 12;
    }
}
