import { FlightPhase } from './FlightPhase';

/**
 * Possible next flight phases:
 * 1. APPROACH
 */
export class TopOfDescentPhase extends FlightPhase {
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
                this.flightPhaseManager.cids.fmaVerticalMode() === 13 // OP DES
              || (
                  this.flightPhaseManager.cids.fmaVerticalMode() === 14 // VS
                && this.flightPhaseManager.cids.vsSelected() < 0
              )
              || (
                  this.flightPhaseManager.cids.fmaVerticalMode() === 15 // FPA
                && this.flightPhaseManager.cids.fpaSelected() < 0
              )
              || this.flightPhaseManager.cids.fmaVerticalMode() === 23 // DES
            )
            && this.flightPhaseManager.cids.fcuSelectedAlt() < 20000
            && this.flightPhaseManager.cids.altitude() > 10000
        );
    }

    public getValue(): number {
        return 7;
    }
}
