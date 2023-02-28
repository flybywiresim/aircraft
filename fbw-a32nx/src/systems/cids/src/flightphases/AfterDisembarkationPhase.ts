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
            this.flightPhaseManager.director.totalPax === 0
            && this.flightPhaseManager.director.memory.groundSpeed < 1
        );
    }

    public getValue(): number {
        return 12;
    }
}
