import { FlightPhase } from './FlightPhase';

export class FinalApproachAndLandingPhase extends FlightPhase {
    /**
     * Tries to transition to `TAXI AFTER LANDING` phase.
     */
    public tryTransition(): void {
        if (
            this.flightPhaseManager.cids.onGround()
            && SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots') < 80
            && SimVar.GetSimVarValue('INTERACTIVE POINT OPEN:0', 'percent') < 20
            && !SimVar.GetSimVarValue('L:A32NX_IS_STATIONARY', 'bool')
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.taxiAfterLandingPhase);
        }
    }

    public getValue(): number {
        return 9;
    }
}
