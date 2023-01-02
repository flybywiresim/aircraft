import { FlightPhase } from './FlightPhase';

export class PushbackPhase extends FlightPhase {
    /**
   * Tries to transition to `TAXI BEFORE TAKEOFF` phase.
   */
    public tryTransition(): void {
        if (
            this.flightPhaseManager.cids.onGround()
      && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'Number') < 75
      && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'Number') < 75
      && !SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public getValue(): number {
        return 2;
    }
}
