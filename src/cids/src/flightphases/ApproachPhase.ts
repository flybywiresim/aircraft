import { FlightPhase } from './FlightPhase';

export class ApproachPhase extends FlightPhase {
    /**
     * Tries to transition to `FINAL APPROACH AND LANDING`.
     */
    public tryTransition(): void {
        if (
            SimVar.GetSimVarValue('GEAR TOTAL PCT EXTENDED', 'percent') > 50
      && SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots') > 80
        ) {
            super.sendNewFlightPhaseToManager(this.flightPhaseManager.finalApprAndLandingPhase);
        }
    }

    public getValue(): number {
        return 8;
    }
}
