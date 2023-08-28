// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightLevel } from 'msfs-navdata';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FmgcComponent } from './FmgcComponent';

export class EfisLabels implements FmgcComponent {
    private lastTransitionAltitude: Feet;

    private lastTransitionLevel: FlightLevel;

    init(_baseInstrument: BaseInstrument, _flightPlanService: FlightPlanService): void {
    }

    update(_deltaTime: number): void {
        const transitionAltitude = 18_000;
        const transitionLevel = 180;

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
