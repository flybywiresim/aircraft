import { AltitudeConstraintType } from '@fmgc/guidance/lnav/legs';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { Predictions, StepResults, VnavStepError } from '@fmgc/guidance/vnav/Predictions';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { DescentAltitudeConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';

export class GeometricPathBuilder {
    constructor(
        private observer: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
    ) { }

    buildGeometricPath(sequence: TemporaryCheckpointSequence, profile: BaseGeometryProfile, speedProfile: SpeedProfile, windProfile: HeadwindProfile, finalCruiseAltitude: Feet) {
        const constraintsToUse = profile.descentAltitudeConstraints
            .slice()
            .filter(
                (constraint) => this.isConstraintBelowCruisingAltitude(constraint, finalCruiseAltitude)
                    && constraint.distanceFromStart < sequence.lastCheckpoint.distanceFromStart,
            );

        constraintsToUse.sort((a, b) => b.distanceFromStart - a.distanceFromStart);

        const planner = new GeometricPathPlanner(
            this.observer,
            this.atmosphericConditions,
            windProfile,
            speedProfile,
            constraintsToUse,
            sequence.lastCheckpoint,
            finalCruiseAltitude,
        );

        for (let i = 0; i < 100 && planner.currentConstraintIndex < constraintsToUse.length; i++) {
            planner.stepAlong();
        }

        planner.finalize(sequence);
    }

    isConstraintBelowCruisingAltitude(constraint: DescentAltitudeConstraint, finalCruiseAltitude: Feet): boolean {
        if (constraint.constraint.type === AltitudeConstraintType.at) {
            return constraint.constraint.altitude1 <= finalCruiseAltitude;
        } if (constraint.constraint.type === AltitudeConstraintType.atOrAbove) {
            return constraint.constraint.altitude1 <= finalCruiseAltitude;
        } if (constraint.constraint.type === AltitudeConstraintType.atOrBelow) {
            return true;
        } if (constraint.constraint.type === AltitudeConstraintType.range) {
            return constraint.constraint.altitude2 <= finalCruiseAltitude;
        }

        return true;
    }
}

class GeometricPathPlanner {
    public currentConstraintIndex: number = 0;

    // Positive means the altitude could be moved higher
    private altitudeAvailableByConstraint: Feet[][];

    private steps: StepResults[];

    public currentCheckpoint: VerticalCheckpoint = null;

    /**
     * Defines the maximum altitude to be at each constraint such that it is possible to meet the other constraints
     * E.g There's an atOrAbove constraint (10000+) 50 NM along track, and an atOrBelow constraint (12000-) 40 NM along track,
     * we don't want to be above 12000 at the 10000+ constraint. Otherwise, we'll have to climb in the descent.
     */
    private maxAltitudeConstraints: Feet[];

    private speedBrakeRequests: boolean[];

    constructor(
        private observer: VerticalProfileComputationParametersObserver,
        private atmosphericConditions: AtmosphericConditions,
        private windProfile: HeadwindProfile,
        private speedProfile: SpeedProfile,
        private constraints: DescentAltitudeConstraint[],
        private startingPoint: VerticalCheckpoint,
        private finalCruiseAltitude: Feet,
    ) {
        this.currentCheckpoint = { ...startingPoint };

        this.altitudeAvailableByConstraint = new Array(this.constraints.length);
        this.steps = new Array(this.constraints.length);
        this.speedBrakeRequests = new Array(this.constraints.length);

        this.maxAltitudeConstraints = this.findCumulativeMaxAltitudes(this.constraints.slice().reverse());
        // TODO: Sort this while computing
        this.maxAltitudeConstraints.reverse();
    }

    stepAlong() {
        const constraintAlongTrack = this.constraints[this.currentConstraintIndex];

        if (constraintAlongTrack.distanceFromStart > this.currentCheckpoint.distanceFromStart) {
            throw new Error('[FMS/VNAV] Constraint does not lie in descent path');
        }

        if (constraintAlongTrack.constraint.type === AltitudeConstraintType.at) {
            this.stepToAtConstraint();
        } else if (constraintAlongTrack.constraint.type === AltitudeConstraintType.atOrAbove) {
            if (!this.speedBrakeRequests[this.currentConstraintIndex]) {
                this.speedBrakeRequests[this.currentConstraintIndex] = false;
            }

            this.prepareIdleStep();

            const endsUpTooHighForUpcomingConstraint = this.currentCheckpoint.altitude > this.maxAltitudeConstraints[this.currentConstraintIndex - 1];
            if (endsUpTooHighForUpcomingConstraint) {
                this.resetToIndex(this.currentConstraintIndex - 1);
                this.prepareGeometricStep(this.maxAltitudeConstraints[this.currentConstraintIndex]);

                return;
            }

            const altError = this.currentCheckpoint.altitude - constraintAlongTrack.constraint.altitude1;
            // If constraint is met
            if (altError > 0) {
                return;
            }

            // If this doesn't work, try speed brakes
            if (!this.speedBrakeRequests[this.currentConstraintIndex - 1]) {
                this.speedBrakeRequests[this.currentConstraintIndex - 1] = true;
                this.resetToIndex(this.currentConstraintIndex - 1);
            } else {
                // Insert path too steep at this point
                this.steps[this.currentConstraintIndex - 1].error = VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT;
            }
        } else if (constraintAlongTrack.constraint.type === AltitudeConstraintType.atOrBelow) {
            this.prepareIdleStep();

            const maxAltitude = Math.min(this.maxAltitudeConstraints[this.currentConstraintIndex - 1], constraintAlongTrack.constraint.altitude1);
            const endsUpTooHigh = this.currentCheckpoint.altitude > maxAltitude;
            if (endsUpTooHigh) {
                this.resetToIndex(this.currentConstraintIndex - 1);
                this.prepareGeometricStep(maxAltitude);
            }
        } else if (constraintAlongTrack.constraint.type === AltitudeConstraintType.range) {
            this.prepareIdleStep();

            const maxAltitude = Math.min(this.maxAltitudeConstraints[this.currentConstraintIndex - 1], constraintAlongTrack.constraint.altitude1);

            const endsUpTooHigh = this.currentCheckpoint.altitude > maxAltitude;
            const endsUpTooLow = this.currentCheckpoint.altitude < constraintAlongTrack.constraint.altitude2;

            if (endsUpTooHigh) {
                this.resetToIndex(this.currentConstraintIndex - 1);
                this.prepareGeometricStep(maxAltitude);
            } else if (endsUpTooLow) {
                // If this doesn't work, try speed brakes
                if (!this.speedBrakeRequests[this.currentConstraintIndex - 1]) {
                    this.speedBrakeRequests[this.currentConstraintIndex - 1] = true;
                    this.resetToIndex(this.currentConstraintIndex - 1);
                } else {
                    // Insert path too steep at this point
                    this.steps[this.currentConstraintIndex - 1].error = VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT;
                }
            }
        } else {
            throw new Error('[FMS/VNAV] Unknown constraint type');
        }
    }

    stepToAtConstraint() {
        const { managedDescentSpeedMach, zeroFuelWeight, tropoPause } = this.observer.get();
        const { altitude, distanceFromStart, remainingFuelOnBoard } = this.currentCheckpoint;
        const constraint = this.constraints[this.currentConstraintIndex];

        const stepSpeed = this.speedProfile.getTarget(constraint.distanceFromStart, altitude, ManagedSpeedType.Descent);

        const headwind = this.windProfile.getHeadwindComponent(distanceFromStart, altitude);

        const step = Predictions.geometricStep(
            constraint.constraint.altitude1,
            altitude,
            distanceFromStart - constraint.distanceFromStart,
            stepSpeed,
            managedDescentSpeedMach,
            zeroFuelWeight,
            remainingFuelOnBoard, // TODO: Predict fuel at start of descent, not at the end
            this.atmosphericConditions.isaDeviation,
            headwind.value,
            tropoPause,
            false,
            FlapConf.CLEAN,
        );

        this.steps[this.currentConstraintIndex++] = step;
        this.currentCheckpoint = this.updateCheckpointFromStep(this.currentCheckpoint, step);
    }

    resetToIndex(index: number) {
        this.steps.splice(index);
        this.altitudeAvailableByConstraint.splice(index);
        this.currentConstraintIndex = index;

        this.currentCheckpoint = this.startingPoint;
        for (let i = 0; i < index; i++) {
            this.currentCheckpoint = this.updateCheckpointFromStep(this.currentCheckpoint, this.steps[i]);
        }
    }

    findLowerAvailableAltitude(requestedAltitude: Feet): number {
        let totalAvailableAltitude = 0;

        for (let i = this.currentConstraintIndex - 1; i > 0; i--) {
            for (let j = 0; j < this.altitudeAvailableByConstraint[i].length; j++) {
                totalAvailableAltitude += Math.min(this.altitudeAvailableByConstraint[i][j], 0);

                if (totalAvailableAltitude < requestedAltitude) {
                    return i;
                }
            }
        }

        return -1;
    }

    findHigherAvailableAltitude(requestedAltitude: Feet): number {
        let totalAvailableAltitude = 0;

        for (let i = this.currentConstraintIndex - 1; i > 0; i--) {
            for (let j = 0; j < this.altitudeAvailableByConstraint[i].length; j++) {
                totalAvailableAltitude += Math.max(this.altitudeAvailableByConstraint[i][j], 0);

                if (totalAvailableAltitude > requestedAltitude) {
                    return i;
                }
            }
        }

        return -1;
    }

    prepareIdleStep() {
        const { managedDescentSpeedMach, zeroFuelWeight, tropoPause } = this.observer.get();
        const { altitude, distanceFromStart, remainingFuelOnBoard } = this.currentCheckpoint;
        const constraint = this.constraints[this.currentConstraintIndex];

        const stepSpeed = this.speedProfile.getTarget(constraint.distanceFromStart, altitude, ManagedSpeedType.Descent);
        const stepSpeedMach = this.atmosphericConditions.computeMachFromCas(altitude, stepSpeed);

        const headwind = this.windProfile.getHeadwindComponent(distanceFromStart, altitude);

        const step = Predictions.reverseDistanceStep(
            altitude,
            distanceFromStart - constraint.distanceFromStart,
            stepSpeed,
            managedDescentSpeedMach,
            EngineModel.getIdleN1(altitude, stepSpeedMach) + VnavConfig.IDLE_N1_MARGIN,
            zeroFuelWeight,
            remainingFuelOnBoard, // TODO: Predict fuel at start of descent, not at the end
            headwind.value,
            this.atmosphericConditions.isaDeviation,
            tropoPause,
            this.speedBrakeRequests[this.currentConstraintIndex],
        );

        this.steps[this.currentConstraintIndex] = step;

        if (!this.altitudeAvailableByConstraint[this.currentConstraintIndex]) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex] = [];
        }

        if (constraint.constraint.type === AltitudeConstraintType.atOrBelow) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex++].push(Math.max(constraint.constraint.altitude1 - step.initialAltitude, 0));
        } else if (constraint.constraint.type === AltitudeConstraintType.atOrAbove) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex++].push(Math.min(constraint.constraint.altitude1 - step.initialAltitude, 0));
        } else if (constraint.constraint.type === AltitudeConstraintType.range) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex].push(Math.max(constraint.constraint.altitude1 - step.initialAltitude, 0));
            this.altitudeAvailableByConstraint[this.currentConstraintIndex++].push(Math.min(constraint.constraint.altitude2 - step.initialAltitude, 0));
        }

        this.currentCheckpoint = this.updateCheckpointFromStep(this.currentCheckpoint, step);
    }

    prepareGeometricStep(alitudeToStartDescentFrom: Feet) {
        const { managedDescentSpeedMach, zeroFuelWeight, tropoPause } = this.observer.get();
        const { altitude, remainingFuelOnBoard, distanceFromStart } = this.currentCheckpoint;
        const constraint = this.constraints[this.currentConstraintIndex];

        const stepSpeed = this.speedProfile.getTarget(constraint.distanceFromStart, altitude, ManagedSpeedType.Descent);

        const headwind = this.windProfile.getHeadwindComponent(distanceFromStart, altitude);

        const step = Predictions.geometricStep(
            alitudeToStartDescentFrom,
            altitude,
            distanceFromStart - constraint.distanceFromStart,
            stepSpeed,
            managedDescentSpeedMach,
            zeroFuelWeight,
            remainingFuelOnBoard, // TODO: Predict fuel at start of descent, not at the end
            this.atmosphericConditions.isaDeviation,
            headwind.value,
            tropoPause,
            false,
            FlapConf.CLEAN,
        );

        this.steps[this.currentConstraintIndex] = step;

        if (!this.altitudeAvailableByConstraint[this.currentConstraintIndex]) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex] = [];
        }

        if (constraint.constraint.type === AltitudeConstraintType.atOrBelow) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex++].push(Math.max(constraint.constraint.altitude1 - step.initialAltitude, 0));
        } else if (constraint.constraint.type === AltitudeConstraintType.atOrAbove) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex++].push(Math.min(constraint.constraint.altitude1 - step.initialAltitude, 0));
        } else if (constraint.constraint.type === AltitudeConstraintType.range) {
            this.altitudeAvailableByConstraint[this.currentConstraintIndex].push(Math.max(constraint.constraint.altitude1 - step.initialAltitude, 0));
            this.altitudeAvailableByConstraint[this.currentConstraintIndex++].push(Math.min(constraint.constraint.altitude2 - step.initialAltitude, 0));
        }

        this.currentCheckpoint = this.updateCheckpointFromStep(this.currentCheckpoint, step);
    }

    finalize(sequence: TemporaryCheckpointSequence) {
        sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.GeometricPathEnd });
        this.steps.forEach((step) => sequence.addCheckpointFromStepBackwards(step, VerticalCheckpointReason.GeometricPathConstraint));
        sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.GeometricPathStart });
    }

    private updateCheckpointFromStep(checkpoint: VerticalCheckpoint, step: StepResults): VerticalCheckpoint {
        return {
            reason: VerticalCheckpointReason.GeometricPathConstraint,
            altitude: step.initialAltitude,
            distanceFromStart: checkpoint.distanceFromStart - step.distanceTraveled,
            remainingFuelOnBoard: checkpoint.remainingFuelOnBoard + step.fuelBurned,
            secondsFromPresent: checkpoint.secondsFromPresent - step.timeElapsed,
            speed: step.speed,
            mach: checkpoint.mach,
        };
    }

    /**
     *
     * @param constraints - This should be in the order they appear in the flight plan
     */
    findCumulativeMaxAltitudes(constraints: DescentAltitudeConstraint[]): Feet[] {
        const cumulativeMaxAltitudes = new Array(constraints.length);
        let maxAltitude = this.finalCruiseAltitude;

        for (const constraint of constraints) {
            if (constraint.constraint.type !== AltitudeConstraintType.atOrAbove) {
                maxAltitude = Math.min(maxAltitude, constraint.constraint.altitude1);
            }

            cumulativeMaxAltitudes.push(maxAltitude);
        }

        return cumulativeMaxAltitudes;
    }
}
