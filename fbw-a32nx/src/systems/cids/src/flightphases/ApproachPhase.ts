import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. FINAL APPROACH AND LANDING
 */
export class ApproachPhase extends FlightPhase {
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
            this.flightPhaseManager.director.memory.altitude <= 10000
            && !this.flightPhaseManager.director.memory.gearDownLocked
        );
    }

    public getValue(): number {
        return 8;
    }
}
