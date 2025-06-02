// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { ClimbStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { EngineModel } from '@fmgc/guidance/vnav/EngineModel';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { Predictions, StepResults } from '../Predictions';
import {
  GeographicCruiseStep,
  MaxSpeedConstraint,
  NavGeometryProfile,
  ProfilePhase,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '../profile/NavGeometryProfile';
import { AtmosphericConditions } from '../AtmosphericConditions';
import { VnavConfig } from '../VnavConfig';

export class CruisePathBuilder {
  constructor(
    private computationParametersObserver: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
  ) {}

  computeCruisePath(
    profile: NavGeometryProfile,
    config: AircraftConfig,
    startOfCruise: VerticalCheckpoint,
    targetDistanceFromStart: NauticalMiles,
    stepClimbStrategy: ClimbStrategy,
    stepDescentStrategy: DescentStrategy,
    speedProfile: SpeedProfile,
  ): TemporaryCheckpointSequence {
    const sequence = new TemporaryCheckpointSequence(startOfCruise);

    for (const step of profile.cruiseSteps) {
      if (step.isIgnored) {
        continue;
      }

      // If the step is too close to T/D
      if (
        step.distanceFromStart < startOfCruise.distanceFromStart ||
        step.distanceFromStart > targetDistanceFromStart
      ) {
        this.ignoreCruiseStep(profile, step);
        continue;
      }

      // See if there are any speed constraints before the step
      for (const speedConstraint of profile.maxClimbSpeedConstraints) {
        if (speedConstraint.distanceFromStart > step.distanceFromStart) {
          continue;
        }

        this.addSegmentToSpeedConstraint(profile, config, sequence, speedConstraint, speedProfile);
      }

      const { distanceFromStart, altitude } = sequence.lastCheckpoint;

      this.computeCruiseSegment(
        profile,
        sequence,
        config,
        step.distanceFromStart,
        speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Cruise),
      );

      const addingStepSuccessful = this.tryAddStepFromLastCheckpoint(
        sequence,
        step,
        stepClimbStrategy,
        stepDescentStrategy,
        targetDistanceFromStart,
      );
      if (!addingStepSuccessful) {
        this.ignoreCruiseStep(profile, step);
        continue;
      }
    }

    // Once again, we check if there are any speed constraints before the T/D
    for (const speedConstraint of profile.maxClimbSpeedConstraints) {
      // If speed constraint does not lie along the remaining cruise track
      if (speedConstraint.distanceFromStart > targetDistanceFromStart) {
        continue;
      }

      this.addSegmentToSpeedConstraint(profile, config, sequence, speedConstraint, speedProfile);
    }

    if (sequence.lastCheckpoint.distanceFromStart >= targetDistanceFromStart) {
      return sequence;
    }

    const speedTarget = speedProfile.getTarget(
      sequence.lastCheckpoint.distanceFromStart,
      sequence.lastCheckpoint.altitude,
      ManagedSpeedType.Cruise,
    );

    if (speedTarget - sequence.lastCheckpoint.speed > 1) {
      const headwind = -profile.winds.getCruiseTailwind(
        sequence.lastCheckpoint.distanceFromStart,
        sequence.lastCheckpoint.distanceFromStart - profile.distanceToPresentPosition,
        sequence.lastCheckpoint.altitude,
      );

      const accelerationStep = this.levelAccelerationStep(
        config,
        sequence.lastCheckpoint.distanceFromStart,
        sequence.lastCheckpoint.speed,
        speedTarget,
        headwind,
      );

      sequence.addCheckpointFromStep(
        accelerationStep,
        VerticalCheckpointReason.AtmosphericConditions,
        ProfilePhase.Cruise,
      );
    }

    if (VnavConfig.DEBUG_PROFILE && targetDistanceFromStart < sequence.lastCheckpoint.distanceFromStart) {
      console.warn(
        '[FMS/VNAV] An acceleration step in the cruise took us past T/D. This is not implemented properly yet. Blame BBK',
      );
    }

    this.computeCruiseSegment(profile, sequence, config, targetDistanceFromStart, speedTarget);

    return sequence;
  }

  private addSegmentToSpeedConstraint(
    profile: NavGeometryProfile,
    config: AircraftConfig,
    sequence: TemporaryCheckpointSequence,
    speedConstraint: MaxSpeedConstraint,
    speedProfile: SpeedProfile,
  ) {
    const { distanceFromStart, altitude } = sequence.lastCheckpoint;

    if (speedConstraint.distanceFromStart < distanceFromStart) {
      return;
    }

    this.computeCruiseSegment(
      profile,
      sequence,
      config,
      speedConstraint.distanceFromStart,
      speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Cruise),
      VerticalCheckpointReason.SpeedConstraint,
    );
  }

  /**
   * Compute a cruise step segment and add it unless it is too close to T/D.
   * @param sequence
   * @param step
   * @param stepClimbStrategy
   * @param stepDescentStrategy
   * @param maxDistance
   * @returns
   */
  private tryAddStepFromLastCheckpoint(
    sequence: TemporaryCheckpointSequence,
    step: GeographicCruiseStep,
    stepClimbStrategy: ClimbStrategy,
    stepDescentStrategy: DescentStrategy,
    maxDistance: NauticalMiles,
  ) {
    const { managedCruiseSpeed, managedCruiseSpeedMach } = this.computationParametersObserver.get();
    const { altitude, distanceFromStart, remainingFuelOnBoard } = sequence.lastCheckpoint;

    const isClimbVsDescent = step.toAltitude > altitude;
    // Instead of just atmospheric conditions, the last checkpoint is now a step climb point
    if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.AtmosphericConditions) {
      sequence.lastCheckpoint.reason = isClimbVsDescent
        ? VerticalCheckpointReason.StepClimb
        : VerticalCheckpointReason.StepDescent;
    }

    const stepResults = isClimbVsDescent
      ? stepClimbStrategy.predictToAltitude(
          altitude,
          step.toAltitude,
          managedCruiseSpeed,
          managedCruiseSpeedMach,
          remainingFuelOnBoard,
          WindComponent.zero(),
        )
      : stepDescentStrategy.predictToAltitude(
          altitude,
          step.toAltitude,
          managedCruiseSpeed,
          managedCruiseSpeed,
          remainingFuelOnBoard,
          WindComponent.zero(),
        );

    // If the step end is closer than 50 NM to T/D, the step is ignored.
    if (distanceFromStart + stepResults.distanceTraveled - maxDistance > -50) {
      return false;
    }

    sequence.addCheckpointFromStep(
      stepResults,
      isClimbVsDescent ? VerticalCheckpointReason.TopOfStepClimb : VerticalCheckpointReason.BottomOfStepDescent,
      ProfilePhase.Cruise,
    );

    return true;
  }

  private computeCruiseSegment(
    profile: NavGeometryProfile,
    sequence: TemporaryCheckpointSequence,
    config: AircraftConfig,
    targetDistanceFromStart: NauticalMiles,
    speed: Knots,
    reason: VerticalCheckpointReason = VerticalCheckpointReason.AtmosphericConditions,
  ) {
    const MaxStepDistance = 50;

    const { zeroFuelWeight, managedCruiseSpeedMach, tropoPause } = this.computationParametersObserver.get();

    // Keep track of the state here instead of adding a checkpoint for every step to reduce the number of allocations
    const state = {
      distanceFromStart: sequence.lastCheckpoint.distanceFromStart,
      secondsFromPresent: sequence.lastCheckpoint.secondsFromPresent,
      remainingFuelOnBoard: sequence.lastCheckpoint.remainingFuelOnBoard,
    };

    let numIterations = 0;
    for (; numIterations < 1000 && state.distanceFromStart < targetDistanceFromStart; numIterations++) {
      const headwind = -profile.winds.getCruiseTailwind(
        state.distanceFromStart,
        state.distanceFromStart - profile.distanceToPresentPosition,
        sequence.lastCheckpoint.altitude,
      );

      const step = Predictions.levelFlightStep(
        config,
        sequence.lastCheckpoint.altitude,
        Math.min(targetDistanceFromStart - state.distanceFromStart, MaxStepDistance),
        speed,
        managedCruiseSpeedMach,
        zeroFuelWeight,
        state.remainingFuelOnBoard,
        headwind,
        this.atmosphericConditions.isaDeviation,
        tropoPause,
      );

      state.distanceFromStart += step.distanceTraveled;
      state.secondsFromPresent += step.timeElapsed;
      state.remainingFuelOnBoard -= step.fuelBurned;
    }

    if (numIterations > 0) {
      sequence.push({
        reason,
        distanceFromStart: state.distanceFromStart,
        altitude: sequence.lastCheckpoint.altitude,
        secondsFromPresent: state.secondsFromPresent,
        remainingFuelOnBoard: state.remainingFuelOnBoard,
        speed,
        mach: managedCruiseSpeedMach,
        profilePhase: ProfilePhase.Cruise,
      });
    }
  }

  private levelAccelerationStep(
    config: AircraftConfig,
    remainingFuelOnBoard: number,
    speed: Knots,
    finalSpeed: Knots,
    headwind: number,
  ): StepResults {
    const { zeroFuelWeight, cruiseAltitude, managedCruiseSpeedMach, tropoPause } =
      this.computationParametersObserver.get();

    const staticAirTemperature = this.atmosphericConditions.predictStaticAirTemperatureAtAltitude(cruiseAltitude);

    return Predictions.speedChangeStep(
      config,
      0,
      cruiseAltitude,
      speed,
      finalSpeed,
      managedCruiseSpeedMach,
      managedCruiseSpeedMach,
      EngineModel.getClimbThrustCorrectedN1(config.engineModelParameters, cruiseAltitude, staticAirTemperature),
      zeroFuelWeight,
      remainingFuelOnBoard,
      headwind,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
    );
  }

  getFinalCruiseAltitude(cruiseSteps: GeographicCruiseStep[]): Feet {
    const { cruiseAltitude } = this.computationParametersObserver.get();

    let altitude = cruiseAltitude;
    for (let i = 0; i < cruiseSteps.length; i++) {
      const step = cruiseSteps[i];
      if (!step.isIgnored) {
        altitude = step.toAltitude;
      }
    }

    return altitude;
  }

  private ignoreCruiseStep(profile: NavGeometryProfile, step: GeographicCruiseStep) {
    step.isIgnored = true;
    profile.ignoreCruiseStep(step.waypointIndex);
  }
}
