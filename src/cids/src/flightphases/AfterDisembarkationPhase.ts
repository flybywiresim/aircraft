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
            if (current.shouldActivate()) {
                this.sendNewFlightPhaseToManager(current);
            }
        });
    }

    public shouldActivate(): boolean {
        return (
            this.flightPhaseManager.cids.totalPax() === 0
            && this.flightPhaseManager.cids.isStationary()
        );
    }

    public getValue(): number {
        return 12;
    }
}
