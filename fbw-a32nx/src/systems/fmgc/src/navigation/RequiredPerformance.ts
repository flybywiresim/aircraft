// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightArea } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanManager } from '@fmgc/index';

const rnpDefaults: Record<FlightArea, number> = {
    [FlightArea.Takeoff]: 1,
    [FlightArea.Terminal]: 1,
    [FlightArea.Enroute]: 2,
    [FlightArea.Oceanic]: 2,
    [FlightArea.VorApproach]: 0.5,
    [FlightArea.GpsApproach]: 0.3,
    [FlightArea.PrecisionApproach]: 0.5,
    [FlightArea.NonPrecisionApproach]: 0.5,
};

export class RequiredPerformance {
    activeRnp: number | undefined;

    requestLDev = false;

    manualRnp = false;

    constructor(private flightPlanManager: FlightPlanManager) {}

    update(_deltaTime: number): void {
        this.updateAutoRnp();

        this.updateLDev();
    }

    setPilotRnp(rnp): void {
        this.manualRnp = true;
        this.setActiveRnp(rnp);
    }

    clearPilotRnp(): void {
        this.manualRnp = false;
        this.updateAutoRnp();
    }

    private updateAutoRnp(): void {
        if (this.manualRnp) {
            return;
        }

        const area = this.flightPlanManager.activeArea;
        const rnp = rnpDefaults[area];

        if (rnp !== this.activeRnp) {
            this.setActiveRnp(rnp);
        }
    }

    private setActiveRnp(rnp: number): void {
        this.activeRnp = rnp;
        SimVar.SetSimVarValue('L:A32NX_FMGC_L_RNP', 'number', rnp ?? 0);
        SimVar.SetSimVarValue('L:A32NX_FMGC_R_RNP', 'number', rnp ?? 0);
    }

    private updateLDev(): void {
        const area = this.flightPlanManager.activeArea;
        const ldev = area !== FlightArea.Enroute
            && area !== FlightArea.Oceanic
            && this.activeRnp <= (0.3 + Number.EPSILON);
        if (ldev !== this.requestLDev) {
            this.requestLDev = ldev;
            SimVar.SetSimVarValue('L:A32NX_FMGC_L_LDEV_REQUEST', 'bool', this.requestLDev);
            SimVar.SetSimVarValue('L:A32NX_FMGC_R_LDEV_REQUEST', 'bool', this.requestLDev);
        }
    }
}
