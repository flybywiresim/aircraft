// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightArea } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlanLeg } from '@fmgc/flightplanning/new/legs/FlightPlanLeg';
import { ApproachSegment } from '@fmgc/flightplanning/new/segments/ApproachSegment';
import { ApproachViaSegment } from '@fmgc/flightplanning/new/segments/ApproachViaSegment';
import { ArrivalEnrouteTransitionSegment } from '@fmgc/flightplanning/new/segments/ArrivalEnrouteTransitionSegment';
import { ArrivalSegment } from '@fmgc/flightplanning/new/segments/ArrivalSegment';
import { DepartureEnrouteTransitionSegment } from '@fmgc/flightplanning/new/segments/DepartureEnrouteTransitionSegment';
import { DepartureRunwayTransitionSegment } from '@fmgc/flightplanning/new/segments/DepartureRunwayTransitionSegment';
import { DepartureSegment } from '@fmgc/flightplanning/new/segments/DepartureSegment';
import { OriginSegment } from '@fmgc/flightplanning/new/segments/OriginSegment';
import { FlightPlanManager } from '@fmgc/index';
import { RequiredPerformance } from '@fmgc/navigation/RequiredPerformance';
import { ApproachType } from 'msfs-navdata';

export class Navigation {
    activeArea: FlightArea = FlightArea.Enroute;

    requiredPerformance: RequiredPerformance;

    currentPerformance: number | undefined;

    accuracyHigh: boolean = false;

    constructor(private flightPlanManager: FlightPlanManager) {
        this.requiredPerformance = new RequiredPerformance(this.flightPlanManager);
    }

    // eslint-disable-next-line no-empty-function
    init(): void {}

    update(deltaTime: number): void {
        this.updateFlightArea();

        this.requiredPerformance.update(this.activeArea, deltaTime);

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

    private updateFlightArea(): void {
        this.activeArea = this.getActiveFlightArea();
    }

    private getActiveFlightArea(): FlightArea {
        const activeLeg = FlightPlanService.active.activeLeg;
        if (!activeLeg || !(activeLeg instanceof FlightPlanLeg)) {
            return FlightArea.Enroute;
        }

        if (
            activeLeg.segment instanceof OriginSegment
            || activeLeg.segment instanceof DepartureRunwayTransitionSegment
        ) {
            return FlightArea.Takeoff;
        }

        if (
            activeLeg.segment instanceof DepartureSegment
            || activeLeg.segment instanceof DepartureEnrouteTransitionSegment
            || activeLeg.segment instanceof ArrivalEnrouteTransitionSegment
            || activeLeg.segment instanceof ArrivalSegment
        ) {
            return FlightArea.Terminal;
        }

        if (
            activeLeg.segment instanceof ApproachViaSegment
            || activeLeg.segment instanceof ApproachSegment
        ) {
            switch (FlightPlanService.active.approach?.type) {
            case ApproachType.Gls:
            case ApproachType.Ils:
            case ApproachType.Mls:
            case ApproachType.MlsTypeA:
            case ApproachType.MlsTypeBC:
                return FlightArea.PrecisionApproach;
            case ApproachType.Fms:
            case ApproachType.Gps:
            case ApproachType.Rnav:
                return FlightArea.GpsApproach;
            case ApproachType.VorDme:
            case ApproachType.Vor:
            case ApproachType.Vortac:
            case ApproachType.Tacan:
                return FlightArea.VorApproach;
            default:
                return FlightArea.NonPrecisionApproach;
            }
        }

        return FlightArea.Enroute;
    }
}
