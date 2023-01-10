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
            if (current.testConditions()) {
                this.sendNewFlightPhaseToManager(current);
            }
        });
    }

    public testConditions(): boolean {
        return (
            this.flightPhaseManager.cids.gearDownLocked()
            && this.flightPhaseManager.cids.flapsPosition().getBitValue(18)
            && (
                (
                    this.flightPhaseManager.cids.flapsPosition().getBitValue(22)
                    && this.flightPhaseManager.cids.gpwsConf3()
                )
                || this.flightPhaseManager.cids.flapsPosition().getBitValue(23)
            )
            && this.flightPhaseManager.cids.groundSpeed() >= 80
        );
    }

    public getValue(): number {
        return 9;
    }
}
