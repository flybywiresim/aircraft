// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { CruisePathBuilder } from '@fmgc/guidance/vnav/cruise/CruisePathBuilder';
import { DescentPathBuilder } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { NavGeometryProfile, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { ClimbStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { ApproachPathBuilder } from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { ProfileInterceptCalculator } from '@fmgc/guidance/vnav/descent/ProfileInterceptCalculator';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';

export class CruiseToDescentCoordinator {
  private lastEstimatedFuelAtDestination: Pounds = 4000;

  private lastEstimatedTimeAtDestination: Seconds = 0;

  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    private cruisePathBuilder: CruisePathBuilder,
    private descentPathBuilder: DescentPathBuilder,
    private approachPathBuilder: ApproachPathBuilder,
    private readonly acConfig: AircraftConfig,
  ) {}

  resetEstimations() {
    const { estimatedDestinationFuel } = this.observer.get();

    // Use INIT FUEL PRED entry as initial estimate for destination EFOB. Clamp it to avoid unrealistic entries from erroneous pilot input.
    this.lastEstimatedFuelAtDestination = Number.isFinite(estimatedDestinationFuel)
      ? Math.min(Math.max(estimatedDestinationFuel, 0), this.acConfig.vnavConfig.MAXIMUM_FUEL_ESTIMATE)
      : 4000;
    this.lastEstimatedTimeAtDestination = 0;
  }

  buildCruiseAndDescentPath(
    profile: NavGeometryProfile,
    speedProfile: SpeedProfile,
    cruiseWinds: HeadwindProfile,
    descentWinds: HeadwindProfile,
    stepClimbStrategy: ClimbStrategy,
    stepDescentStrategy: DescentStrategy,
  ) {
    // - Start with initial guess for fuel on board at destination
    // - Compute descent profile to get distance to T/D and burnt fuel during descent
    // - Compute cruise profile to T/D -> Use fuel at T/D and previously computed fuel burn to get new fuel on board at destination
    // - Repeat
    const startingPointIndex = profile.findLastVerticalCheckpointIndex(
      VerticalCheckpointReason.TopOfClimb,
      VerticalCheckpointReason.PresentPosition,
    );

    if (startingPointIndex < 0) {
      return;
    }

    let startingPoint = profile.checkpoints[startingPointIndex];

    let iterationCount = 0;
    let todFuelError = Infinity;
    let todTimeError = Infinity;

    if (Number.isNaN(this.lastEstimatedFuelAtDestination) || Number.isNaN(this.lastEstimatedTimeAtDestination)) {
      this.resetEstimations();
    }

    let descentPath = new TemporaryCheckpointSequence();
    let cruisePath = new TemporaryCheckpointSequence();

    while (iterationCount++ < 4 && (Math.abs(todFuelError) > 100 || Math.abs(todTimeError) > 1)) {
      descentPath = this.approachPathBuilder.computeApproachPath(
        profile,
        speedProfile,
        descentWinds,
        this.lastEstimatedFuelAtDestination,
        this.lastEstimatedTimeAtDestination,
      );

      if (descentPath.lastCheckpoint.reason !== VerticalCheckpointReason.Decel) {
        console.error('[FMS/VNAV] Approach path did not end in DECEL. Discarding descent profile.');
        return;
      }

      // Geometric and idle
      this.descentPathBuilder.computeManagedDescentPath(
        descentPath,
        profile,
        speedProfile,
        descentWinds,
        this.cruisePathBuilder.getFinalCruiseAltitude(profile.cruiseSteps),
      );

      // @ts-ignore TS thinks it can narrow descentPath.lastCheckpoint.reason to VerticalCheckpointReason.Decel because
      // of line 71, but this is wrong, as computeManagedDescentPath changes descentPath.
      if (descentPath.lastCheckpoint.reason !== VerticalCheckpointReason.TopOfDescent) {
        console.error('[FMS/VNAV] Approach path did not end in T/D. Discarding descent profile.');
        return;
      }

      if (descentPath.lastCheckpoint.distanceFromStart < startingPoint.distanceFromStart) {
        // Check if plane is past T/D.
        if (startingPoint.reason === VerticalCheckpointReason.PresentPosition) {
          // At this point, there will still be a PresentPosition checkpoint in the profile, but we use it and remove it in DescentGuidance
          profile.checkpoints.push(...descentPath.get(true).reverse());

          return;
        }
        if (startingPoint.reason === VerticalCheckpointReason.TopOfClimb) {
          // Flight plan too short
          const [index, climbDescentInterceptDistance] = ProfileInterceptCalculator.calculateIntercept(
            profile.checkpoints,
            descentPath.checkpoints,
          );

          // If we somehow don't find an intercept between climb and descent path, just build the cruise path until end of the path
          if (index < 0) {
            cruisePath = this.cruisePathBuilder.computeCruisePath(
              profile,
              this.acConfig,
              startingPoint,
              descentPath.at(0).distanceFromStart,
              stepClimbStrategy,
              stepDescentStrategy,
              speedProfile,
              cruiseWinds,
            );

            console.error(
              '[FMS/VNAV] Edge case: Flight plan too short. However, no intercept between climb and descent path.',
            );
            profile.checkpoints.push(...cruisePath.get());

            return;
          }

          // If there is an intercept, place the T/D wherever we need it
          const combinedTopOfClimbTopOfDescent = profile.addInterpolatedCheckpoint(climbDescentInterceptDistance, {
            reason: VerticalCheckpointReason.TopOfClimb,
          });
          const savedTopOfDescent = descentPath.lastCheckpoint;
          descentPath.checkpoints = descentPath.checkpoints.filter(
            (checkpoint) => checkpoint.distanceFromStart >= combinedTopOfClimbTopOfDescent.distanceFromStart,
          );
          // TODO: We should interpolate this point along the descent path, so fuel and time are correct
          descentPath.push({
            ...savedTopOfDescent,
            distanceFromStart: combinedTopOfClimbTopOfDescent.distanceFromStart,
            altitude: combinedTopOfClimbTopOfDescent.altitude,
          });

          startingPoint = combinedTopOfClimbTopOfDescent;
        }
      }

      cruisePath = this.cruisePathBuilder.computeCruisePath(
        profile,
        this.acConfig,
        startingPoint,
        descentPath.lastCheckpoint.distanceFromStart,
        stepClimbStrategy,
        stepDescentStrategy,
        speedProfile,
        cruiseWinds,
      );

      if (!cruisePath) {
        console.error('[FMS/VNAV] Could not coordinate cruise and descent path. Discarding descent profile');
        return;
      }

      todFuelError = cruisePath.lastCheckpoint.remainingFuelOnBoard - descentPath.lastCheckpoint.remainingFuelOnBoard;
      todTimeError = cruisePath.lastCheckpoint.secondsFromPresent - descentPath.lastCheckpoint.secondsFromPresent;

      this.lastEstimatedFuelAtDestination += todFuelError;
      this.lastEstimatedTimeAtDestination += todTimeError;
    }

    profile.checkpoints = profile.checkpoints.filter(
      (checkpoint) => checkpoint.distanceFromStart <= startingPoint.distanceFromStart,
    );

    profile.checkpoints.push(...cruisePath.get());
    profile.checkpoints.push(...descentPath.get(true).reverse());
  }
}
