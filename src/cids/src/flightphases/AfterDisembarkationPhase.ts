import { FlightPhase } from './FlightPhase';

export class AfterDisembarkationPhase extends FlightPhase {
    /**
     * Tries to transition to `BOARDING`, `PUSHBACK` or `TAXI BEFORE TAKEOFF`.
     */
    public tryTransition(): void {
        if (
            this.flightPhaseManager.cids.onGround()
      && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
      && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') > 20
      && this.flightPhaseManager.cids.boardingInProgress()
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.boardingPhase);
        } else if (
            SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
      && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:3', 'percent') < 20
      && SimVar.GetSimVarValue('L:A32NX_FWD_DOOR_CARGO_LOCKED', 'bool')
      && this.flightPhaseManager.cids.onGround()
      && SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
      && SimVar.GetSimVarValue('L:A32NX_HYD_NW_STRG_DISC_ECAM_MEMO', 'bool')
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.pushbackPhase);
        } else if (
            this.flightPhaseManager.cids.onGround()
      && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_1', 'Number') < 75
      && SimVar.GetSimVarValue('L:A32NX_3D_THROTTLE_LEVER_POSITION_2', 'Number') < 75
      && !SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiBeforeTakeoffPhase);
        }
    }

    public getValue(): number {
        return 12;
    }
}
