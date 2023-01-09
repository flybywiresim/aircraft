import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. BOARDING
 * 2. PUSHBACK
 * 3. TAXI BEFORE TAKEOFF
 */
export class AfterDisembarkationPhase extends FlightPhase {
    private nextFlightPhases: FlightPhase[];

    public init(...flightPhases: FlightPhase[]) {
        this.nextFlightPhases = flightPhases;
    }

    public tryTransition(): void {
        this.nextFlightPhases.forEach((current) => {
            console.log(`Attempting FP${current.getValue()}`);
            if (current.testConditions()) {
                console.log(`Sending FP${current.getValue()} to manager`);
                this.sendNewFlightPhaseToManager(current);
            }
        });
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.getTotalPax() === 0
            && this.flightPhaseManager.cids.isStationary()
        );
    }

    public getValue(): number {
        return 12;
    }
}
