// Copyright (c) 2021 FlyByWire Simulations
// Copyright (c) 2021 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { EfisSide, EfisVectorsGroup, Mode, RangeSetting, rangeSettings } from '@shared/NavigationDisplay';
import { PathVector, pathVectorLength, PathVectorType, pathVectorValid } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { ArmedLateralMode, isArmed, LateralMode } from '@shared/autopilot';
import { FlowEventSync } from '@shared/FlowEventSync';
import { linePortionWithinEditArea, withinEditArea } from '@fmgc/efis/EfisCommon';
import { Coordinates } from '@fmgc/flightplanning/data/geo';

const UPDATE_TIMER = 2_500;

export class EfisVectors {
    private syncer: FlowEventSync = new FlowEventSync();

    constructor(
        private guidanceController: GuidanceController,
    ) {
    }

    private currentActiveVectors: PathVector[] = [];

    private currentDashedVectors: PathVector[] = [];

    private currentTemporaryVectors: PathVector[] = [];

    public forceUpdate() {
        this.updateTimer = UPDATE_TIMER + 1;
    }

    private updateTimer = 0;

    public update(deltaTime: number): void {
        this.updateTimer += deltaTime;

        if (this.updateTimer < UPDATE_TIMER) {
            return;
        }

        this.updateTimer = 0;

        if (LnavConfig.DEBUG_PERF) {
            console.time('vectors transmit');
        }

        const activeFlightPlanVectors = this.guidanceController.activeGeometry?.getAllPathVectors(this.guidanceController.activeLegIndex) ?? [];
        const temporaryFlightPlanVectors = this.guidanceController.temporaryGeometry?.getAllPathVectors(this.guidanceController.temporaryLegIndex) ?? [];

        const visibleActiveFlightPlanVectors = activeFlightPlanVectors
            .filter((vector) => EfisVectors.isVectorReasonable(vector));
        const visibleTemporaryFlightPlanVectors = temporaryFlightPlanVectors
            .filter((vector) => EfisVectors.isVectorReasonable(vector));

        if (visibleActiveFlightPlanVectors.length !== activeFlightPlanVectors.length) {
            this.guidanceController.efisStateForSide.L.legsCulled = true;
            this.guidanceController.efisStateForSide.R.legsCulled = true;
        } else {
            this.guidanceController.efisStateForSide.L.legsCulled = false;
            this.guidanceController.efisStateForSide.R.legsCulled = false;
        }

        // TODO ${side}
        const range = rangeSettings[SimVar.GetSimVarValue('L:A32NX_EFIS_L_ND_RANGE', 'number')];
        const mode: Mode = SimVar.GetSimVarValue('L:A32NX_EFIS_L_ND_MODE', 'number');

        let mapCentre: Coordinates;
        let mapUp = 0;
        if (mode === Mode.PLAN) {
            const planCentreIndex = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT', 'number');
            mapCentre = this.guidanceController.flightPlanManager.getWaypoint(planCentreIndex)?.infos.coordinates;
        }
        if (!mapCentre) {
            mapCentre = {
                lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
                long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
            };
            mapUp = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');
        }

        // filter vectors outside edit area
        const transmittedActiveFlightPlanVectors = EfisVectors.getVectorsWithinEditArea(visibleActiveFlightPlanVectors, range, mode, mapCentre, mapUp);
        const transmittedTemporaryFlightPlanVectors = EfisVectors.getVectorsWithinEditArea(visibleTemporaryFlightPlanVectors, range, mode, mapCentre, mapUp);

        // ACTIVE

        const engagedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number') as LateralMode;
        const armedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_ARMED', 'Enum');
        const navArmed = isArmed(armedLateralMode, ArmedLateralMode.NAV);

        const transmitActive = engagedLateralMode === LateralMode.NAV || engagedLateralMode === LateralMode.LOC_CPT || engagedLateralMode === LateralMode.LOC_TRACK || navArmed;
        const clearActive = !transmitActive && this.currentActiveVectors.length > 0;

        if (transmitActive) {
            this.currentActiveVectors = transmittedActiveFlightPlanVectors;

            this.transmitGroup(this.currentActiveVectors, EfisVectorsGroup.ACTIVE);
        }

        if (clearActive) {
            this.currentActiveVectors = [];

            this.transmitGroup(this.currentActiveVectors, EfisVectorsGroup.ACTIVE);
        }

        // DASHED

        const transmitDashed = !transmitActive;
        const clearDashed = !transmitDashed && this.currentDashedVectors.length > 0;

        if (transmitDashed) {
            this.currentDashedVectors = transmittedActiveFlightPlanVectors;

            this.transmitGroup(this.currentDashedVectors, EfisVectorsGroup.DASHED);
        }

        if (clearDashed) {
            this.currentDashedVectors = [];

            this.transmitGroup(this.currentDashedVectors, EfisVectorsGroup.DASHED);
        }

        // TEMPORARY

        const transmitTemporary = this.guidanceController.hasTemporaryFlightPlan && this.guidanceController.temporaryGeometry?.legs?.size > 0;
        const clearTemporary = !transmitTemporary && this.currentTemporaryVectors.length > 0;

        if (transmitTemporary) {
            this.currentTemporaryVectors = transmittedTemporaryFlightPlanVectors;

            this.transmitGroup(this.currentTemporaryVectors, EfisVectorsGroup.TEMPORARY);
        }

        if (clearTemporary) {
            this.currentTemporaryVectors = [];

            this.transmitGroup(this.currentTemporaryVectors, EfisVectorsGroup.TEMPORARY);
        }

        if (LnavConfig.DEBUG_PERF) {
            console.timeEnd('vectors transmit');
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

    private static getVectorsWithinEditArea(vectors: PathVector[], range: RangeSetting, mode: Mode, mapCentre: Coordinates, mapUp: DegreesTrue): PathVector[] {
        return vectors.reduce((allVectors: PathVector[], vector: PathVector) => {
            if (vector.type === PathVectorType.Line) {
                const endpointsInEditArea = linePortionWithinEditArea(vector.startPoint, vector.endPoint, range, mode, mapCentre);
                if (endpointsInEditArea !== undefined) {
                    allVectors.push({
                        type: PathVectorType.Line,
                        startPoint: endpointsInEditArea[0],
                        endPoint: endpointsInEditArea[1],
                    });
                }
            } else if (
                withinEditArea(vector.startPoint, range, mode, mapCentre, mapUp)
                || 'endPoint' in vector && withinEditArea(vector.endPoint!, range, mode, mapCentre, mapUp)
                || 'centrePoint' in vector && withinEditArea(vector.centrePoint!, range, mode, mapCentre, mapUp)
            ) {
                allVectors.push(vector);
            }
            return allVectors;
        }, []);
    }

    private transmitGroup(vectors: PathVector[], group: EfisVectorsGroup): void {
        this.transmit(vectors, group, 'L');
        this.transmit(vectors, group, 'R');
    }

    private transmit(vectors: PathVector[], vectorsGroup: EfisVectorsGroup, side: EfisSide): void {
        this.syncer.sendEvent(`A32NX_EFIS_VECTORS_${side}_${EfisVectorsGroup[vectorsGroup]}`, vectors);
    }
}
