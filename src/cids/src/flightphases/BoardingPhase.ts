import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. PUSHBACK
 * 2. TAXI BEFORE TAKEOFF
 * 3. DISEMBARKATION
 */
export class BoardingPhase extends FlightPhase {
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
            this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.boardingInProgress()
        );
    }

    public getValue(): number {
        return 1;
    }
}
