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
            console.log(`Attempting to transition to FP${current.getValue()}.`);
            if (current.testConditions()) {
                console.log(`Sending FP${current.getValue()} to manager`);
                this.sendNewFlightPhaseToManager(current);
            }
        });
    }

    public testConditions(): boolean {
        return (
            (
                this.flightPhaseManager.cids.thrustLever1Position() >= 75
                && this.flightPhaseManager.cids.thrustLever2Position() >= 75
            )
            && (
                this.flightPhaseManager.cids.onGround()
                || this.flightPhaseManager.cids.altitude() < 10000
            )
        );
    }

    public getValue(): number {
        return 4;
    }
}
