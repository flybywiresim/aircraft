import { FlightPhase } from './FlightPhase';

export class TakeoffAndInitialClimbPhase extends FlightPhase {
    /**
   * Tries to transition to `FINAL CLIMB` or `DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (
            !this.flightPhaseManager.cids.onGround()
          && SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') > 10000
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.finalClimbPhase);
        } else if (
            this.flightPhaseManager.cids.onGround()
          && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
          && !SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool')
          && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') > 20
          && this.flightPhaseManager.cids.deboardingInProgess()
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiAfterLandingPhase);
        }
    }

    public getValue(): number {
        return 4;
    }
}
