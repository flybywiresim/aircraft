import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. TAXI BEFORE TAKEOFF
 * 2. DISEMBARKATION
 */
export class PushbackPhase extends FlightPhase {
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
            && this.flightPhaseManager.dir.memory.allDoorsClosedLocked
            && this.flightPhaseManager.dir.memory.nwStrgPinInserted
        );
    }

    public getValue(): number {
        return 2;
    }
}
