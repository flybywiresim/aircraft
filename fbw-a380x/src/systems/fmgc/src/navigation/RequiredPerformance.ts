// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { getFlightPhaseManager } from '@fmgc/flightphase';
import { FlightArea } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { FlightPlanManager } from '@fmgc/index';
import { FmgcFlightPhase } from '@shared/flightphase';

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
    activeArea: FlightArea = FlightArea.Enroute;

    activeRnp: number | undefined;

    requestLDev = false;

    manualRnp = false;

    constructor(private flightPlanManager: FlightPlanManager) {}

    update(activeArea: FlightArea, _deltaTime: number): void {
        this.activeArea = activeArea;

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

        let rnp;

        const activeLeg = FlightPlanService.active.activeLeg;
        if (activeLeg instanceof FlightPlanLeg) {
            if (activeLeg.rnp) {
                rnp = activeLeg.definition.rnp;
            }
        }

        if (!rnp) {
            rnp = rnpDefaults[this.activeArea] ?? 2;
        }

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
        const ldev = this.activeArea !== FlightArea.Enroute
            && this.activeArea !== FlightArea.Oceanic
            && this.activeRnp <= (0.3 + Number.EPSILON)
            && getFlightPhaseManager().phase >= FmgcFlightPhase.Takeoff;

        if (ldev !== this.requestLDev) {
            this.requestLDev = ldev;
            SimVar.SetSimVarValue('L:A32NX_FMGC_L_LDEV_REQUEST', 'bool', this.requestLDev);
            SimVar.SetSimVarValue('L:A32NX_FMGC_R_LDEV_REQUEST', 'bool', this.requestLDev);
        }
    }
}
