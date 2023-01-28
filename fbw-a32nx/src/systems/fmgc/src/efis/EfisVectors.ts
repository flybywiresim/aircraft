// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { EfisSide, EfisVectorsGroup } from '@shared/NavigationDisplay';
import { PathVector, pathVectorLength, pathVectorValid } from '@fmgc/guidance/lnav/PathVector';
import { ArmedLateralMode, isArmed, LateralMode } from '@shared/autopilot';
import { FlowEventSync } from '@shared/FlowEventSync';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { FlightPlan } from '@fmgc/flightplanning/new/plans/FlightPlan';

const UPDATE_TIMER = 2_500;

export class EfisVectors {
    private syncer: FlowEventSync = new FlowEventSync();

    private lastFpVersions = new Map<number, number>();

    constructor(
        private guidanceController: GuidanceController,
    ) {
    }

    public forceUpdate() {
        this.updateTimer = UPDATE_TIMER + 1;
    }

    private updateTimer = 0;

    public update(deltaTime: number): void {
        this.updateTimer += deltaTime;

        if (this.updateTimer >= UPDATE_TIMER) {
            this.updateTimer = 0;

            this.tryProcessFlightPlan(FlightPlanIndex.Active, true);
            this.tryProcessFlightPlan(FlightPlanIndex.Temporary, true);
            this.tryProcessFlightPlan(FlightPlanIndex.FirstSecondary, true);

            const activeFlightPlanVectors = this.guidanceController.activeGeometry?.getAllPathVectors(this.guidanceController.activeLegIndex) ?? [];

            const visibleActiveFlightPlanVectors = activeFlightPlanVectors
                .filter((vector) => EfisVectors.isVectorReasonable(vector));

            if (visibleActiveFlightPlanVectors.length !== activeFlightPlanVectors.length) {
                this.guidanceController.efisStateForSide.L.legsCulled = true;
                this.guidanceController.efisStateForSide.R.legsCulled = true;
            } else {
                this.guidanceController.efisStateForSide.L.legsCulled = false;
                this.guidanceController.efisStateForSide.R.legsCulled = false;
            }
        } else {
            this.tryProcessFlightPlan(FlightPlanIndex.Active);
            this.tryProcessFlightPlan(FlightPlanIndex.Temporary);
            this.tryProcessFlightPlan(FlightPlanIndex.FirstSecondary);
        }
    }

    /**
     * Protect against potential perf issues from immense vectors
     */
    private static isVectorReasonable(vector: PathVector): boolean {
        if (!pathVectorValid(vector)) {
            return false;
        }

        const length = pathVectorLength(vector);

        return length <= 5_000;
    }

    private tryProcessFlightPlan(planIndex: FlightPlanIndex, force = false) {
        const planExists = FlightPlanService.has(planIndex);

        if (!planExists) {
            this.lastFpVersions.delete(planIndex);

            switch (planIndex) {
            case FlightPlanIndex.Active:
                this.transmitGroup([], EfisVectorsGroup.ACTIVE);
                this.transmitGroup([], EfisVectorsGroup.DASHED);
                this.transmitGroup([], EfisVectorsGroup.MISSED);
                this.transmitGroup([], EfisVectorsGroup.ALTERNATE);
                break;
            case FlightPlanIndex.Temporary:
                this.transmitGroup([], EfisVectorsGroup.TEMPORARY);
                break;
            default:
                this.transmitGroup([], EfisVectorsGroup.SECONDARY);
                break;
            }
            return;
        }

        const plan = FlightPlanService.get(planIndex);

        if (!force && this.lastFpVersions.get(planIndex) === plan.version) {
            return;
        }

        this.lastFpVersions.set(planIndex, plan.version);

        switch (planIndex) {
        case FlightPlanIndex.Active:
            const engagedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number') as LateralMode;
            const armedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_ARMED', 'Enum');
            const navArmed = isArmed(armedLateralMode, ArmedLateralMode.NAV);

            const transmitActive = engagedLateralMode === LateralMode.NAV || engagedLateralMode === LateralMode.LOC_CPT || engagedLateralMode === LateralMode.LOC_TRACK || navArmed;

            if (transmitActive) {
                this.transmitFlightPlan(plan, EfisVectorsGroup.ACTIVE, EfisVectorsGroup.MISSED, EfisVectorsGroup.ALTERNATE);
            } else {
                this.transmitFlightPlan(plan, EfisVectorsGroup.DASHED, EfisVectorsGroup.MISSED, EfisVectorsGroup.ALTERNATE);
            }
            break;
        case FlightPlanIndex.Temporary:
            this.transmitFlightPlan(plan, EfisVectorsGroup.TEMPORARY);
            break;
        default:
            this.transmitFlightPlan(plan, EfisVectorsGroup.SECONDARY);
            break;
        }
    }

    private transmitFlightPlan(plan: FlightPlan, mainGroup: EfisVectorsGroup, missedApproachGroup = mainGroup, alternateGroup = mainGroup) {
        const planCentreIndex = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT_INDEX', 'number');
        const planCentreFpIndex = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT_FP_INDEX', 'number');
        const planCentreInAlternate = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT_IN_ALTERNATE', 'Bool');

        if (!this.guidanceController.hasGeometryForFlightPlan(plan.index)) {
            this.transmitGroup([], mainGroup);

            if (missedApproachGroup !== mainGroup) {
                this.transmitGroup([], missedApproachGroup);
            }

            if (alternateGroup !== mainGroup) {
                this.transmitGroup([], alternateGroup);
            }

            return;
        }

        // ACTIVE

        const geometry = this.guidanceController.getGeometryForFlightPlan(plan.index);

        const vectors = geometry.getAllPathVectors(0).filter((it) => EfisVectors.isVectorReasonable(it));

        const planIsBeingScrolledInto = planCentreFpIndex === plan.index;

        // ACTIVE missed

        const missedApproachInView = plan.firstMissedApproachLegIndex - planCentreIndex < 4;
        const transmitMissed = planIsBeingScrolledInto && !planCentreInAlternate && missedApproachInView;

        if (transmitMissed) {
            const missedVectors = geometry.getAllPathVectors(0, true).filter((it) => EfisVectors.isVectorReasonable(it));

            if (missedApproachGroup === mainGroup) {
                vectors.push(...missedVectors);
            } else {
                this.transmitGroup(missedVectors, missedApproachGroup);
            }
        } else if (missedApproachGroup !== mainGroup) {
            this.transmitGroup([], missedApproachGroup);
        }

        this.transmitGroup(vectors, mainGroup);

        // ALTN

        const transmitAlternate = plan.alternateDestinationAirport && plan.alternateFlightPlan.legCount > 0;

        if (transmitAlternate) {
            const alternateGeometry = this.guidanceController.getGeometryForFlightPlan(plan.index, true);

            if (alternateGeometry) {
                const alternateVectors = alternateGeometry.getAllPathVectors(0).filter((it) => EfisVectors.isVectorReasonable(it));

                // ALTN missed

                const altnMissedApproachInView = plan.alternateFlightPlan.firstMissedApproachLegIndex - planCentreIndex < 4;
                const transmitAlternateMissed = planIsBeingScrolledInto && planCentreInAlternate && altnMissedApproachInView;

                if (transmitAlternateMissed) {
                    const missedVectors = alternateGeometry.getAllPathVectors(0, true).filter((it) => EfisVectors.isVectorReasonable(it));

                    alternateVectors.push(...missedVectors);
                }

                this.transmitGroup(alternateVectors, alternateGroup);
            } else if (alternateGroup !== mainGroup) {
                this.transmitGroup([], alternateGroup);
            }
        } else if (alternateGroup !== mainGroup) {
            this.transmitGroup([], alternateGroup);
        }
    }

    private transmitGroup(vectors: PathVector[], group: EfisVectorsGroup): void {
        this.transmit(vectors, group, 'L');
        this.transmit(vectors, group, 'R');
    }

    private transmit(vectors: PathVector[], vectorsGroup: EfisVectorsGroup, side: EfisSide): void {
        this.syncer.sendEvent(`A32NX_EFIS_VECTORS_${side}_${EfisVectorsGroup[vectorsGroup]}`, vectors);
    }
}
