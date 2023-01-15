import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. TAXI AFTER LANDING
 */
export class FinalApproachAndLandingPhase extends FlightPhase {
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
            this.flightPhaseManager.dir.gearDownLocked
            && (
                (
                    this.flightPhaseManager.dir.flapsConfig === 3
                    && this.flightPhaseManager.dir.gpwsFlap3
                )
                || this.flightPhaseManager.dir.flapsConfig === 4
            )
            && this.flightPhaseManager.dir.groundSpeed >= 80
        );
    }

    public getValue(): number {
        return 9;
    }
}
