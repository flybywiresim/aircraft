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
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { Predictions, StepResults } from '../Predictions';
import {
  GeographicCruiseStep,
  MaxSpeedConstraint,
  NavGeometryProfile,
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
    windProfile: HeadwindProfile,
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

        this.addSegmentToSpeedConstraint(config, sequence, speedConstraint, speedProfile, windProfile);
      }

      const { distanceFromStart, altitude, remainingFuelOnBoard } = sequence.lastCheckpoint;

      const speed = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Cruise);
      const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
      const segmentToStep = this.computeCruiseSegment(
        config,
        altitude,
        step.distanceFromStart - distanceFromStart,
        remainingFuelOnBoard,
        speed,
        headwind,
      );
      sequence.addCheckpointFromStep(segmentToStep, VerticalCheckpointReason.AtmosphericConditions);

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

      this.addSegmentToSpeedConstraint(config, sequence, speedConstraint, speedProfile, windProfile);
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
      const accelerationStep = this.levelAccelerationStep(
        config,
        sequence.lastCheckpoint.distanceFromStart,
        sequence.lastCheckpoint.speed,
        speedTarget,
        windProfile.getHeadwindComponent(
          sequence.lastCheckpoint.distanceFromStart,
          sequence.lastCheckpoint.distanceFromStart,
        ),
      );

      sequence.addCheckpointFromStep(accelerationStep, VerticalCheckpointReason.AtmosphericConditions);
    }

    if (VnavConfig.DEBUG_PROFILE && targetDistanceFromStart < sequence.lastCheckpoint.distanceFromStart) {
      console.warn(
        '[FMS/VNAV] An acceleration step in the cruise took us past T/D. This is not implemented properly yet. Blame BBK',
      );
    }

    const step = this.computeCruiseSegment(
      config,
      sequence.lastCheckpoint.altitude,
      targetDistanceFromStart - sequence.lastCheckpoint.distanceFromStart,
      startOfCruise.remainingFuelOnBoard,
      speedTarget,
      windProfile.getHeadwindComponent(sequence.lastCheckpoint.distanceFromStart, sequence.lastCheckpoint.altitude),
    );

    sequence.addCheckpointFromStep(step, VerticalCheckpointReason.AtmosphericConditions);

    return sequence;
  }

  private addSegmentToSpeedConstraint(
    config: AircraftConfig,
    sequence: TemporaryCheckpointSequence,
    speedConstraint: MaxSpeedConstraint,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
  ) {
    const { distanceFromStart, altitude, remainingFuelOnBoard } = sequence.lastCheckpoint;

    if (speedConstraint.distanceFromStart < distanceFromStart) {
      return;
    }

    const speed = speedProfile.getTarget(distanceFromStart, altitude, ManagedSpeedType.Cruise);
    const segmentResult = this.computeCruiseSegment(
      config,
      altitude,
      speedConstraint.distanceFromStart - distanceFromStart,
      remainingFuelOnBoard,
      speed,
      windProfile.getHeadwindComponent(distanceFromStart, altitude),
    );

    sequence.addCheckpointFromStep(segmentResult, VerticalCheckpointReason.SpeedConstraint);
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
    );

    return true;
  }

  private computeCruiseSegment(
    config: AircraftConfig,
    altitude: Feet,
    distance: NauticalMiles,
    remainingFuelOnBoard: number,
    speed: Knots,
    headwind: WindComponent,
  ): StepResults {
    const { zeroFuelWeight, managedCruiseSpeedMach, tropoPause } = this.computationParametersObserver.get();

    return Predictions.levelFlightStep(
      config,
      altitude,
      distance,
      speed,
      managedCruiseSpeedMach,
      zeroFuelWeight,
      remainingFuelOnBoard,
      headwind.value,
      this.atmosphericConditions.isaDeviation,
      tropoPause,
    );
  }

  private levelAccelerationStep(
    config: AircraftConfig,
    remainingFuelOnBoard: number,
    speed: Knots,
    finalSpeed: Knots,
    headwind: WindComponent,
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
      headwind.value,
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
