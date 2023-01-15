import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. CRUISE
 * 2. FINAL APPROACH AND LANDING
 */
export class FinalClimbPhase extends FlightPhase {
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
            this.flightPhaseManager.dir.altitude > 10000
            && this.flightPhaseManager.dir.altitude < this.flightPhaseManager.dir.cruiseAltitude
            && !this.flightPhaseManager.dir.altCrzActive
        );
    }

    public getValue(): number {
        return 5;
    }
}
