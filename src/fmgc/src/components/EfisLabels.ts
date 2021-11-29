import { FlightLevel } from '@fmgc/guidance/vnav/verticalFlightPlan/VerticalFlightPlan';
import { FmgcComponent } from '@fmgc/lib/FmgcComponent';
import { FlightPlanManager } from '@fmgc/wtsdk';

export class EfisLabels implements FmgcComponent {
    private lastTransitionAltitude: Feet;

    private lastTransitionLevel: FlightLevel;

    private flightPlanManager: FlightPlanManager;

    init(flightPlanManager: FlightPlanManager): void {
        this.flightPlanManager = flightPlanManager;
    }

    update(_deltaTime: number): void {
        const transitionAltitude = this.flightPlanManager.originTransitionAltitude;
        const transitionLevel = this.flightPlanManager.destinationTransitionLevel;

        // FIXME ARINC429 when the PR adding a TS impl. lands...
        if (transitionAltitude !== this.lastTransitionAltitude) {
            SimVar.SetSimVarValue('L:AIRLINER_TRANS_ALT', 'Number', transitionAltitude ?? 0);
            this.lastTransitionAltitude = transitionAltitude;
        }

        if (transitionLevel !== this.lastTransitionLevel) {
            SimVar.SetSimVarValue('L:AIRLINER_APPR_TRANS_ALT', 'Number', (transitionLevel ?? 0) * 100);
            this.lastTransitionLevel = transitionLevel;
        }
    }
}
