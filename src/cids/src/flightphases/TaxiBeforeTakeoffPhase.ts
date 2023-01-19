import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. TAKEOFF AND INITIAL CLIMB
 * 2. DISEMBARKATION
 */
export class TaxiBeforeTakeoffPhase extends FlightPhase {
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
            && this.flightPhaseManager.dir.memory.groundSpeed > 0
            && this.flightPhaseManager.dir.memory.allDoorsClosedLocked
            && this.flightPhaseManager.dir.memory.thrustLever1Position < 75
            && this.flightPhaseManager.dir.memory.thrustLever2Position < 75
        );
    }

    public getValue(): number {
        return 3;
    }
}
