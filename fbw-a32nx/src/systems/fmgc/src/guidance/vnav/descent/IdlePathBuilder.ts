// @ts-strict-ignore
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { SpeedProfile, ManagedSpeedType } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import {
  VerticalCheckpointReason,
  MaxSpeedConstraint,
  VerticalCheckpoint,
  ProfilePhase,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { BaseGeometryProfile } from '../profile/BaseGeometryProfile';

export class IdlePathBuilder {
  private readonly idleDescentStrategy: DescentStrategy;

  /**
   * Sometimes we want to check if two distances are close enough to each other to be considered equal, or sometimes we
   * want to use a distance "just before" or "just after" another distance.
   */
  private static readonly DISTANCE_EPSILON = 1e-4;

  constructor(
    private computationParametersObserver: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {
    this.idleDescentStrategy = new IdleDescentStrategy(
      computationParametersObserver,
      atmosphericConditions,
      this.acConfig,
    );
  }

  buildIdlePath(
    profile: BaseGeometryProfile,
    sequence: TemporaryCheckpointSequence,
    descentSpeedConstraints: MaxSpeedConstraint[],
    speedProfile: SpeedProfile,
    topOfDescentAltitude: Feet,
    toDistance: NauticalMiles = -Infinity,
  ): void {
    // Assume the last checkpoint is the start of the geometric path
    sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.IdlePathEnd });

    this.buildIdleSequence(profile, sequence, descentSpeedConstraints, speedProfile, topOfDescentAltitude, toDistance);

    if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.IdlePathAtmosphericConditions) {
      sequence.lastCheckpoint.reason = VerticalCheckpointReason.TopOfDescent;
    } else {
      sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.TopOfDescent });
    }
  }

  private buildIdleSequence(
    profile: BaseGeometryProfile,
    sequence: TemporaryCheckpointSequence,
    descentSpeedConstraints: MaxSpeedConstraint[],
    speedProfile: SpeedProfile,
    topOfDescentAltitude: Feet,
    toDistance: NauticalMiles = -Infinity,
  ) {
    const { managedDescentSpeedMach, descentSpeedLimit } = this.computationParametersObserver.get();
    const speedConstraintsAhead = this.speedConstraintGenerator(descentSpeedConstraints, sequence);

    // We try to figure out what speed we might be decelerating for
    let previousCasTarget =
      this.tryGetAnticipatedTarget(
        sequence,
        descentSpeedConstraints,
        speedProfile.shouldTakeDescentSpeedLimitIntoAccount() ? descentSpeedLimit : null,
      ) ??
      speedProfile.getTarget(
        sequence.lastCheckpoint.distanceFromStart,
        sequence.lastCheckpoint.altitude,
        ManagedSpeedType.Descent,
      );
    let wasPreviouslyUnderSpeedLimitAltitude =
      speedProfile.shouldTakeDescentSpeedLimitIntoAccount() &&
      sequence.lastCheckpoint.altitude < descentSpeedLimit.underAltitude;

    for (
      let i = 0;
      i < 100 &&
      !MathUtils.isCloseToLessThan(sequence.lastCheckpoint.distanceFromStart, toDistance) &&
      !MathUtils.isCloseToLessThan(topOfDescentAltitude, sequence.lastCheckpoint.altitude, 1);
      i++
    ) {
      const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = sequence.lastCheckpoint;
      const headwind = -profile.winds.getDescentTailwind(distanceFromStart, altitude);

      const isUnderSpeedLimitAltitude =
        speedProfile.shouldTakeDescentSpeedLimitIntoAccount() && altitude < descentSpeedLimit.underAltitude;

      const casTarget = speedProfile.getTarget(
        distanceFromStart - IdlePathBuilder.DISTANCE_EPSILON,
        altitude + IdlePathBuilder.DISTANCE_EPSILON,
        ManagedSpeedType.Descent,
      );
      const currentSpeedTarget = Math.min(
        casTarget,
        this.atmosphericConditions.computeCasFromMach(managedDescentSpeedMach, altitude),
      );
      const canAccelerate = currentSpeedTarget > speed;

      if (canAccelerate) {
        // Build acceleration path
        const speedStep = this.idleDescentStrategy.predictToSpeed(
          altitude,
          casTarget,
          speed,
          managedDescentSpeedMach,
          remainingFuelOnBoard,
          headwind,
        );
        const scaling = Math.min(
          1,
          (topOfDescentAltitude - altitude) / (speedStep.finalAltitude - altitude),
          (toDistance - sequence.lastCheckpoint.distanceFromStart) / speedStep.distanceTraveled,
        );
        this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, speedStep, scaling);

        const didCrossoverSpeedLimitAltitude = wasPreviouslyUnderSpeedLimitAltitude && !isUnderSpeedLimitAltitude;
        const checkpointReason = didCrossoverSpeedLimitAltitude
          ? VerticalCheckpointReason.StartDecelerationToLimit
          : VerticalCheckpointReason.StartDecelerationToConstraint;

        sequence.addDecelerationCheckpointFromStep(
          speedStep,
          checkpointReason,
          previousCasTarget,
          ProfilePhase.Descent,
        );
      } else {
        // Try alt path
        let finalAltitude = Math.min(altitude + 1500, topOfDescentAltitude);

        if (isUnderSpeedLimitAltitude) {
          finalAltitude = Math.min(finalAltitude, descentSpeedLimit.underAltitude);
        }

        const altitudeStep = this.idleDescentStrategy.predictToAltitude(
          altitude,
          finalAltitude,
          speed,
          managedDescentSpeedMach,
          remainingFuelOnBoard,
          headwind,
        );
        const scaling = Math.min(
          1,
          (toDistance - sequence.lastCheckpoint.distanceFromStart) / altitudeStep.distanceTraveled,
        );
        this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, altitudeStep, scaling);

        const reason =
          isUnderSpeedLimitAltitude && altitudeStep.finalAltitude >= descentSpeedLimit.underAltitude
            ? VerticalCheckpointReason.CrossingDescentSpeedLimit
            : VerticalCheckpointReason.IdlePathAtmosphericConditions;

        // Check if constraint violated
        const nextSpeedConstraint = speedConstraintsAhead.next();
        if (
          !nextSpeedConstraint.done &&
          distanceFromStart + altitudeStep.distanceTraveled < nextSpeedConstraint.value.distanceFromStart
        ) {
          // Constraint violated
          const distanceToConstraint = nextSpeedConstraint.value.distanceFromStart - distanceFromStart;
          const distanceStep = this.idleDescentStrategy.predictToDistance(
            altitude,
            distanceToConstraint,
            speed,
            managedDescentSpeedMach,
            remainingFuelOnBoard,
            headwind,
          );
          sequence.addCheckpointFromStep(distanceStep, VerticalCheckpointReason.SpeedConstraint, ProfilePhase.Descent);
        } else {
          sequence.addCheckpointFromStep(altitudeStep, reason, ProfilePhase.Descent);
        }
      }

      previousCasTarget = casTarget;
      wasPreviouslyUnderSpeedLimitAltitude = isUnderSpeedLimitAltitude;
    }
  }

  // TODO: I really don't know if this function does what it's supposed to, so I hope I don't have to return to it.
  // The problem it's trying to solve is this: After having built the geometric path to the first violating altitude constraint, we might not be at econ speed yet.
  // So then we need to accelerate to it on the idle path. However, we want to figure out what the reason for this acceleration is, i.e whether it is due
  // to the speed limit or a constraint. We need to know this to place the correct checkpoint reason.
  // What the function does is to try and figure this out based on different criteria.
  private tryGetAnticipatedTarget(
    sequence: TemporaryCheckpointSequence,
    speedConstraints: MaxSpeedConstraint[],
    speedLimit?: SpeedLimit,
  ): Knots | null {
    const {
      distanceFromStart: pposDistanceFromStart,
      speed: currentSpeed,
      altitude: currentAltitude,
    } = sequence.lastCheckpoint;

    // Find next constraint
    const nextSpeedConstraint = speedConstraints.find(
      (c) => c.distanceFromStart >= pposDistanceFromStart && c.maxSpeed <= currentSpeed,
    );

    const isSpeedLimitValidCandidate =
      speedLimit && currentAltitude > speedLimit.underAltitude && currentSpeed > speedLimit.speed;

    if (nextSpeedConstraint) {
      // Try to figure out which speed is more important
      if (isSpeedLimitValidCandidate) {
        const altAtConstraint = sequence.interpolateAltitudeBackwards(nextSpeedConstraint.distanceFromStart);

        if (speedLimit.underAltitude > altAtConstraint) {
          return speedLimit.speed;
        }
      }

      return nextSpeedConstraint.maxSpeed;
    }

    // If we did not find a valid speed constraint candidate, see if the speed limit might be a candidate. If so, return it.
    if (isSpeedLimitValidCandidate) {
      return speedLimit.speed;
    }

    return null;
  }

  private scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
    step.distanceTraveled *= scaling;
    step.fuelBurned *= scaling;
    step.timeElapsed *= scaling;
    step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
    step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
  }

  private *speedConstraintGenerator(
    constraints: MaxSpeedConstraint[],
    sequence: TemporaryCheckpointSequence,
  ): Generator<MaxSpeedConstraint> {
    for (let i = constraints.length - 1; i >= 0; ) {
      // Small tolerance here, so we don't get stuck on a constraint
      if (MathUtils.isCloseToGreaterThan(constraints[i].distanceFromStart, sequence.lastCheckpoint.distanceFromStart)) {
        i--;
        continue;
      }

      yield constraints[i];
    }
  }
}
