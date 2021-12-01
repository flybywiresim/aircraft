import { FlightPlanManager } from '@fmgc/wtsdk';

export interface FmgcComponent {

    init(flightPlanManager: FlightPlanManager): void;

    update(deltaTime: number): void;

}
