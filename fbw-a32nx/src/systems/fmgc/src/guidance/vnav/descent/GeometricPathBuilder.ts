// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { FlightPathAngleStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { PlannedGeometricSegment } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { StepResults, VnavStepError } from '@fmgc/guidance/vnav/Predictions';
import {
  MaxSpeedConstraint,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';

export class GeometricPathBuilder {
  private flightPathAngleStrategy: FlightPathAngleStrategy;

  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {
    this.flightPathAngleStrategy = new FlightPathAngleStrategy(observer, atmosphericConditions, -3.0, this.acConfig);
  }

  executeGeometricSegments(
    sequence: TemporaryCheckpointSequence,
    segments: PlannedGeometricSegment[],
    speedConstraints: MaxSpeedConstraint[],
    windProfile: HeadwindProfile,
  ) {
    const accelerationTargets = this.buildAccelerationTargets(sequence.lastCheckpoint, segments, speedConstraints);
    const lastTarget: AccelerationTarget = null;

    for (const segment of segments) {
      const currentSegmentSequence = new TemporaryCheckpointSequence(sequence.lastCheckpoint);

      if (
        !this.executeGeometricSegment(
          currentSegmentSequence,
          segment,
          accelerationTargets,
          windProfile,
          false,
          lastTarget,
        )
      ) {
        if (
          !this.executeGeometricSegment(
            currentSegmentSequence,
            segment,
            accelerationTargets,
            windProfile,
            true,
            lastTarget,
          )
        ) {
          // Marking the segment as too steep, so that we ignore speed constraints on the next try and just fly at the maximum possible gradient
          segment.isTooSteep = true;

          this.executeGeometricSegment(
            currentSegmentSequence,
            segment,
            accelerationTargets,
            windProfile,
            true,
            lastTarget,
          );

          sequence.push(...currentSegmentSequence.get());
          sequence.copyLastCheckpoint({
            reason: VerticalCheckpointReason.GeometricPathTooSteep,
            altitude: segment.end.altitude,
          });

          continue;
        }
      }

      sequence.push(...currentSegmentSequence.get());
    }
  }

  private executeGeometricSegment(
    sequence: TemporaryCheckpointSequence,
    segment: PlannedGeometricSegment,
    accelerationTargets: AccelerationTarget[],
    windProfile: HeadwindProfile,
    useSpeedbrakes: boolean,
    lastTarget: AccelerationTarget,
  ) {
    const { managedDescentSpeedMach } = this.observer.get();
    this.flightPathAngleStrategy.flightPathAngle = MathUtils.RADIANS_TO_DEGREES * Math.atan(segment.gradient / 6076.12);

    for (let i = 0; i < accelerationTargets.length && !segment.isTooSteep; i++) {
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
        windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
        { speedbrakesExtended: useSpeedbrakes, flapConfig: FlapConf.CLEAN, gearExtended: false },
      );

      if (decelerationStep.error === VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT) {
        if (!useSpeedbrakes) {
          if (VnavConfig.DEBUG_PROFILE) {
            console.log(
              `[FMS/VNAV]: Too steep: ${this.flightPathAngleStrategy.flightPathAngle}°. Trying with speedbrakes.`,
            );
          }

          // Break out and try the whole segment with speedbrakes
          return false;
        }

        if (VnavConfig.DEBUG_PROFILE) {
          console.log(`[FMS/VNAV]: Too steep: ${this.flightPathAngleStrategy.flightPathAngle}°.`);
        }

        segment.gradient = Math.tan(decelerationStep.pathAngle * MathUtils.DEGREES_TO_RADIANS) * 6076.12;
        return false;
      }

      // These are negative distances
      // Check if the deceleration takes us past the segment bounds.
      if (decelerationStep.distanceTraveled < Math.min(maxDistance, 0)) {
        const scaling = maxDistance / decelerationStep.distanceTraveled;

        this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, decelerationStep, scaling);
        sequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.SpeedConstraint);
      } else if (
        Math.max(accelerationTarget.distanceFromStart, segment.end.distanceFromStart) <
        sequence.lastCheckpoint.distanceFromStart + decelerationStep.distanceTraveled
      ) {
        if (decelerationStep.distanceTraveled < 0) {
          const decelerationReason = lastTarget.isSpeedLimit
            ? VerticalCheckpointReason.StartDecelerationToLimit
            : VerticalCheckpointReason.StartDecelerationToConstraint;
          sequence.addDecelerationCheckpointFromStep(decelerationStep, decelerationReason, lastTarget.speed);
        }

        // Fly to constraint
        const stepToConstraint = this.flightPathAngleStrategy.predictToDistance(
          sequence.lastCheckpoint.altitude,
          Math.max(accelerationTarget.distanceFromStart, segment.end.distanceFromStart) -
            sequence.lastCheckpoint.distanceFromStart,
          sequence.lastCheckpoint.speed,
          managedDescentSpeedMach,
          sequence.lastCheckpoint.remainingFuelOnBoard,
          windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
        );

        const checkpointReason = accelerationTarget.isSpeedLimit
          ? VerticalCheckpointReason.CrossingDescentSpeedLimit
          : VerticalCheckpointReason.SpeedConstraint;
        sequence.addCheckpointFromStep(stepToConstraint, checkpointReason);
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
        windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
      );

      sequence.addCheckpointFromStep(stepToEndOfSegment, VerticalCheckpointReason.AtmosphericConditions);
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
