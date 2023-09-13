import { FlightPlanManager } from '@fmgc/wtsdk';
import { Arinc429SignStatusMatrix, Arinc429Word } from '@flybywiresim/fbw-sdk';
import { FmgcComponent } from './FmgcComponent';

export class EfisLabels implements FmgcComponent {
    private lastTransitionAltitude: Feet;

    private lastTransitionLevel: number;

    private flightPlanManager: FlightPlanManager;

    init(_baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void {
        this.flightPlanManager = flightPlanManager;
    }

    update(_deltaTime: number): void {
        const transitionAltitude = this.flightPlanManager.originTransitionAltitude;
        const transitionLevel = this.flightPlanManager.destinationTransitionLevel;

        if (transitionAltitude !== this.lastTransitionAltitude) {
            Arinc429Word.toSimVarValue(
                'L:A32NX_FM1_TRANS_ALT', transitionAltitude ?? 0, transitionAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            );
            Arinc429Word.toSimVarValue(
                'L:A32NX_FM2_TRANS_ALT', transitionAltitude ?? 0, transitionAltitude !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            );

            this.lastTransitionAltitude = transitionAltitude;
        }

        if (transitionLevel !== this.lastTransitionLevel) {
            Arinc429Word.toSimVarValue(
                'L:A32NX_FM1_TRANS_LVL', transitionLevel ?? 0, transitionLevel !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            );
            Arinc429Word.toSimVarValue(
                'L:A32NX_FM2_TRANS_LVL', transitionLevel ?? 0, transitionLevel !== undefined ? Arinc429SignStatusMatrix.NormalOperation : Arinc429SignStatusMatrix.NoComputedData,
            );

            this.lastTransitionLevel = transitionLevel;
        }
    }
}
