import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. AFTER PASSENGER DISEMBARKATION
 */
export class DisembarkationPhase extends FlightPhase {
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
            this.flightPhaseManager.dir.memory.onGround
            && this.flightPhaseManager.dir.memory.groundSpeed < 1
            && this.flightPhaseManager.dir.deboardingInProgress
        );
    }

    public getValue(): number {
        return 11;
    }
}
