import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { MaxSpeedConstraint, VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { WindComponent } from '@fmgc/guidance/vnav/wind';

export class TacticalDescentPathBuilder {
    constructor(private observer: VerticalProfileComputationParametersObserver) { }

    /**
     * Builds a path from the last checkpoint to the finalAltitude
     * @param profile
     * @param descentStrategy
     * @param speedProfile
     * @param finalAltitude
     */
    buildTacticalDescentPath(profile: BaseGeometryProfile, descentStrategy: DescentStrategy, speedProfile: SpeedProfile, finalAltitude: Feet) {
        const constraintsToUse = profile.descentSpeedConstraints
            .slice()
            .reverse()
            .sort((a, b) => a.distanceFromStart - b.distanceFromStart);

        const planner = new TacticalDescentPathPlanner(
            this.observer, speedProfile, descentStrategy, constraintsToUse, profile.lastCheckpoint, finalAltitude,
        );

        for (let i = 0; i < 100 && planner.currentConstraintIndex < constraintsToUse.length; i++) {
            planner.stepAlong();
        }

        planner.planAltitudeStep();

        const checkpointsToAdd = planner.finalize();

        profile.checkpoints.push(...checkpointsToAdd);
    }
}

class TacticalDescentPathPlanner {
    public currentConstraintIndex: number = 0;

    private steps: StepResults[] = []

    public currentCheckpoint: VerticalCheckpoint = null;

    private decelerationDistancesByConstraint: NauticalMiles[]

    private maximumDecelerationDistances: NauticalMiles[]

    constructor(
        private observer: VerticalProfileComputationParametersObserver,
        private speedProfile: SpeedProfile,
        private descentStrategy: DescentStrategy,
        private constraints: MaxSpeedConstraint[],
        private startingPoint: VerticalCheckpoint,
        private finalAltitude: Feet,
    ) {
        this.currentCheckpoint = { ...startingPoint };

        this.decelerationDistancesByConstraint = new Array(this.constraints.length);

        this.maximumDecelerationDistances = this.findMaximumDecelerationDistances();
    }

    stepAlong() {
        const constraintAlongTrack = this.constraints[this.currentConstraintIndex];

        // If the constraint is before where we are now, just move along
        if (constraintAlongTrack.distanceFromStart > this.currentCheckpoint.distanceFromStart) {
            this.currentConstraintIndex++;

            return;
        }

        if (!this.decelerationDistancesByConstraint[this.currentConstraintIndex]) {
            this.decelerationDistancesByConstraint[this.currentConstraintIndex] = 0;
        }

        const indexToResetTo = this.currentConstraintIndex;

        this.planDistanceStep();
        this.planDecelerationStep();

        const overshoot = this.currentCheckpoint.distanceFromStart - constraintAlongTrack.distanceFromStart;

        const decelerationDistance = this.decelerationDistancesByConstraint[this.currentConstraintIndex];
        const maximumDecelerationDistance = this.maximumDecelerationDistances[this.currentConstraintIndex];
        const yetAvailableDecelerationDistance = maximumDecelerationDistance - decelerationDistance;

        // We overshoot in distance
        if (overshoot > 0.1 && yetAvailableDecelerationDistance > 0.1) {
            // Plan more decel distance next time
            this.decelerationDistancesByConstraint[this.currentConstraintIndex] = Math.min(
                decelerationDistance + overshoot,
                maximumDecelerationDistance,
            );

            this.resetToIndex(indexToResetTo);
        } else {
            this.currentConstraintIndex++;
        }
    }

    findMaximumDecelerationDistances() {
        return this.constraints.map((constraint, index) => (index > 1 ? constraint.distanceFromStart - this.constraints[index - 1].distanceFromStart : 0));
    }

    planDistanceStep() {
        const { managedDescentSpeedMach } = this.observer.get();
        const { distanceFromStart, altitude, remainingFuelOnBoard } = this.currentCheckpoint;
        const constraintAlongTrack = this.constraints[this.currentConstraintIndex];

        const distanceForDistanceStep = Math.max(0, constraintAlongTrack.distanceFromStart - distanceFromStart);

        const distanceStep = this.descentStrategy.predictToDistance(
            altitude,
            distanceForDistanceStep,
            this.speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Descent),
            managedDescentSpeedMach,
            remainingFuelOnBoard,
            WindComponent.zero(),
        );

        this.steps.push(distanceStep);
    }

    planDecelerationStep() {
        const { managedDescentSpeedMach } = this.observer.get();
        const { altitude, remainingFuelOnBoard, speed } = this.currentCheckpoint;
        const constraintAlongTrack = this.constraints[this.currentConstraintIndex];

        const targetSpeed = this.speedProfile.getTarget(constraintAlongTrack.distanceFromStart, altitude, ManagedSpeedType.Descent);
        if (speed - targetSpeed < 1) {
            return;
        }

        const decelerationStep = this.descentStrategy.predictToSpeed(
            altitude,
            speed,
            targetSpeed,
            managedDescentSpeedMach,
            remainingFuelOnBoard,
            WindComponent.zero(),
        );

        this.steps.push(decelerationStep);
    }

    planAltitudeStep() {
        const { managedDescentSpeedMach } = this.observer.get();
        const { altitude, remainingFuelOnBoard, speed } = this.currentCheckpoint;

        if (altitude < this.finalAltitude) {
            return;
        }

        const step = this.descentStrategy.predictToAltitude(
            altitude,
            this.finalAltitude,
            speed,
            managedDescentSpeedMach,
            remainingFuelOnBoard,
            WindComponent.zero(),
        );

        this.steps.push(step);
    }

    resetToIndex(index: number) {
        this.steps.splice(index);
        this.currentConstraintIndex = index;

        this.currentCheckpoint = this.startingPoint;
        for (let i = 0; i < index; i++) {
            this.currentCheckpoint = this.updateCheckpointFromStep(this.currentCheckpoint, this.steps[i]);
        }
    }

    finalize(): VerticalCheckpoint[] {
        const checkpoints: VerticalCheckpoint[] = [];
        let newCheckpoint = this.startingPoint;

        for (const step of this.steps) {
            newCheckpoint = this.updateCheckpointFromStep(newCheckpoint, step);

            checkpoints.push(newCheckpoint);
        }

        checkpoints.push({ ...checkpoints[checkpoints.length - 1], reason: VerticalCheckpointReason.CrossingFcuAltitudeDescent });

        return checkpoints;
    }

    private updateCheckpointFromStep(checkpoint: VerticalCheckpoint, step: StepResults): VerticalCheckpoint {
        return {
            reason: VerticalCheckpointReason.IdlePathAtmosphericConditions,
            altitude: step.finalAltitude,
            distanceFromStart: checkpoint.distanceFromStart + step.distanceTraveled,
            remainingFuelOnBoard: checkpoint.remainingFuelOnBoard - step.fuelBurned,
            secondsFromPresent: checkpoint.secondsFromPresent + step.timeElapsed,
            speed: step.speed,
        };
    }
}
