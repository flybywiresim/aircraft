import { FlightPlanManager } from '@fmgc/wtsdk';

export interface FmgcComponent {
    init(baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void;
    update(deltaTime: number): void;
}
