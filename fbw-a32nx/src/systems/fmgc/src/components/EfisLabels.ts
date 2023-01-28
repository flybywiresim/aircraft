// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanManager } from '@fmgc/wtsdk';
import { FlightLevel } from 'msfs-navdata';
import { FmgcComponent } from './FmgcComponent';

export class EfisLabels implements FmgcComponent {
    private lastTransitionAltitude: Feet;

    private lastTransitionLevel: FlightLevel;

    private flightPlanManager: FlightPlanManager;

    init(_baseInstrument: BaseInstrument, flightPlanManager: FlightPlanManager): void {
        this.flightPlanManager = flightPlanManager;
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
