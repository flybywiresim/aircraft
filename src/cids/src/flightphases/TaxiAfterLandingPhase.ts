import { FlightPhase } from './FlightPhase';

export class TaxiAfterLandingPhase extends FlightPhase {
    /**
   * Tries to transition to `DISEMBARKATION` phase.
   */
    public tryTransition(): void {
        if (
            this.flightPhaseManager.cids.onGround()
      && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
      && !SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool')
      && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') > 20
      && this.flightPhaseManager.cids.deboardingInProgess()
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.disembarkationPhase);
        }
    }

    public getValue(): number {
        return 10;
    }
}
