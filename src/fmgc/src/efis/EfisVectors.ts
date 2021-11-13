import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { EfisSide, EfisVectorsGroup, Mode } from '@shared/NavigationDisplay';
import { ArcPathVector, LinePathVector, PathVector } from '@fmgc/guidance/lnav/PathVector';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { LateralMode } from '@shared/autopilot';
import { withinEditArea } from '@fmgc/efis/EfisCommon';
import { TaskCategory } from '@fmgc/guidance/TaskQueue';

const TRANSMIT_GROUP_SIZE = 4;

const UPDATE_TIMER = 2_500;

export class EfisVectors {
    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    constructor(
        private guidanceController: GuidanceController,
    ) {
    }

    private currentActiveVectors = [];

    private currentDashedVectors = [];

    private currentTemporaryVectors = [];

    public forceUpdate() {
        this.updateTimer = UPDATE_TIMER * 0.8;
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

        const activeFlightPlanVectors = this.guidanceController.activeGeometry?.getAllPathVectors() ?? [];
        const temporaryFlightPlanVectors = this.guidanceController.temporaryGeometry?.getAllPathVectors() ?? [];

        const visibleActiveFlightPlanVectors = activeFlightPlanVectors
            .filter((vector) => this.vectorWithinCurrentEditArea(vector, 'L') || this.vectorWithinCurrentEditArea(vector, 'R'));
        const visibleTemporaryFlightPlanVectors = temporaryFlightPlanVectors
            .filter((vector) => this.vectorWithinCurrentEditArea(vector, 'L') || this.vectorWithinCurrentEditArea(vector, 'R'));

        // ACTIVE

        const engagedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_MODE', 'Number') as LateralMode;
        const armedLateralMode = SimVar.GetSimVarValue('L:A32NX_FMA_LATERAL_ARMED', 'Enum');
        const navArmed = (armedLateralMode >> 0) & 1;

        const transmitActive = engagedLateralMode === LateralMode.NAV || navArmed;
        const clearActive = !transmitActive && this.currentActiveVectors.length > 0;

        if (transmitActive) {
            this.currentActiveVectors = visibleActiveFlightPlanVectors;

            this.transmitGroup(this.currentActiveVectors, EfisVectorsGroup.ACTIVE);
        }

        if (clearActive) {
            this.currentActiveVectors = [];

            this.transmitGroup(this.currentActiveVectors, EfisVectorsGroup.ACTIVE);
        }

        // DASHED

        const transmitDashed = !transmitActive; // TODO offset consideration
        const clearDashed = !transmitDashed && this.currentDashedVectors.length > 0;

        if (transmitDashed) {
            this.currentDashedVectors = visibleActiveFlightPlanVectors;

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
            this.currentTemporaryVectors = visibleTemporaryFlightPlanVectors;

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

    private vectorWithinCurrentEditArea(vector: PathVector, efisSide: EfisSide): boolean {
        const mode = this.guidanceController.efisStateForSide[efisSide].mode;
        const range = this.guidanceController.efisStateForSide[efisSide].range;

        const ppos = this.guidanceController.lnavDriver.ppos;
        const planCentre = this.guidanceController.focusedWaypointCoordinates;

        const trueHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');

        const startWithin = withinEditArea(vector.startPoint, range, mode, mode === Mode.PLAN ? planCentre : ppos, trueHeading);

        if ((vector as any).endPoint) {
            const endWithin = withinEditArea((vector as (LinePathVector | ArcPathVector)).endPoint ?? { lat: 0, long: 0 }, range, mode, mode === Mode.PLAN ? planCentre : ppos, trueHeading);

            return startWithin || endWithin;
        }

        return startWithin;
    }

    private transmitGroup(vectors: PathVector[], group: EfisVectorsGroup): void {
        this.transmit(vectors, group, 'L');
        this.transmit(vectors, group, 'R');
    }

    private transmit(vectors: PathVector[], vectorsGroup: EfisVectorsGroup, side: EfisSide): void {
        this.guidanceController.taskQueue.runStepTask({
            category: TaskCategory.EfisVectors,
            tag: EfisVectorsGroup[vectorsGroup],
            executor: function* task() {
                const numGroups = Math.floor(vectors.length / TRANSMIT_GROUP_SIZE);

                if (LnavConfig.DEBUG_PATH_DRAWING) {
                    console.log(`[FMS/Vectors/Transmit] Starting transmit: numVectors=${vectors.length} groupSize=${TRANSMIT_GROUP_SIZE} numGroups=${numGroups}`);
                }

                for (let i = 0; i < numGroups; i++) {
                    this.listener.triggerToAllSubscribers(
                        `A32NX_EFIS_VECTORS_${side}_${EfisVectorsGroup[vectorsGroup]}`,
                        vectors.slice(i * TRANSMIT_GROUP_SIZE, (i + 1) * TRANSMIT_GROUP_SIZE),
                        i * TRANSMIT_GROUP_SIZE,
                    );
                    if (LnavConfig.DEBUG_PATH_DRAWING) {
                        console.log(`[FMS/Vectors/Transmit] Transmitted group #${i}...`);
                    }
                    yield;
                }

                const lastStartIndex = numGroups * TRANSMIT_GROUP_SIZE;

                this.listener.triggerToAllSubscribers(
                    `A32NX_EFIS_VECTORS_${side}_${EfisVectorsGroup[vectorsGroup]}`,
                    vectors.slice(lastStartIndex, vectors.length),
                    lastStartIndex,
                    true,
                );

                if (LnavConfig.DEBUG_PATH_DRAWING) {
                    console.log('[FMS/Vectors/Transmit] Done with transmit.');
                }
            }.bind(this),
        });
    }
}
