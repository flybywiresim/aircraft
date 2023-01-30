import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. FINAL CLIMB
 * 2. CRUISE PHASE
 * 3. FINAL APPROACH AND LANDING
 * 4. DISEMBARKATION
 */
export class TakeoffAndInitialClimbPhase extends FlightPhase {
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
            (
                this.flightPhaseManager.director.memory.thrustLever1Position >= 75
                && this.flightPhaseManager.director.memory.thrustLever2Position >= 75
            )
            && (
                this.flightPhaseManager.director.memory.onGround
                || this.flightPhaseManager.director.memory.altitude < 10000
            )
        );
    }

    public getValue(): number {
        return 4;
    }
}
