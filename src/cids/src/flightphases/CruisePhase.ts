import { FlightPhase } from './FlightPhase';

export class CruisePhase extends FlightPhase {
    /**
   * Tries to transition to `TOP OF DESCENT` or `APPROACH` phase.
   */
    public tryTransition(): void {
        if (
            !this.flightPhaseManager.cids.onGround()
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < (SimVar.GetSimVarValue('AIRLINER_CRUISE_ALTITUDE', 'feet') - 500)
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') > 10000
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.todPhase);
        } else if (
            !this.flightPhaseManager.cids.onGround()
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < 10000
          && SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') < 50
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.apprPhase);
        }
    }

    public getValue(): number {
        return 6;
    }
}
