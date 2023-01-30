import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. TOP OF DESCENT
 * 2. APPROACH
 */
export class CruisePhase extends FlightPhase {
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
        return this.flightPhaseManager.director.memory.altCrzActive;
    }

    public getValue(): number {
        return 6;
    }
}
