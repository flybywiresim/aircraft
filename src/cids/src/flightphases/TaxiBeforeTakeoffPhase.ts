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
            this.sendNewFlightPhaseToManager(this.flightPhaseManager.takeoffAndInitClimbPhase);
        }
    }

    public testConditions(): boolean {
        return (
            !this.flightPhaseManager.cids.isStationary()
            && this.flightPhaseManager.cids.onGround()
            && this.flightPhaseManager.cids.thrustLever1Position() < 75
            && this.flightPhaseManager.cids.thrustLever2Position() < 75
        );
    }

    public getValue(): number {
        return 3;
    }
}
