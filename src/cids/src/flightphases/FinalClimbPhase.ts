import { FlightPhase } from './FlightPhase';

export class FinalClimbPhase extends FlightPhase {
    /**
   * Tries to transition to `CRUISE` phase.
   */
    public tryTransition(): void {
        if (
            SimVar.GetSimVarValue('L:A32NX_FMA_CRUISE_ALT_MODE', 'bool')
          && !this.flightPhaseManager.cids.onGround()
          && !SimVar.GetSimVarValue('CABIN SEATBELTS ALERT SWITCH', 'bool')
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.cruisePhase);
        }
    }

    public getValue(): number {
        return 5;
    }
}
