import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class TemporaryCheckpointSequence {
    private checkpoints: VerticalCheckpoint[];

    constructor(startingPoint: VerticalCheckpoint) {
        this.checkpoints = [startingPoint];
    }

    at(index: number): VerticalCheckpoint {
        return this.checkpoints[index];
    }

    get length(): number {
        return this.checkpoints.length;
    }

    reset() {
        this.checkpoints.splice(1);
    }

    undoLastStep() {
        this.checkpoints.splice(this.checkpoints.length - 1);
    }

    addCheckpointFromStepBackwards(step: StepResults, reason: VerticalCheckpointReason) {
        this.checkpoints.push({
            reason,
            distanceFromStart: this.lastCheckpoint.distanceFromStart - step.distanceTraveled,
            altitude: step.initialAltitude,
            secondsFromPresent: this.lastCheckpoint.secondsFromPresent - step.timeElapsed,
            remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard + step.fuelBurned,
            speed: step.speed,
        });
    }

    addCheckpointFromStep(step: StepResults, reason: VerticalCheckpointReason) {
        this.checkpoints.push({
            reason,
            distanceFromStart: this.lastCheckpoint.distanceFromStart + step.distanceTraveled,
            altitude: step.finalAltitude,
            secondsFromPresent: this.lastCheckpoint.secondsFromPresent + step.timeElapsed,
            remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard - step.fuelBurned,
            speed: step.speed,
        });
    }

    get() {
        return this.checkpoints.slice(1);
    }

    copyLastCheckpoint(newProperties: Partial<VerticalCheckpoint>) {
        this.checkpoints.push({
            ...this.lastCheckpoint,
            ...newProperties,
        });
    }

    get lastCheckpoint(): VerticalCheckpoint {
        return this.checkpoints[this.checkpoints.length - 1];
    }
}
