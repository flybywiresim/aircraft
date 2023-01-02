import { FlightPhase } from './FlightPhase';

export class TaxiBeforeTakeoffPhase extends FlightPhase {
    /**
   * Tries to transition to `TAKEOFF AND INITIAL CLIMB` phase.
   */
    public tryTransition(): void {
        if (
            SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'Number') > 74
      && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'Number') > 74
      && (
          this.flightPhaseManager.cids.onGround()
          || SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet') < 10000
      )
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.takeoffAndInitClimbPhase);
        }
    }

    public getValue(): number {
        return 3;
    }
}
