// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide, EfisVectorsGroup, GenericDataListenerSync } from '@flybywiresim/fbw-sdk';

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { PathVector, pathVectorLength, pathVectorValid } from '@fmgc/guidance/lnav/PathVector';
import { ArmedLateralMode, isArmed, LateralMode } from '@shared/autopilot';
import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { FlightPlanService } from '@fmgc/flightplanning/new/FlightPlanService';
import { EfisInterface } from '@fmgc/efis/EfisInterface';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/new/plans/ReadonlyFlightPlan';

const UPDATE_TIMER = 2_500;

export class EfisVectors {
    private syncer: GenericDataListenerSync = new GenericDataListenerSync();

    private lastFpVersions = new Map<number, number>();

    private lastEfisInterfaceVersion = undefined;

    constructor(
        private readonly flightPlanService: FlightPlanService,
        private guidanceController: GuidanceController,
        private efisInterface: EfisInterface,
    ) {
    }

    public forceUpdate() {
        this.updateTimer = UPDATE_TIMER + 1;
    }

    private updateTimer = 0;

    public update(deltaTime: number): void {
        this.updateTimer += deltaTime;

        if (this.updateTimer >= UPDATE_TIMER || this.efisInterface.version !== this.lastEfisInterfaceVersion) {
            this.lastEfisInterfaceVersion = this.efisInterface.version;
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
        const planExists = this.flightPlanService.has(planIndex);

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

        const plan = this.flightPlanService.get(planIndex);

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
                this.transmitGroup([], EfisVectorsGroup.DASHED);
            } else {
                this.transmitGroup([], EfisVectorsGroup.ACTIVE);
                this.transmitFlightPlan(plan, EfisVectorsGroup.DASHED, EfisVectorsGroup.MISSED, EfisVectorsGroup.ALTERNATE);
            }
            break;
        case FlightPlanIndex.Temporary:
            this.transmitFlightPlan(plan, EfisVectorsGroup.TEMPORARY);
            break;
        default:
            if (this.efisInterface.shouldTransmitSecondary()) {
                this.transmitFlightPlan(plan, EfisVectorsGroup.SECONDARY);
            } else {
                this.transmitGroup([], EfisVectorsGroup.SECONDARY);
            }
            break;
        }
    }

    private transmitFlightPlan(plan: ReadonlyFlightPlan, mainGroup: EfisVectorsGroup, missedApproachGroup = mainGroup, alternateGroup = mainGroup) {
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

        const vectors = geometry.getAllPathVectors(plan.activeLegIndex).filter((it) => EfisVectors.isVectorReasonable(it));

        // ACTIVE missed

        const transmitMissed = this.efisInterface.shouldTransmitMissed(plan.index);

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

        const transmitAlternate = this.efisInterface.shouldTransmitAlternate(plan.index);

        if (transmitAlternate) {
            const alternateGeometry = this.guidanceController.getGeometryForFlightPlan(plan.index, true);

            if (alternateGeometry) {
                const alternateVectors = alternateGeometry.getAllPathVectors(0).filter((it) => EfisVectors.isVectorReasonable(it));

                // ALTN missed

                const transmitAlternateMissed = this.efisInterface.shouldTransmitAlternateMissed(plan.index);

                if (transmitAlternateMissed) {
                    const missedVectors = alternateGeometry.getAllPathVectors(0, true).filter((it) => EfisVectors.isVectorReasonable(it));

                    alternateVectors.push(...missedVectors);
                }

                if (alternateGroup === mainGroup) {
                    vectors.push(...alternateVectors);
                } else {
                    this.transmitGroup(alternateVectors, alternateGroup);
                }
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
