//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import {
  DescentAltitudeConstraint,
  NavGeometryProfile,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import {
  VerticalProfileComputationParameters,
  VerticalProfileComputationParametersObserver,
} from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { ConstraintUtils, MathUtils } from '@flybywiresim/fbw-sdk';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { FlightPathAngleStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { BisectionMethod, NonTerminationStrategy } from '@fmgc/guidance/vnav/BisectionMethod';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';

class FlapConfigurationProfile {
  static getBySpeed(speed: Knots, parameters: VerticalProfileComputationParameters): FlapConf {
    if (speed >= parameters.cleanSpeed) {
      return FlapConf.CLEAN;
    }
    if (speed >= parameters.slatRetractionSpeed) {
      return FlapConf.CONF_1; // Between S and O
    }
    if (speed >= parameters.flapRetractionSpeed) {
      return FlapConf.CONF_2; // Between F and S
    }
    if (speed >= (parameters.flapRetractionSpeed + parameters.approachSpeed) / 2) {
      return FlapConf.CONF_3;
    }

    return FlapConf.CONF_FULL;
  }

  static findNextExtensionSpeed(speed: Knots, parameters: VerticalProfileComputationParameters) {
    if (speed < (parameters.flapRetractionSpeed + parameters.approachSpeed) / 2) {
      return (parameters.flapRetractionSpeed + parameters.approachSpeed) / 2;
    }
    if (speed < parameters.flapRetractionSpeed) {
      return parameters.flapRetractionSpeed;
    }
    if (speed < parameters.slatRetractionSpeed) {
      return parameters.slatRetractionSpeed;
    }
    if (speed < parameters.cleanSpeed) {
      return parameters.cleanSpeed;
    }

    return Infinity;
  }

  static getApproachPhaseTargetSpeed(flapConfig: FlapConf, parameters: VerticalProfileComputationParameters): Knots {
    switch (flapConfig) {
      case FlapConf.CONF_FULL:
        return parameters.approachSpeed;
      case FlapConf.CONF_3:
      case FlapConf.CONF_2:
        return parameters.flapRetractionSpeed;
      case FlapConf.CONF_1:
        return parameters.slatRetractionSpeed;
      case FlapConf.CLEAN:
        return parameters.cleanSpeed;
      default:
        throw new Error(`[FMS/VNAV] Unknown flap config: ${flapConfig}`);
    }
  }

  static getFlapCheckpointReasonByFlapConf(flapConfig: FlapConf) {
    switch (flapConfig) {
      case FlapConf.CONF_FULL:
        return VerticalCheckpointReason.FlapsFull;
      case FlapConf.CONF_3:
        return VerticalCheckpointReason.Flaps3;
      case FlapConf.CONF_2:
        return VerticalCheckpointReason.Flaps2;
      case FlapConf.CONF_1:
        return VerticalCheckpointReason.Flaps1;
      case FlapConf.CLEAN:
        return VerticalCheckpointReason.Decel;
      default:
        throw new Error(`[FMS/VNAV] Unknown flap config: ${flapConfig}`);
    }
  }
}

export interface AircraftConfiguration {
  flapConfig: FlapConf;
  speedbrakesExtended: boolean;
  gearExtended: boolean;
}

export const DEFAULT_AIRCRAFT_CONTROL_SURFACE_CONFIG: Readonly<AircraftConfiguration> = {
  flapConfig: FlapConf.CLEAN,
  speedbrakesExtended: false,
  gearExtended: false,
};

/**
 * Use this class to generate `AircraftConfiguration` objects. This reuses the same object to avoid unnecessary allocations.
 * If multiple configurations are generated from the same register, they will be the same object. Use multiple registers
 * if you need different configurations at the same time.
 *
 * @example
 * const parameters = new VerticalProfileComputationParametersObserver().get();
 * const register = new AircraftConfigurationRegister();
 *
 * // Appropriate configuration to fly at 250 kts
 * const config = register.setFromSpeed(250, parameters);
 *
 * // Appropriate configuration to fly at 200 kts
 * const config2 = register.setFromSpeed(200, parameters);
 *
 * // These configurations are now the *same*
 * assert(config === config2);
 */
export class AircraftConfigurationRegister {
  private readonly config: AircraftConfiguration = { ...DEFAULT_AIRCRAFT_CONTROL_SURFACE_CONFIG };

  setFromSpeed(speed: Knots, parameters: VerticalProfileComputationParameters, useSpeedbrakes = false) {
    this.config.flapConfig = FlapConfigurationProfile.getBySpeed(speed, parameters);
    this.config.speedbrakesExtended = useSpeedbrakes;
    this.config.gearExtended = speed < parameters.flapRetractionSpeed;

    return this.config;
  }

  get(): Readonly<AircraftConfiguration> {
    return this.config;
  }
}

export class ApproachPathBuilder {
  private idleStrategy: DescentStrategy;

  private fpaStrategy: FlightPathAngleStrategy;

  private readonly configuration = new AircraftConfigurationRegister();

  private static readonly DISTANCE_EPSILON = 1e-4;

  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {
    this.idleStrategy = new IdleDescentStrategy(observer, atmosphericConditions, this.acConfig);
    this.fpaStrategy = new FlightPathAngleStrategy(observer, atmosphericConditions, 0, this.acConfig);
  }

  computeApproachPath(
    profile: NavGeometryProfile,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    estimatedFuelOnBoardAtDestination: number,
    estimatedSecondsFromPresentAtDestination: number,
  ): TemporaryCheckpointSequence {
    const { approachSpeed, managedDescentSpeedMach, cleanSpeed } = this.observer.get();

    const approachConstraints = profile.descentAltitudeConstraints.slice().reverse();

    // If we have a procedure loaded, we use the MAP altitude.
    // If not, fall back to runway or airfield
    const finalAltitude = profile.finalAltitude;

    const sequence = new TemporaryCheckpointSequence({
      reason: VerticalCheckpointReason.Landing,
      speed: approachSpeed,
      distanceFromStart: profile.getDistanceFromStart(0),
      altitude: finalAltitude,
      remainingFuelOnBoard: estimatedFuelOnBoardAtDestination,
      secondsFromPresent: estimatedSecondsFromPresentAtDestination,
      mach: managedDescentSpeedMach,
    });

    const distanceToOneThousandAgl =
      1000 / Math.tan(profile.finalDescentAngle * MathUtils.DEGREES_TO_RADIANS) / 6076.12;

    // Build final segment
    this.fpaStrategy.flightPathAngle = profile.finalDescentAngle;
    const finalApproachStep = this.fpaStrategy.predictToDistance(
      finalAltitude,
      distanceToOneThousandAgl,
      approachSpeed,
      managedDescentSpeedMach,
      estimatedFuelOnBoardAtDestination,
      windProfile.getHeadwindComponent(profile.getDistanceFromStart(0), finalAltitude),
      this.configuration.setFromSpeed(approachSpeed, this.observer.get()),
    );

    sequence.addCheckpointFromStep(finalApproachStep, VerticalCheckpointReason.AtmosphericConditions);

    // Build path to FAF by flying the descent angle but decelerating
    const fafStep = this.buildDecelerationPath(
      sequence.lastCheckpoint,
      speedProfile,
      windProfile,
      profile.getDistanceFromStart(profile.fafDistanceToEnd),
    );
    sequence.push(...fafStep.get());

    //
    this.fpaStrategy.flightPathAngle = 0;
    for (const altitudeConstraint of approachConstraints) {
      this.handleAltitudeConstraint(sequence, speedProfile, windProfile, altitudeConstraint);

      // If you're at or above your descent speed (taking speed limit into account, place the decel point)
      const speedTarget = speedProfile.getTarget(
        sequence.lastCheckpoint.distanceFromStart,
        sequence.lastCheckpoint.altitude,
        ManagedSpeedType.Descent,
      );
      if (
        sequence.lastCheckpoint.reason === VerticalCheckpointReason.Decel ||
        (sequence.lastCheckpoint.speed > cleanSpeed && sequence.lastCheckpoint.speed > speedTarget)
      ) {
        break;
      }
    }

    const speedTarget = speedProfile.getTarget(
      sequence.lastCheckpoint.distanceFromStart - ApproachPathBuilder.DISTANCE_EPSILON,
      sequence.lastCheckpoint.altitude,
      ManagedSpeedType.Descent,
    );

    if (speedTarget - sequence.lastCheckpoint.speed > 0.1) {
      // We use -Infinty because we just want to decelerate to the descent speed without and constraint on distance
      const decelerationToDescentSpeed = this.buildDecelerationPath(
        sequence.lastCheckpoint,
        speedProfile,
        windProfile,
        -Infinity,
      );
      sequence.push(...decelerationToDescentSpeed.get());
    }

    // There are cases where the decel point is not added when we handle the constraints above, in this case, we just add it here.
    if (sequence.lastCheckpoint.reason !== VerticalCheckpointReason.Decel) {
      sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.Decel });
    }

    return sequence;
  }

  private handleAltitudeConstraint(
    sequence: TemporaryCheckpointSequence,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    constraint: DescentAltitudeConstraint,
  ) {
    // We compose this segment of three segments:
    //  1. (A level deceleration segment) - `decelerationSequence`
    //  2. A descent segment - `descentSegment`
    //  3. A level deceleration segment - `secondDecelerationSequence`
    // ^ This is the order in which they appear along the track. Like the entire descent path, we build it backwards

    // Going in reverse:
    // We try to choose make the deceleration segment just as long that we can meet the altitude constraint with the descent segment.
    // Segment number 1. is only needed if we decelerate, descend, but are not at the altitude constraint yet.
    const { managedDescentSpeedMach, cleanSpeed } = this.observer.get();
    const { distanceFromStart, altitude } = sequence.lastCheckpoint;

    const minimumAltitude = ConstraintUtils.minimumAltitude(constraint.constraint);

    if (
      distanceFromStart < constraint.distanceFromStart ||
      !Number.isFinite(minimumAltitude) ||
      altitude - minimumAltitude > -50 // If we are already above the constraint
    ) {
      return;
    }

    // This should be positive
    const desiredDistanceToCover = distanceFromStart - constraint.distanceFromStart;

    let decelerationSequence: TemporaryCheckpointSequence = null;
    let descentSegment: StepResults = null;
    let secondDecelerationSequence: TemporaryCheckpointSequence = null;

    // `decelerationSegmentDistance` should be positive
    const tryDecelDistance = (
      decelerationSegmentDistance: NauticalMiles,
      useSpeedbrakes: boolean = false,
    ): NauticalMiles => {
      const currentDecelerationAttempt = new TemporaryCheckpointSequence(sequence.lastCheckpoint);

      decelerationSequence = this.buildDecelerationPath(
        sequence.lastCheckpoint,
        speedProfile,
        windProfile,
        distanceFromStart - decelerationSegmentDistance,
        useSpeedbrakes,
      );
      currentDecelerationAttempt.push(...decelerationSequence.get());

      descentSegment = this.idleStrategy.predictToAltitude(
        altitude,
        minimumAltitude,
        decelerationSequence.lastCheckpoint.speed,
        managedDescentSpeedMach,
        decelerationSequence.lastCheckpoint.remainingFuelOnBoard,
        windProfile.getHeadwindComponent(distanceFromStart - decelerationSegmentDistance, minimumAltitude),
        this.configuration.setFromSpeed(decelerationSequence.lastCheckpoint.speed, this.observer.get(), useSpeedbrakes),
      );
      currentDecelerationAttempt.addCheckpointFromStep(descentSegment, VerticalCheckpointReason.AltitudeConstraint);

      if (VnavConfig.DEBUG_PROFILE && descentSegment.distanceTraveled > 0) {
        throw new Error('[FMS/VNAV] Descent segment should have a negative distance traveled');
      }

      // This should be positive.
      // This is what we want to be as close to `desiredDistanceToCover` as possible. That would mean that we start "ascending" (descending backwards) just in time.
      const distanceTraveled =
        -descentSegment.distanceTraveled + (distanceFromStart - decelerationSequence.lastCheckpoint.distanceFromStart);

      // If we have not reached the altitude constraint yet, because we started "ascending" (descending backwards) too early, we continue to decelerate until we reach the constraint
      secondDecelerationSequence = this.buildDecelerationPath(
        currentDecelerationAttempt.lastCheckpoint,
        speedProfile,
        windProfile,
        constraint.distanceFromStart,
        useSpeedbrakes,
      );

      return distanceTraveled - desiredDistanceToCover;
    };

    const solution = BisectionMethod.findZero(
      tryDecelDistance,
      [0, desiredDistanceToCover],
      [-0.1, 0.1],
      NonTerminationStrategy.NegativeErrorResult,
    );
    tryDecelDistance(solution);

    // Total distance is deceleration distance (`solution`) + descent distance (`-descentSegment.distanceTraveled`)
    const distanceTraveled = solution + -descentSegment.distanceTraveled;
    const finalError = distanceTraveled - desiredDistanceToCover;

    // Even without decelerating and only descending, we cannot make the constraint
    if (MathUtils.isCloseToNegative(solution) && !MathUtils.isCloseToNegative(finalError)) {
      // Try with speedbrakes
      const solutionWithSpeedbrakes = BisectionMethod.findZero(
        (distance) => tryDecelDistance(distance, true),
        [0, desiredDistanceToCover],
        [-0.1, 0.1],
        NonTerminationStrategy.NegativeErrorResult,
      );
      tryDecelDistance(solutionWithSpeedbrakes, true);

      const distanceTraveledWithSpeedbrakes = solutionWithSpeedbrakes + -descentSegment.distanceTraveled;
      const finalErrorWithSpeedbrakes = distanceTraveledWithSpeedbrakes - desiredDistanceToCover;

      if (
        MathUtils.isCloseToNegative(solutionWithSpeedbrakes) &&
        !MathUtils.isCloseToNegative(finalErrorWithSpeedbrakes)
      ) {
        // Insert TOO STEEP PATH
        const scaling = desiredDistanceToCover / -descentSegment.distanceTraveled;
        this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, descentSegment, scaling);
        sequence.addCheckpointFromStep(descentSegment, VerticalCheckpointReason.GeometricPathTooSteep);
        sequence.copyLastCheckpoint({
          reason: VerticalCheckpointReason.AltitudeConstraint,
          altitude: minimumAltitude,
        });

        constraint.leg.calculated.endsInTooSteepPath = true;

        return;
      }
    }

    sequence.push(...decelerationSequence.get());

    const speedTarget = speedProfile.getTarget(
      decelerationSequence.lastCheckpoint.distanceFromStart,
      decelerationSequence.lastCheckpoint.altitude,
      ManagedSpeedType.Descent,
    );
    // Don't bother considering the climb step in the profile if we have already reached the target speed in the deceleration segment
    if (
      speedTarget - decelerationSequence.lastCheckpoint.speed > 1 ||
      decelerationSequence.lastCheckpoint.speed < cleanSpeed
    ) {
      sequence.addCheckpointFromStep(descentSegment, VerticalCheckpointReason.AltitudeConstraint);
      sequence.push(...secondDecelerationSequence.get());
    }
  }

  private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
    step.distanceTraveled *= scaling;
    step.fuelBurned *= scaling;
    step.timeElapsed *= scaling;
    step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
    step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
  }

  /**
   * This builds a level deceleration path, bringing out flaps as needed, and obeying speed constraints.
   * This relies on `this.fpaStrategy` to have the correct descent angle coded.
   * @param lastCheckpoint
   * @param speedProfile
   * @param windProfile
   * @param targetDistanceFromStart
   * @param useSpeedbrakes
   * @returns
   */
  private buildDecelerationPath(
    lastCheckpoint: VerticalCheckpoint,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    targetDistanceFromStart: NauticalMiles,
    useSpeedbrakes = false,
  ): TemporaryCheckpointSequence {
    const decelerationSequence = new TemporaryCheckpointSequence(lastCheckpoint);

    const parameters = this.observer.get();

    let lastAccelerationCheckpointIndex = 1;

    const isDoneDeclerating = () =>
      decelerationSequence.lastCheckpoint.reason === VerticalCheckpointReason.Decel ||
      MathUtils.isCloseToLessThan(decelerationSequence.lastCheckpoint.distanceFromStart, targetDistanceFromStart); // We really only want to prevent floating point errors here

    for (let i = 0; i < 10 && !isDoneDeclerating(); i++) {
      const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = decelerationSequence.lastCheckpoint;

      const speedConstraint = speedProfile.getMaxDescentSpeedConstraint(
        distanceFromStart - ApproachPathBuilder.DISTANCE_EPSILON,
      );
      const flapTargetSpeed = FlapConfigurationProfile.findNextExtensionSpeed(speed, parameters);

      // This is the managed descent speed, or the speed limit speed.
      const limitingSpeed = speedProfile.getTargetWithoutConstraints(
        decelerationSequence.lastCheckpoint.altitude,
        ManagedSpeedType.Descent,
      );

      // If the constraint is limiting, decelerate to the constraint, then fly constant speed until it is resolved
      // If the flapTarget is limiting, decelerate to the flap target
      // If the limitingSpeed is limiting, decelerate to it and return

      // Constraint is constraining
      if (
        speedConstraint !== null &&
        speedConstraint.maxSpeed < flapTargetSpeed &&
        speedConstraint.maxSpeed < limitingSpeed
      ) {
        // This is meant to be negative
        const remainingDistance =
          Math.max(speedConstraint.distanceFromStart, targetDistanceFromStart) - distanceFromStart;

        // Decelerate to constraint
        const decelerationStep = this.fpaStrategy.predictToSpeed(
          altitude,
          Math.max(speedConstraint.maxSpeed, speed), // If constraint speed is less than the current speed, don't try to decelerate to it (because we'll end up going the wrong way)
          speed,
          parameters.managedDescentSpeedMach,
          remainingFuelOnBoard,
          windProfile.getHeadwindComponent(distanceFromStart, altitude),
          this.configuration.setFromSpeed(speed, parameters, useSpeedbrakes),
        );

        if (decelerationStep.error !== undefined || decelerationStep.distanceTraveled > 0) {
          // Reset
          decelerationSequence.checkpoints.splice(
            lastAccelerationCheckpointIndex,
            decelerationSequence.checkpoints.length,
          );

          break;
        }

        lastAccelerationCheckpointIndex = decelerationSequence.length;

        if (MathUtils.isCloseToNegative(decelerationStep.distanceTraveled)) {
          // We tried to declerate, but it took us beyond targetDistanceFromStart, so we scale down the step
          const scaling = Math.min(1, remainingDistance / decelerationStep.distanceTraveled);
          this.scaleStepBasedOnLastCheckpoint(decelerationSequence.lastCheckpoint, decelerationStep, scaling);
          decelerationSequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);
        }

        const remainingDistanceToConstraint =
          distanceFromStart +
          decelerationStep.distanceTraveled -
          Math.max(speedConstraint.distanceFromStart, targetDistanceFromStart);

        if (remainingDistanceToConstraint > 0.05) {
          if (speedConstraint.maxSpeed > parameters.cleanSpeed) {
            decelerationSequence.lastCheckpoint.reason = VerticalCheckpointReason.Decel;
            return decelerationSequence;
          }

          // If we decelerated, but aren't at the constraint yet, fly level, at constant speed to the constraint
          const constantStep = this.fpaStrategy.predictToDistance(
            altitude,
            -remainingDistanceToConstraint,
            speedConstraint.maxSpeed,
            parameters.managedDescentSpeedMach,
            remainingFuelOnBoard - decelerationStep.fuelBurned,
            windProfile.getHeadwindComponent(distanceFromStart, altitude),
            this.configuration.setFromSpeed(speedConstraint.maxSpeed, parameters, useSpeedbrakes),
          );

          if (constantStep.distanceTraveled > 0) {
            throw new Error('[FMS/VNAV] Descent step distance should not be positive');
          }

          decelerationSequence.addCheckpointFromStep(constantStep, VerticalCheckpointReason.SpeedConstraint);
        } else {
          decelerationSequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.SpeedConstraint });
        }
      } else {
        // flapTarget or managed speed is constraining
        const remainingDistance = targetDistanceFromStart - distanceFromStart; // This should be negative

        // We don't care about any speed constraint limitations here, because that's what the if block above is for.
        const targetSpeed = Math.min(flapTargetSpeed, limitingSpeed);
        const config = this.configuration.setFromSpeed(speed, parameters, useSpeedbrakes);

        const decelerationStep = this.fpaStrategy.predictToSpeed(
          altitude,
          targetSpeed,
          speed,
          parameters.managedDescentSpeedMach,
          remainingFuelOnBoard,
          windProfile.getHeadwindComponent(distanceFromStart, altitude),
          config,
        );

        if (decelerationStep.error !== undefined || decelerationStep.distanceTraveled > 0) {
          // Reset
          decelerationSequence.checkpoints.splice(
            lastAccelerationCheckpointIndex,
            decelerationSequence.checkpoints.length,
          );

          break;
        }

        lastAccelerationCheckpointIndex = decelerationSequence.length;

        if (decelerationStep.distanceTraveled < remainingDistance) {
          const scaling = Math.min(1, remainingDistance / decelerationStep.distanceTraveled);
          this.scaleStepBasedOnLastCheckpoint(decelerationSequence.lastCheckpoint, decelerationStep, scaling);
          decelerationSequence.addCheckpointFromStep(decelerationStep, VerticalCheckpointReason.AtmosphericConditions);

          return decelerationSequence;
        }

        decelerationSequence.addDecelerationCheckpointFromStep(
          decelerationStep,
          FlapConfigurationProfile.getFlapCheckpointReasonByFlapConf(config.flapConfig),
          FlapConfigurationProfile.getApproachPhaseTargetSpeed(config.flapConfig, parameters),
        );
      }
    }

    if (!isDoneDeclerating()) {
      const config = this.configuration.setFromSpeed(
        decelerationSequence.lastCheckpoint.speed,
        parameters,
        useSpeedbrakes,
      );

      // Fly constant speed instead
      const constantSpeedStep = this.fpaStrategy.predictToDistance(
        decelerationSequence.lastCheckpoint.altitude,
        targetDistanceFromStart - decelerationSequence.lastCheckpoint.distanceFromStart,
        decelerationSequence.lastCheckpoint.speed,
        parameters.managedDescentSpeedMach,
        decelerationSequence.lastCheckpoint.remainingFuelOnBoard,
        windProfile.getHeadwindComponent(
          decelerationSequence.lastCheckpoint.distanceFromStart,
          decelerationSequence.lastCheckpoint.altitude,
        ),
        config,
      );

      decelerationSequence.addDecelerationCheckpointFromStep(
        constantSpeedStep,
        FlapConfigurationProfile.getFlapCheckpointReasonByFlapConf(config.flapConfig),
        FlapConfigurationProfile.getApproachPhaseTargetSpeed(config.flapConfig, parameters),
      );
    }

    return decelerationSequence;
  }
}
