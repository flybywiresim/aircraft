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
                this.flightPhaseManager.dir.memory.fmaVerticalMode === 13 // OP DES
              || (
                  this.flightPhaseManager.dir.memory.fmaVerticalMode === 14 // VS
                && this.flightPhaseManager.dir.memory.vsSelected < 0
              )
              || (
                  this.flightPhaseManager.dir.memory.fmaVerticalMode === 15 // FPA
                && this.flightPhaseManager.dir.memory.fpaSelected < 0
              )
              || this.flightPhaseManager.dir.memory.fmaVerticalMode === 23 // DES
            )
            && this.flightPhaseManager.dir.memory.fcuSelectedAlt < 20000
            && this.flightPhaseManager.dir.memory.altitude > 10000
        );
    }

    public getValue(): number {
        return 7;
    }
}
