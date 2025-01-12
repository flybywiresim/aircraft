// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { ArmedVerticalMode, isArmed, VerticalMode } from '@shared/autopilot';
import { ClimbStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { Predictions, StepResults } from '../Predictions';
import { VerticalCheckpoint, VerticalCheckpointReason } from '../profile/NavGeometryProfile';
import { BaseGeometryProfile } from '../profile/BaseGeometryProfile';
import { AtmosphericConditions } from '../AtmosphericConditions';

export class ClimbPathBuilder {
  constructor(
    private computationParametersObserver: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
  ) {}

  /**
   * Compute climb profile assuming climb thrust until top of climb.
   * @param profile
   * @returns
   */
  computeClimbPath(
    profile: BaseGeometryProfile,
    config: AircraftConfig,
    climbStrategy: ClimbStrategy,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    targetAltitude: Feet,
  ) {
    const { fcuVerticalMode, fcuArmedVerticalMode } = this.computationParametersObserver.get();

    this.addClimbSteps(
      profile,
      config,
      climbStrategy,
      speedProfile,
      windProfile,
      targetAltitude,
      VerticalCheckpointReason.TopOfClimb,
    );

    if (this.shouldAddFcuAltAsCheckpoint(fcuVerticalMode, fcuArmedVerticalMode)) {
      this.addFcuAltitudeAsCheckpoint(profile);
    }

    if (speedProfile.shouldTakeClimbSpeedLimitIntoAccount()) {
      this.addSpeedLimitAsCheckpoint(profile);
    }
  }

  private addClimbSteps(
    profile: BaseGeometryProfile,
    config: AircraftConfig,
    climbStrategy: ClimbStrategy,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    finalAltitude: Feet,
    finalAltitudeReason: VerticalCheckpointReason = VerticalCheckpointReason.AtmosphericConditions,
  ) {
    const { managedClimbSpeedMach } = this.computationParametersObserver.get();

    for (const constraint of profile.maxAltitudeConstraints) {
      const { maxAltitude: constraintAltitude, distanceFromStart: constraintDistanceFromStart } = constraint;

      if (constraintAltitude >= finalAltitude) {
        break;
      }

      if (constraintAltitude > profile.lastCheckpoint.altitude) {
        // Continue climb
        if (profile.lastCheckpoint.reason === VerticalCheckpointReason.AltitudeConstraint) {
          profile.lastCheckpoint.reason = VerticalCheckpointReason.ContinueClimb;
        }

        // Mark where we are
        let indexToResetTo = profile.checkpoints.length;
        // Try going to the next altitude
        this.buildIteratedClimbSegment(
          profile,
          climbStrategy,
          speedProfile,
          windProfile,
          profile.lastCheckpoint.altitude,
          constraintAltitude,
        );

        let currentSpeedConstraint = speedProfile.getMaxClimbSpeedConstraint(profile.lastCheckpoint.distanceFromStart);
        for (
          let i = 0;
          i++ < 10 && currentSpeedConstraint;
          currentSpeedConstraint = speedProfile.getMaxClimbSpeedConstraint(profile.lastCheckpoint.distanceFromStart)
        ) {
          // This means we did not pass a constraint during the climb
          if (currentSpeedConstraint.distanceFromStart > profile.lastCheckpoint.distanceFromStart) {
            break;
          }

          // Reset
          profile.checkpoints.splice(indexToResetTo);

          // Use distance step instead
          this.buildIteratedDistanceStep(
            profile,
            climbStrategy,
            windProfile,
            currentSpeedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart,
            managedClimbSpeedMach,
            VerticalCheckpointReason.SpeedConstraint,
          );

          // Repeat
          indexToResetTo = profile.checkpoints.length;
          this.buildIteratedClimbSegment(
            profile,
            climbStrategy,
            speedProfile,
            windProfile,
            profile.lastCheckpoint.altitude,
            constraintAltitude,
          );
        }

        // We reach the target altitude before the constraint, so we insert a level segment.
        if (profile.lastCheckpoint.distanceFromStart < constraintDistanceFromStart) {
          profile.lastCheckpoint.reason = VerticalCheckpointReason.LevelOffForClimbConstraint;

          this.addLevelSegmentSteps(profile, config, speedProfile, constraintDistanceFromStart);
        }
      } else if (Math.abs(profile.lastCheckpoint.altitude - constraintAltitude) < 250) {
        // Continue in level flight to the next constraint
        this.addLevelSegmentSteps(profile, config, speedProfile, constraintDistanceFromStart);
      }
    }

    if (profile.lastCheckpoint.reason === VerticalCheckpointReason.AltitudeConstraint) {
      profile.lastCheckpoint.reason = VerticalCheckpointReason.ContinueClimb;
    }

    // We get here if there are still waypoints with speed constrainst after all the altitude constraints
    for (const speedConstraint of profile.maxClimbSpeedConstraints) {
      const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = profile.lastCheckpoint;

      if (distanceFromStart > speedConstraint.distanceFromStart) {
        continue;
      }

      const speedTarget = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Climb);
      if (speedTarget - speed > 1) {
        const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);

        const accelerationStep = climbStrategy.predictToSpeed(
          altitude,
          speedTarget,
          speed,
          managedClimbSpeedMach,
          remainingFuelOnBoard,
          headwind,
        );

        // If we shoot through the final altitude trying to accelerate, pretend we didn't accelerate all the way
        if (accelerationStep.finalAltitude > finalAltitude) {
          const scaling =
            accelerationStep.finalAltitude - accelerationStep.initialAltitude !== 0
              ? (finalAltitude - accelerationStep.initialAltitude) /
                (accelerationStep.finalAltitude - accelerationStep.initialAltitude)
              : 0;

          this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, accelerationStep, scaling);
        }

        this.addCheckpointFromStep(profile, accelerationStep, VerticalCheckpointReason.AtmosphericConditions);
      }

      if (speedConstraint.distanceFromStart > profile.lastCheckpoint.distanceFromStart) {
        this.buildIteratedDistanceStep(
          profile,
          climbStrategy,
          windProfile,
          speedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart,
          managedClimbSpeedMach,
          VerticalCheckpointReason.SpeedConstraint,
        );

        // This occurs if we somehow overshot the target altitude
        if (profile.lastCheckpoint.altitude > finalAltitude) {
          // Remove all checkpoints that are above the final altitude
          profile.checkpoints = profile.checkpoints.filter((c) => c.altitude <= finalAltitude);

          // Use an altitude step instead
          this.buildIteratedClimbSegment(
            profile,
            climbStrategy,
            speedProfile,
            windProfile,
            profile.lastCheckpoint.altitude,
            finalAltitude,
          );
        }
      }
    }

    // We get here if we have passed all speed and altitude constraints, but are not at our final altitude yet.
    this.buildIteratedClimbSegment(
      profile,
      climbStrategy,
      speedProfile,
      windProfile,
      profile.lastCheckpoint.altitude,
      finalAltitude,
    );
    profile.lastCheckpoint.reason = finalAltitudeReason;
  }

  private buildIteratedClimbSegment(
    profile: BaseGeometryProfile,
    climbStrategy: ClimbStrategy,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    startingAltitude: Feet,
    targetAltitude: Feet,
  ): void {
    const { managedClimbSpeedMach } = this.computationParametersObserver.get();

    // This is just to prevent a potential infinite loop
    let i = 0;
    for (let altitude = startingAltitude; i++ < 100 && altitude < targetAltitude; ) {
      const { speed, remainingFuelOnBoard, distanceFromStart } = profile.lastCheckpoint;

      const speedTarget = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Climb);
      const isAboveCrossoverAltitude =
        speedTarget > this.atmosphericConditions.computeCasFromMach(altitude, managedClimbSpeedMach);

      const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);

      // If we're below the target speed, we need to accelerate, unless we're above the crossover altitude. In that case, IAS is always below the managed IAS speed.
      const step =
        isAboveCrossoverAltitude || speedTarget - speed < 1
          ? climbStrategy.predictToAltitude(
              altitude,
              Math.min(altitude + 1500, targetAltitude),
              speedTarget,
              managedClimbSpeedMach,
              remainingFuelOnBoard,
              headwind,
            )
          : climbStrategy.predictToSpeed(
              altitude,
              speedTarget,
              speed,
              managedClimbSpeedMach,
              remainingFuelOnBoard,
              headwind,
            );

      if (step.finalAltitude - targetAltitude > 10) {
        const scaling =
          step.finalAltitude - step.initialAltitude !== 0
            ? (targetAltitude - step.initialAltitude) / (step.finalAltitude - step.initialAltitude)
            : 0;
        this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, step, scaling);
      }

      this.addCheckpointFromStep(profile, step, VerticalCheckpointReason.AtmosphericConditions);

      altitude = step.finalAltitude;
    }
  }

  private buildIteratedDistanceStep(
    profile: BaseGeometryProfile,
    climbStrategy: ClimbStrategy,
    windProfile: HeadwindProfile,
    distance: NauticalMiles,
    mach: Mach,
    reason: VerticalCheckpointReason,
  ) {
    let distanceCrossed = 0;
    for (; distanceCrossed + 3 < distance; distanceCrossed += 3) {
      // The reason we don't check the actual distance travelled is because we don't want to have an infinite loop if the distance step travels no distance for some reason.
      // With this loop, it terminates at some point at least
      this.distanceStepFromLastCheckpoint(
        profile,
        climbStrategy,
        windProfile,
        3,
        mach,
        VerticalCheckpointReason.AtmosphericConditions,
      );
    }

    this.distanceStepFromLastCheckpoint(profile, climbStrategy, windProfile, distance - distanceCrossed, mach, reason);
  }

  private distanceStepFromLastCheckpoint(
    profile: BaseGeometryProfile,
    climbStrategy: ClimbStrategy,
    windProfile: HeadwindProfile,
    distance: NauticalMiles,
    mach: Mach,
    reason: VerticalCheckpointReason,
  ) {
    const { managedClimbSpeedMach } = this.computationParametersObserver.get();
    const { distanceFromStart, altitude, speed: initialSpeed, remainingFuelOnBoard } = profile.lastCheckpoint;

    const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
    const step = climbStrategy.predictToDistance(
      altitude,
      distance,
      initialSpeed,
      managedClimbSpeedMach,
      remainingFuelOnBoard,
      headwind,
    );

    this.addCheckpointFromStep(profile, step, reason);
  }

  private addLevelSegmentSteps(
    profile: BaseGeometryProfile,
    config: AircraftConfig,
    speedProfile: SpeedProfile,
    toDistanceFromStart: NauticalMiles,
  ): void {
    // The only reason we have to build this iteratively is because there could be speed constraints along the way
    const altitude = profile.lastCheckpoint.altitude;

    // Go over all constraints
    for (const speedConstraint of profile.maxClimbSpeedConstraints) {
      // Ignore constraint since we're already past it
      if (
        profile.lastCheckpoint.distanceFromStart >= speedConstraint.distanceFromStart ||
        toDistanceFromStart <= speedConstraint.distanceFromStart
      ) {
        continue;
      }

      const currentSpeed = profile.lastCheckpoint.speed;
      const speedTarget = speedProfile.getTarget(
        profile.lastCheckpoint.distanceFromStart,
        altitude,
        ManagedSpeedType.Climb,
      );

      if (speedTarget > currentSpeed) {
        const step = this.computeLevelFlightAccelerationStep(
          config,
          altitude,
          currentSpeed,
          speedTarget,
          profile.lastCheckpoint.remainingFuelOnBoard,
        );

        // We could not accelerate in time
        if (profile.lastCheckpoint.distanceFromStart + step.distanceTraveled > speedConstraint.distanceFromStart) {
          const scaling =
            step.distanceTraveled / (speedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart);

          this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, step, scaling);
          this.addCheckpointFromStep(profile, step, VerticalCheckpointReason.AtmosphericConditions);

          continue;
        } else {
          // End of acceleration
          this.addCheckpointFromStep(profile, step, VerticalCheckpointReason.AtmosphericConditions);
        }
      }

      // Compute step after accelerating to next constraint
      const levelStepToConstraint = this.computeLevelFlightSegmentPrediction(
        config,
        speedConstraint.distanceFromStart - profile.lastCheckpoint.distanceFromStart,
        altitude,
        profile.lastCheckpoint.speed,
        profile.lastCheckpoint.remainingFuelOnBoard,
      );

      this.addCheckpointFromStep(profile, levelStepToConstraint, VerticalCheckpointReason.AltitudeConstraint);
    }

    // TODO: This exact piece of code appears a couple of lines above, extract to function!
    const currentSpeed = profile.lastCheckpoint.speed;
    const speedTarget = speedProfile.getTarget(
      profile.lastCheckpoint.distanceFromStart,
      altitude,
      ManagedSpeedType.Climb,
    );

    if (speedTarget > currentSpeed) {
      const accelerationStep = this.computeLevelFlightAccelerationStep(
        config,
        altitude,
        currentSpeed,
        speedTarget,
        profile.lastCheckpoint.remainingFuelOnBoard,
      );

      // We could not accelerate in time
      if (profile.lastCheckpoint.distanceFromStart + accelerationStep.distanceTraveled > toDistanceFromStart) {
        const scaling =
          accelerationStep.distanceTraveled / (toDistanceFromStart - profile.lastCheckpoint.distanceFromStart);
        this.scaleStepBasedOnLastCheckpoint(profile.lastCheckpoint, accelerationStep, scaling);
        this.addCheckpointFromStep(profile, accelerationStep, VerticalCheckpointReason.AtmosphericConditions);

        return;
      }

      // End of acceleration
      this.addCheckpointFromStep(profile, accelerationStep, VerticalCheckpointReason.AtmosphericConditions);
    }

    const levelStepToConstraint = this.computeLevelFlightSegmentPrediction(
      config,
      toDistanceFromStart - profile.lastCheckpoint.distanceFromStart,
      altitude,
      profile.lastCheckpoint.speed,
      profile.lastCheckpoint.remainingFuelOnBoard,
    );

    this.addCheckpointFromStep(profile, levelStepToConstraint, VerticalCheckpointReason.AltitudeConstraint);
  }

  private computeLevelFlightSegmentPrediction(
    config: AircraftConfig,
    stepSize: Feet,
    altitude: Feet,
    initialSpeed: Knots,
    fuelWeight: number,
  ): StepResults {
    const { zeroFuelWeight, managedClimbSpeedMach, tropoPause } = this.computationParametersObserver.get();

    return Predictions.levelFlightStep(
      config,
      altitude,
      stepSize,
      initialSpeed,
      managedClimbSpeedMach,
      zeroFuelWeight,
      fuelWeight,
      0,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
    );
  }

  private computeLevelFlightAccelerationStep(
    config: AircraftConfig,
    altitude: Feet,
    initialSpeed: Knots,
    speedTarget: Knots,
    fuelWeight: number,
  ): StepResults {
    const { zeroFuelWeight, managedClimbSpeedMach, tropoPause } = this.computationParametersObserver.get();

    const staticAirTemperature = this.atmosphericConditions.predictStaticAirTemperatureAtAltitude(altitude);

    return Predictions.speedChangeStep(
      config,
      0,
      altitude,
      initialSpeed,
      speedTarget,
      managedClimbSpeedMach,
      managedClimbSpeedMach,
      EngineModel.getClimbThrustCorrectedN1(config.engineModelParameters, altitude, staticAirTemperature),
      zeroFuelWeight,
      fuelWeight,
      0,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
    );
  }

  addSpeedLimitAsCheckpoint(profile: BaseGeometryProfile) {
    const {
      climbSpeedLimit: { underAltitude },
      presentPosition: { alt },
      cruiseAltitude,
    } = this.computationParametersObserver.get();

    if (underAltitude <= alt || underAltitude > cruiseAltitude) {
      return;
    }

    const distance = profile.interpolateDistanceAtAltitude(underAltitude);

    profile.addInterpolatedCheckpoint(distance, { reason: VerticalCheckpointReason.CrossingClimbSpeedLimit });
  }

  private addFcuAltitudeAsCheckpoint(profile: BaseGeometryProfile) {
    const { fcuAltitude, presentPosition, cruiseAltitude } = this.computationParametersObserver.get();

    if (fcuAltitude <= presentPosition.alt || fcuAltitude > cruiseAltitude) {
      return;
    }

    const distance = profile.interpolateDistanceAtAltitude(fcuAltitude);

    profile.addInterpolatedCheckpoint(distance, { reason: VerticalCheckpointReason.CrossingFcuAltitudeClimb });
  }

  private shouldAddFcuAltAsCheckpoint(verticalMode: VerticalMode, armedVerticalMode: ArmedVerticalMode) {
    const verticalModesToShowLevelOffArrowFor = [
      VerticalMode.OP_CLB,
      VerticalMode.VS,
      VerticalMode.FPA,
      VerticalMode.CLB,
      VerticalMode.SRS,
      VerticalMode.SRS_GA,
    ];

    return (
      isArmed(armedVerticalMode, ArmedVerticalMode.CLB) || verticalModesToShowLevelOffArrowFor.includes(verticalMode)
    );
  }

  private addCheckpointFromStep(profile: BaseGeometryProfile, step: StepResults, reason: VerticalCheckpointReason) {
    profile.addCheckpointFromLast(({ distanceFromStart, secondsFromPresent, remainingFuelOnBoard }) => ({
      reason,
      distanceFromStart: distanceFromStart + step.distanceTraveled,
      altitude: step.finalAltitude,
      secondsFromPresent: secondsFromPresent + step.timeElapsed,
      speed: step.speed,
      remainingFuelOnBoard: remainingFuelOnBoard - step.fuelBurned,
      mach: this.computationParametersObserver.get().managedClimbSpeedMach,
    }));
  }

  private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
    step.distanceTraveled *= scaling;
    step.fuelBurned *= scaling;
    step.timeElapsed *= scaling;
    step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
    step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
  }
}
