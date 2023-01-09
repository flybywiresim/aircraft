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
            if (current.testConditions()) {
                this.sendNewFlightPhaseToManager(current);
            }
        });
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.deboardingInProgess()
        );
    }

    public getValue(): number {
        return 11;
    }
}
