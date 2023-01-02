import { FlightPhase } from './FlightPhase';

export class TopOfDescentPhase extends FlightPhase {
    /**
   * Tries to transition to `APPROACH` phase.
   */
    public tryTransition(): void {
        if (
            !this.flightPhaseManager.cids.onGround()
      && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < 10000
      && SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') < 50
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.apprPhase);
        }
    }

    public getValue(): number {
        return 7;
    }
}
