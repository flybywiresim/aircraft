// @ts-strict-ignore
// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPathAngleStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { StepResults, VnavStepError } from '@fmgc/guidance/vnav/Predictions';
import {
  MaxSpeedConstraint,
  ProfilePhase,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { PlannedGeometricSegment } from '@fmgc/guidance/vnav/descent/GeometricPathPlanner';
import { SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { DescentPathBuilder } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';

export class GeometricPathBuilder {
  private flightPathAngleStrategy: FlightPathAngleStrategy;

  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    private readonly descentPathBuilder: DescentPathBuilder,
    private readonly acConfig: AircraftConfig,
  ) {
    this.flightPathAngleStrategy = new FlightPathAngleStrategy(observer, atmosphericConditions, -3.0, this.acConfig);
  }

  executeGeometricSegments(
    sequence: TemporaryCheckpointSequence,
    segments: PlannedGeometricSegment[],
    profile: BaseGeometryProfile,
    speedProfile: SpeedProfile,
  ) {
    const speedConstraints = profile.descentSpeedConstraints;

    const accelerationTargets = this.buildAccelerationTargets(sequence.lastCheckpoint, segments, speedConstraints);
    const lastTarget: AccelerationTarget = null;

    for (const segment of segments) {
      const currentSegmentSequence = new TemporaryCheckpointSequence(sequence.lastCheckpoint);
      this.flightPathAngleStrategy.flightPathAngle =
        MathUtils.RADIANS_TO_DEGREES * Math.atan(segment.gradient / 6076.12);

      if (
        !this.executeGeometricSegment(profile, currentSegmentSequence, segment, accelerationTargets, false, lastTarget)
      ) {
        if (
          !this.executeGeometricSegment(profile, currentSegmentSequence, segment, accelerationTargets, true, lastTarget)
        ) {
          // If we cannot do meet the constraint with speedbrakes, build a new descent path to the constraint
          this.descentPathBuilder.computeManagedDescentPath(
            currentSegmentSequence,
            profile,
            speedProfile,
            Infinity,
            segment.end.distanceFromStart,
          );

          // The path built above is only a "sub-path" of the full descent path, so we want to remove any checkpoints
          // with significance to the full path
          currentSegmentSequence.checkpoints.forEach((checkpoint) => {
            if (
              checkpoint.reason === VerticalCheckpointReason.GeometricPathStart ||
              checkpoint.reason === VerticalCheckpointReason.GeometricPathEnd ||
              checkpoint.reason === VerticalCheckpointReason.IdlePathEnd ||
              checkpoint.reason === VerticalCheckpointReason.TopOfDescent
            ) {
              checkpoint.reason = VerticalCheckpointReason.AtmosphericConditions;
            }
          });

          sequence.push(...currentSegmentSequence.get());
          sequence.lastCheckpoint.reason = VerticalCheckpointReason.GeometricPathTooSteep;

          sequence.copyLastCheckpoint({
            reason: VerticalCheckpointReason.AltitudeConstraint,
            altitude: segment.end.altitude,
          });

          segment.end.leg.calculated.endsInTooSteepPath = true;

          continue;
        }
      }

      sequence.push(...currentSegmentSequence.get());
    }
  }

  private executeGeometricSegment(
    profile: BaseGeometryProfile,
    sequence: TemporaryCheckpointSequence,
    segment: PlannedGeometricSegment,
    accelerationTargets: AccelerationTarget[],
    useSpeedbrakes: boolean,
    lastTarget: AccelerationTarget,
  ) {
    const { managedDescentSpeedMach } = this.observer.get();

    for (let i = 0; i < accelerationTargets.length; i++) {
      const accelerationTarget = accelerationTargets[i];
      const maxDistance = segment.end.distanceFromStart - sequence.lastCheckpoint.distanceFromStart;

      if (accelerationTarget.distanceFromStart > sequence.lastCheckpoint.distanceFromStart || maxDistance >= 0) {
        continue;
      }

      if (lastTarget == null) {
        lastTarget = accelerationTarget;
      }

      // Decelerate to speed target
      const decelerationStep = this.flightPathAngleStrategy.predictToSpeed(
        sequence.lastCheckpoint.altitude,
        accelerationTarget.speed,
        sequence.lastCheckpoint.speed,
        managedDescentSpeedMach,
        sequence.lastCheckpoint.remainingFuelOnBoard,
        -profile.winds.getDescentTailwind(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
        { speedbrakesExtended: useSpeedbrakes, flapConfig: FlapConf.CLEAN, gearExtended: false },
      );

      if (decelerationStep.error === VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT) {
        return false;
      }

      // These are negative distances
      // Check if the deceleration takes us past the segment bounds.
      if (decelerationStep.distanceTraveled < Math.min(maxDistance, 0)) {
        const scaling = maxDistance / decelerationStep.distanceTraveled;

        this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, decelerationStep, scaling);
        sequence.addCheckpointFromStep(
          decelerationStep,
          VerticalCheckpointReason.SpeedConstraint,
          ProfilePhase.Descent,
        );
      } else if (
        Math.max(accelerationTarget.distanceFromStart, segment.end.distanceFromStart) <
        sequence.lastCheckpoint.distanceFromStart + decelerationStep.distanceTraveled
      ) {
        if (decelerationStep.distanceTraveled < 0) {
          const decelerationReason = lastTarget.isSpeedLimit
            ? VerticalCheckpointReason.StartDecelerationToLimit
            : VerticalCheckpointReason.StartDecelerationToConstraint;
          sequence.addDecelerationCheckpointFromStep(
            decelerationStep,
            decelerationReason,
            lastTarget.speed,
            ProfilePhase.Descent,
          );
        }

        // Fly to constraint
        const headwind = -profile.winds.getDescentTailwind(
          sequence.lastCheckpoint.distanceFromStart,
          sequence.lastCheckpoint.altitude,
        );
        const stepToConstraint = this.flightPathAngleStrategy.predictToDistance(
          sequence.lastCheckpoint.altitude,
          Math.max(accelerationTarget.distanceFromStart, segment.end.distanceFromStart) -
            sequence.lastCheckpoint.distanceFromStart,
          sequence.lastCheckpoint.speed,
          managedDescentSpeedMach,
          sequence.lastCheckpoint.remainingFuelOnBoard,
          headwind,
        );

        const checkpointReason = accelerationTarget.isSpeedLimit
          ? VerticalCheckpointReason.CrossingDescentSpeedLimit
          : VerticalCheckpointReason.SpeedConstraint;
        sequence.addCheckpointFromStep(stepToConstraint, checkpointReason, ProfilePhase.Descent);
        lastTarget = accelerationTarget;
      }
    }

    if (segment.end.distanceFromStart - sequence.lastCheckpoint.distanceFromStart < 0) {
      // Fly to end of segment
      const stepToEndOfSegment = this.flightPathAngleStrategy.predictToDistance(
        sequence.lastCheckpoint.altitude,
        segment.end.distanceFromStart - sequence.lastCheckpoint.distanceFromStart,
        sequence.lastCheckpoint.speed,
        managedDescentSpeedMach,
        sequence.lastCheckpoint.remainingFuelOnBoard,
        -profile.winds.getDescentTailwind(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
      );

      sequence.addCheckpointFromStep(
        stepToEndOfSegment,
        VerticalCheckpointReason.AtmosphericConditions,
        ProfilePhase.Descent,
      );
    }

    return true;
  }

  private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
    step.distanceTraveled *= scaling;
    step.fuelBurned *= scaling;
    step.timeElapsed *= scaling;
    step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
    step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
  }

  private buildAccelerationTargets(
    startingPoint: VerticalCheckpoint,
    segments: PlannedGeometricSegment[],
    speedConstraints: MaxSpeedConstraint[],
  ): AccelerationTarget[] {
    const { managedDescentSpeed, descentSpeedLimit } = this.observer.get();

    const distanceAtSpeedLimitCrossing = this.findDistanceAtAltitude(
      descentSpeedLimit.underAltitude,
      startingPoint,
      segments,
    );
    let shouldAddSpeedLimit = distanceAtSpeedLimitCrossing !== null;
    const speedLimitTarget: AccelerationTarget = {
      distanceFromStart: distanceAtSpeedLimitCrossing,
      speed: descentSpeedLimit.speed,
      isSpeedLimit: true,
    };

    const targets: AccelerationTarget[] = [];
    for (let i = speedConstraints.length - 1; i >= 0; i--) {
      const sc = speedConstraints[i];

      if (shouldAddSpeedLimit && sc.distanceFromStart < distanceAtSpeedLimitCrossing) {
        targets.push(speedLimitTarget);
        shouldAddSpeedLimit = false;
      }

      const target = {
        distanceFromStart: sc.distanceFromStart,
        speed: sc.maxSpeed,
        isSpeedLimit: false,
      };

      targets.push(target);
    }

    const econSpeedTarget: AccelerationTarget = {
      distanceFromStart: -Infinity,
      speed: managedDescentSpeed,
      isSpeedLimit: false,
    };

    // If we figured that we should add the speed limit as a target, but haven't yet, add it now.
    if (shouldAddSpeedLimit) {
      targets.push(speedLimitTarget);
    }

    targets.push(econSpeedTarget);

    // Propagate speed constraints forwards
    targets.reduceRight((maxSpeed, target) => {
      maxSpeed = Math.min(maxSpeed, target.speed);
      target.speed = maxSpeed;

      return maxSpeed;
    }, Infinity);

    return targets;
  }

  private findDistanceAtAltitude(
    altitude: number,
    startingPoint: VerticalCheckpoint,
    segments: PlannedGeometricSegment[],
  ): NauticalMiles | null {
    if (startingPoint.altitude > altitude) {
      return null;
    }

    for (const segment of segments) {
      if (altitude <= segment.end.altitude) {
        return segment.end.distanceFromStart + (altitude - segment.end.altitude) / segment.gradient;
      }
    }

    // If we don't cross the speed limit on the geometric
    return -Infinity;
  }
}

type AccelerationTarget = {
  distanceFromStart: NauticalMiles;
  speed: number;
  isSpeedLimit: boolean;
};
