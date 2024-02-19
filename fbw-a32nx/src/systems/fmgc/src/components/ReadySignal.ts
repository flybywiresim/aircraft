import { FlightPlanManager } from '@fmgc/wtsdk';
import { FmgcComponent } from './FmgcComponent';

export class ReadySignal implements FmgcComponent {
    private baseInstrument: BaseInstrument = null;

    private updateThrottler = new A32NX_Util.UpdateThrottler(1000);

    init(baseInstrument: BaseInstrument, _flightPlanManager: FlightPlanManager): void {
        this.baseInstrument = baseInstrument;
    }

    update(deltaTime: number): void {
        if (this.updateThrottler.canUpdate(deltaTime) !== -1
            && this.baseInstrument.getGameState() === GameState.ingame
            && SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') !== 1) {
            // set ready signal that JS code is initialized and flight is actually started
            // -> user pressed 'READY TO FLY' button
            SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
        }
    }
}
