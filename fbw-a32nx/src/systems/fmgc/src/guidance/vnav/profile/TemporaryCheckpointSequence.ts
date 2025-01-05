// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Common } from '@fmgc/guidance/vnav/common';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import {
  VerticalCheckpoint,
  VerticalCheckpointForDeceleration,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';

export class TemporaryCheckpointSequence {
  checkpoints: VerticalCheckpoint[];

  constructor(...checkpoints: VerticalCheckpoint[]) {
    this.checkpoints = checkpoints;
  }

  at(index: number): VerticalCheckpoint {
    return this.checkpoints[index];
  }

  get length(): number {
    return this.checkpoints.length;
  }

  reset(...checkpoints: VerticalCheckpoint[]): void {
    this.checkpoints = checkpoints;
  }

  undoLastStep() {
    this.checkpoints.splice(this.checkpoints.length - 1);
  }

  addCheckpointFromStep(step: StepResults, reason: VerticalCheckpointReason) {
    this.checkpoints.push({
      reason,
      distanceFromStart: this.lastCheckpoint.distanceFromStart + step.distanceTraveled,
      altitude: step.finalAltitude,
      secondsFromPresent: this.lastCheckpoint.secondsFromPresent + step.timeElapsed,
      remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard - step.fuelBurned,
      speed: step.speed,
      mach: this.lastCheckpoint.mach,
    });
  }

  addDecelerationCheckpointFromStep(step: StepResults, reason: VerticalCheckpointReason, targetSpeed: Knots) {
    this.checkpoints.push({
      reason,
      distanceFromStart: this.lastCheckpoint.distanceFromStart + step.distanceTraveled,
      altitude: step.finalAltitude,
      secondsFromPresent: this.lastCheckpoint.secondsFromPresent + step.timeElapsed,
      remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard - step.fuelBurned,
      speed: step.speed,
      mach: this.lastCheckpoint.mach,
      targetSpeed,
    } as VerticalCheckpointForDeceleration);
  }

  get(includeStartingPoint = false) {
    return this.checkpoints.slice(includeStartingPoint ? 0 : 1);
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

  push(...checkpoints: VerticalCheckpoint[]) {
    this.checkpoints.push(...checkpoints);
  }

  interpolateAltitudeBackwards(distanceFromStart: NauticalMiles): Feet {
    if (distanceFromStart >= this.checkpoints[0].distanceFromStart) {
      return this.checkpoints[0].altitude;
    }

    for (let i = 1; i < this.checkpoints.length - 1; i++) {
      if (distanceFromStart >= this.checkpoints[i].distanceFromStart) {
        return Common.interpolate(
          distanceFromStart,
          this.checkpoints[i - 1].distanceFromStart,
          this.checkpoints[i].distanceFromStart,
          this.checkpoints[i - 1].altitude,
          this.checkpoints[i].altitude,
        );
      }
    }

    return this.lastCheckpoint.altitude;
  }
}
