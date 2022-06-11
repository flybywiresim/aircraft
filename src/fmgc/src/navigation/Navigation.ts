// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanManager } from '@fmgc/index';
import { RequiredPerformance } from '@fmgc/navigation/RequiredPerformance';

export class Navigation {
    requiredPerformance: RequiredPerformance;

    currentPerformance: number | undefined;

    accuracyHigh: boolean = false;

    constructor(private flightPlanManager: FlightPlanManager) {
        this.requiredPerformance = new RequiredPerformance(this.flightPlanManager);
    }

    // eslint-disable-next-line no-empty-function
    init(): void {}

    update(deltaTime: number): void {
        this.requiredPerformance.update(deltaTime);

        this.updateCurrentPerformance();
    }

    private updateCurrentPerformance(): void {
        const gs = SimVar.GetSimVarValue('GPS GROUND SPEED', 'knots');

        // FIXME fake it until we make it :D
        const estimate = 0.03 + Math.random() * 0.02 + gs * 0.00015;
        // basic IIR filter
        this.currentPerformance = this.currentPerformance === undefined ? estimate : this.currentPerformance * 0.9 + estimate * 0.1;

        const accuracyHigh = this.currentPerformance <= this.requiredPerformance.activeRnp;
        if (accuracyHigh !== this.accuracyHigh) {
            this.accuracyHigh = accuracyHigh;
            SimVar.SetSimVarValue('L:A32NX_FMGC_L_NAV_ACCURACY_HIGH', 'bool', this.accuracyHigh);
            SimVar.SetSimVarValue('L:A32NX_FMGC_R_NAV_ACCURACY_HIGH', 'bool', this.accuracyHigh);
        }
    }
}
