import { FlightPlanManager } from '@fmgc/wtsdk';
import { FmgcComponent } from './FmgcComponent';

export class ReadySignal implements FmgcComponent {
    init(_flightPlanManager: FlightPlanManager): void {
        SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
    }

    update(_deltaTime: number): void {
        // nothing to do right now
    }
}
