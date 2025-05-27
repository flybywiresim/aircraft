// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { ConstraintUtils } from '@flybywiresim/fbw-sdk';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalSpeedStrategy } from '@fmgc/guidance/vnav/climb/ClimbStrategy';
import { SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { AircraftConfiguration, AircraftConfigurationRegister } from '@fmgc/guidance/vnav/descent/ApproachPathBuilder';
import { DescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import {
  ApproachCheckpoint,
  MaxSpeedConstraint,
  NavGeometryProfile,
  VerticalCheckpoint,
  VerticalCheckpointForDeceleration,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import {
  VerticalProfileComputationParameters,
  VerticalProfileComputationParametersObserver,
} from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';
import { WindComponent } from '@fmgc/guidance/vnav/wind';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';

type MinimumDescentAltitudeConstraint = {
  distanceFromStart: NauticalMiles;
  minimumAltitude: Feet;
};

/**
 * The deceleration schedule describes the speed profile computed for the managed descent path.
 * The tactical path builder should know about this schedule because - while we might not be following the managed vertical profile -
 * we might still be in managed speed mode.
 */
export type DecelerationSchedule = {
  /**
   * The tactical path builder should predict decelerations at or before these points.
   * A speed change is a point at which the plane should start deceleration to meet a speed constraint or limit.
   * Speed changes are computed when the managed descent path is computed. When not following the managed profile, but managed speed,
   * the aircraft should start decelerating at these points or earlier as well, because we don't want the aircraft to intercept the managed profile
   * at the wrong speed.
   * A speed change used to be called "forcedDeceleration". If that name is still used in the code, it should be replaced with "speedChange".
   */
  speedChanges: VerticalCheckpointForDeceleration[];
  /**
   * The tactical path builder should predict decelerations at exactly these points.
   * Approach points are the checkpoints of the managed profile characterizing the approach path.
   */
  approachPoints: ApproachCheckpoint[];
};

export class TacticalDescentPathBuilder {
  private levelFlightStrategy: VerticalSpeedStrategy;

  constructor(
    private observer: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {
    this.levelFlightStrategy = new VerticalSpeedStrategy(this.observer, atmosphericConditions, 0, this.acConfig);
  }

  /**
   * Builds a path from the last checkpoint to the finalDistance
   * @param profile
   * @param descentStrategy
   * @param speedProfile
   * @param windProfile
   * @param finalDistance
   * @param schedule Schedule describing the managed descent path
   */
  buildMcduPredictionPath(
    profile: NavGeometryProfile,
    descentStrategy: DescentStrategy,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    schedule: DecelerationSchedule,
  ) {
    const start = profile.lastCheckpoint;

    let minAlt = Infinity;
    const altConstraintsToUse = profile.descentAltitudeConstraints.map((constraint) => {
      minAlt = Math.min(minAlt, ConstraintUtils.minimumAltitude(constraint.constraint));
      return {
        distanceFromStart: constraint.distanceFromStart,
        minimumAltitude: minAlt,
      } as MinimumDescentAltitudeConstraint;
    });

    const decelPointDistance = schedule.approachPoints[0]?.distanceFromStart ?? Infinity;
    const speedConstraintsToUse = profile.descentSpeedConstraints.filter(
      ({ distanceFromStart }) => distanceFromStart < decelPointDistance,
    );

    const phaseTable = new PhaseTable(this.observer.get(), windProfile);
    phaseTable.start = start;
    phaseTable.phases = [
      new DescendToAltitude(profile.finalAltitude).withReasonAfter(VerticalCheckpointReason.Landing),
    ];

    let isPathValid = false;
    let numRecomputations = 0;
    let sequence: TemporaryCheckpointSequence | null = null;
    while (!isPathValid && numRecomputations++ < 100) {
      sequence = phaseTable.execute(descentStrategy, this.levelFlightStrategy);
      isPathValid = this.checkForViolations(
        phaseTable,
        altConstraintsToUse,
        speedConstraintsToUse,
        speedProfile,
        schedule,
      );
    }

    if (VnavConfig.DEBUG_PROFILE && numRecomputations >= 100) {
      console.warn('[FMS/VNAV] Tactical path iteration terminated after 100 iterations. This indicates a logic error.');
    }

    if (sequence != null) {
      profile.checkpoints.push(...sequence.get());
    }
  }

  /**
   * Builds a path from the last checkpoint to the finalAltitude
   * @param profile
   * @param descentStrategy
   * @param speedProfile
   * @param windProfile
   * @param finalAltitude
   */
  buildTacticalDescentPathToAltitude(
    profile: BaseGeometryProfile,
    descentStrategy: DescentStrategy,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    finalAltitude: Feet,
    schedule: DecelerationSchedule,
  ) {
    const start = profile.lastCheckpoint;

    let minAlt = Infinity;
    const altConstraintsToUse = profile.descentAltitudeConstraints.map((constraint) => {
      minAlt = Math.min(minAlt, ConstraintUtils.minimumAltitude(constraint.constraint));
      return {
        distanceFromStart: constraint.distanceFromStart,
        minimumAltitude: minAlt,
      } as MinimumDescentAltitudeConstraint;
    });

    const decelPointDistance = schedule.approachPoints[0]?.distanceFromStart ?? Infinity;
    const speedConstraintsToUse = profile.descentSpeedConstraints.filter(
      ({ distanceFromStart }) => distanceFromStart < decelPointDistance,
    );

    const phaseTable = new PhaseTable(this.observer.get(), windProfile);
    phaseTable.start = start;
    phaseTable.phases = [
      new DescendToAltitude(finalAltitude).withReasonAfter(VerticalCheckpointReason.CrossingFcuAltitudeDescent),
    ];

    let isPathValid = false;
    let numRecomputations = 0;
    let sequence: TemporaryCheckpointSequence | null = null;
    while (!isPathValid && numRecomputations++ < 100) {
      sequence = phaseTable.execute(descentStrategy, this.levelFlightStrategy);
      isPathValid = this.checkForViolations(
        phaseTable,
        altConstraintsToUse,
        speedConstraintsToUse,
        speedProfile,
        schedule,
      );
    }

    // It's possible that the last phase (which is the one that the phase table is initialized with) is not executed because we've already got below
    // the final altitude through a different segment. In this case, we need to make sure we still get the level off arrow.
    // One scenario where this happens is if the final altitude is the speed limit alt (e.g 10000). In this case, we insert a deceleration segment, which might end just
    // slightly below the speed limit alt (= final alt), and the phase table will not execute the last phase because we're already below the final alt.
    if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.AtmosphericConditions) {
      sequence.lastCheckpoint.reason = VerticalCheckpointReason.CrossingFcuAltitudeDescent;
    }

    if (VnavConfig.DEBUG_PROFILE && numRecomputations >= 100) {
      console.warn('[FMS/VNAV] Tactical path iteration terminated after 100 iterations. This is a bug.');
    }

    if (sequence != null) {
      profile.checkpoints.push(...sequence.get());
    }
  }

  /**
   * Check the path for violations and handle them. Return true if the path is valid, false otherwise.
   * @param phaseTable
   * @param profile
   * @param altitudeConstraints
   * @param speedProfile
   * @param schedule The speed schedule describing the managed profile
   * @returns
   */
  private checkForViolations(
    phaseTable: PhaseTable,
    altitudeConstraints: MinimumDescentAltitudeConstraint[],
    speedConstraints: MaxSpeedConstraint[],
    speedProfile: SpeedProfile,
    schedule: DecelerationSchedule,
  ): boolean {
    const { descentSpeedLimit } = this.observer.get();

    let previousResult = phaseTable.start;
    for (let i = 0; i < phaseTable.phases.length; i++) {
      const phase = phaseTable.phases[i];
      if (!phase.lastResult) {
        continue;
      }

      for (const approachPoint of schedule.approachPoints) {
        if (this.doesPhaseViolateApproachPoint(phase, approachPoint)) {
          this.handleApproachPointViolation(phaseTable, i, approachPoint);

          return false;
        }
      }

      for (const speedChange of schedule.speedChanges) {
        if (this.doesPhaseViolateSpeedChange(phase, speedChange)) {
          if (speedChange.reason === VerticalCheckpointReason.StartDecelerationToConstraint) {
            this.handleConstraintSpeedChangeViolation(phaseTable, i, speedChange);
          } else if (speedChange.reason === VerticalCheckpointReason.StartDecelerationToLimit) {
            this.handleLimitSpeedChangeViolation(phaseTable, i, speedChange);
          }

          return false;
        }
      }

      for (const speedConstraint of speedConstraints) {
        if (this.doesPhaseViolateSpeedConstraint(previousResult, phase, speedConstraint)) {
          this.handleSpeedConstraintViolation(phaseTable, i, speedConstraint);

          return false;
        }
      }

      for (const altitudeConstraint of altitudeConstraints) {
        if (this.doesPhaseViolateAltitudeConstraint(previousResult, phase, altitudeConstraint)) {
          this.handleAltitudeConstraintViolation(phaseTable, i, altitudeConstraint);

          return false;
        }
      }

      if (speedProfile.shouldTakeDescentSpeedLimitIntoAccount()) {
        if (this.doesPhaseViolateSpeedLimit(previousResult, phase, descentSpeedLimit)) {
          this.handleSpeedLimitViolation(phaseTable, i, descentSpeedLimit);

          return false;
        }
      }

      previousResult = phase.lastResult;
    }

    return true;
  }

  private handleConstraintSpeedChangeViolation(
    phaseTable: PhaseTable,
    violatingPhaseIndex: number,
    speedChange: VerticalCheckpointForDeceleration,
  ) {
    const violatingPhase = phaseTable.phases[violatingPhaseIndex];

    if (violatingPhase instanceof DescendingDeceleration) {
      // If we are already decelerating, make sure we decelerate to the correct speed
      violatingPhase.toSpeed = Math.min(speedChange.targetSpeed, violatingPhase.toSpeed);
    } else {
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendToDistance(speedChange.distanceFromStart),
        // Use deceleration reason as before
        new DescendingDeceleration(speedChange.targetSpeed).withReasonBefore(speedChange.reason),
      );
    }
  }

  private handleLimitSpeedChangeViolation(
    phaseTable: PhaseTable,
    violatingPhaseIndex: number,
    speedChange: VerticalCheckpointForDeceleration,
  ) {
    const violatingPhase = phaseTable.phases[violatingPhaseIndex];

    if (violatingPhase instanceof DescendingDeceleration) {
      // If we are already decelerating, make sure we decelerate to the correct speed
      violatingPhase.toSpeed = Math.min(speedChange.targetSpeed, violatingPhase.toSpeed);

      const overshoot = violatingPhase.lastResult.altitude - speedChange.altitude;

      // Try to find a previous phase that we can shorten to allow more deceleration
      for (let i = violatingPhaseIndex - 1; i >= 0; i--) {
        const previousPhase = phaseTable.phases[i];

        if (previousPhase instanceof DescendToAltitude) {
          previousPhase.toAltitude -= overshoot;
        } else if (previousPhase instanceof DescendToDistance) {
          phaseTable.phases.splice(i, 1, new DescendToAltitude(previousPhase.lastResult.altitude - overshoot));
        }

        return;
      }
    } else {
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendToAltitude(speedChange.altitude),
        new DescendingDeceleration(speedChange.targetSpeed).withReasonBefore(
          VerticalCheckpointReason.StartDecelerationToLimit,
        ),
      );
    }
  }

  private handleSpeedConstraintViolation(
    phaseTable: PhaseTable,
    violatingPhaseIndex: number,
    speedConstraint: MaxSpeedConstraint,
  ) {
    const violatingPhase = phaseTable.phases[violatingPhaseIndex];

    // If the deceleration is not long enough, extend it
    if (violatingPhase instanceof DescendingDeceleration) {
      // If we are already decelerating, make sure we decelerate to the correct speed
      violatingPhase.toSpeed = Math.min(speedConstraint.maxSpeed, violatingPhase.toSpeed);

      const overshoot = violatingPhase.lastResult.distanceFromStart - speedConstraint.distanceFromStart;

      // Try to find a previous phase that we can shorten to allow more deceleration
      for (let i = violatingPhaseIndex - 1; i >= 0; i--) {
        const previousPhase = phaseTable.phases[i];

        if (!previousPhase.lastResult) {
          continue;
        }

        if (previousPhase instanceof DescendToAltitude) {
          // If we need to decelerate earlier, then replace the altitude segment with a distance segment
          phaseTable.phases.splice(i, 1, new DescendToDistance(previousPhase.lastResult.distanceFromStart - overshoot));

          return;
        }
        if (previousPhase instanceof DescendToDistance) {
          previousPhase.toDistance -= overshoot;

          return;
        }
      }
    } else {
      // If we don't even have a deceleration segment yet, fly to 3 miles before constraint and add the segment
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendToDistance(speedConstraint.distanceFromStart - 3),
        new DescendingDeceleration(speedConstraint.maxSpeed).withReasonBefore(
          VerticalCheckpointReason.StartDecelerationToConstraint,
        ),
      );
    }
  }

  private handleAltitudeConstraintViolation(
    phaseTable: PhaseTable,
    violatingPhaseIndex: number,
    altitudeConstraint: MinimumDescentAltitudeConstraint,
  ) {
    const violatingPhase = phaseTable.phases[violatingPhaseIndex];

    if (violatingPhase instanceof DescendingDeceleration) {
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendingDeceleration(violatingPhase.toSpeed)
          .withReasonBefore(violatingPhase.reasonBefore)
          .withMinAltitude(altitudeConstraint.minimumAltitude)
          .withReasonAfter(VerticalCheckpointReason.LevelOffForDescentConstraint),
        new DescendingDeceleration(violatingPhase.toSpeed)
          .asLevelSegment()
          .withMaxDistance(altitudeConstraint.distanceFromStart),
      );

      // Transfer reason at start of this leg (`reasonBefore`) to leg that was inserted behind this one
      violatingPhase.reasonBefore = VerticalCheckpointReason.AtmosphericConditions;
    } else if (violatingPhase instanceof DescendToAltitude) {
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendToAltitude(altitudeConstraint.minimumAltitude).withReasonAfter(
          VerticalCheckpointReason.LevelOffForDescentConstraint,
        ),
        new DescendToDistance(altitudeConstraint.distanceFromStart).asLevelSegment(),
      );
    } else if (violatingPhase instanceof DescendToDistance) {
      if (altitudeConstraint.distanceFromStart < violatingPhase.toDistance) {
        // If the altitude constraint comes before the distance we want to achieve, level off at the the constraint alitude, fly level to the constraint, then continue
        // descending to the original distance
        phaseTable.phases.splice(
          violatingPhaseIndex,
          0,
          new DescendToAltitude(altitudeConstraint.minimumAltitude).withReasonAfter(
            VerticalCheckpointReason.LevelOffForDescentConstraint,
          ),
          new DescendToDistance(altitudeConstraint.distanceFromStart).asLevelSegment(),
        );
      } else {
        // If the altitude constraint comes after the distance we want to achieve, level off at the the constraint alitude, fly level to the original distance
        phaseTable.phases.splice(
          violatingPhaseIndex,
          1,
          new DescendToAltitude(altitudeConstraint.minimumAltitude).withReasonAfter(
            VerticalCheckpointReason.LevelOffForDescentConstraint,
          ),
          new DescendToDistance(violatingPhase.toDistance).asLevelSegment(),
        );
      }
    }
  }

  private handleSpeedLimitViolation(phaseTable: PhaseTable, violatingPhaseIndex: number, speedLimit: SpeedLimit) {
    const violatingPhase = phaseTable.phases[violatingPhaseIndex];

    if (violatingPhase instanceof DescendingDeceleration) {
      violatingPhase.toSpeed = Math.min(speedLimit.speed, violatingPhase.toSpeed);

      const overshoot = violatingPhase.lastResult.altitude - speedLimit.underAltitude; // This is typically negative

      for (let i = violatingPhaseIndex - 1; i >= 0; i--) {
        const previousPhase = phaseTable.phases[i];

        // If the previous phase has not been calculated, it probably means that we are already at the distance/altitude that it was aiming for,
        // so we should not try to shorten it.
        if (!previousPhase.lastResult) {
          continue;
        }

        if (previousPhase instanceof DescendToAltitude) {
          previousPhase.toAltitude -= overshoot;
        } else if (previousPhase instanceof DescendToDistance) {
          phaseTable.phases.splice(
            violatingPhaseIndex,
            1,
            new DescendToAltitude(previousPhase.lastResult.altitude - overshoot),
          );
        }

        return;
      }
    } else {
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendToAltitude(speedLimit.underAltitude + 100),
        new DescendingDeceleration(speedLimit.speed).withReasonBefore(
          VerticalCheckpointReason.StartDecelerationToLimit,
        ),
      );
    }
  }

  private handleApproachPointViolation(
    phaseTable: PhaseTable,
    violatingPhaseIndex: number,
    approachPoint: ApproachCheckpoint,
  ) {
    const violatingPhase = phaseTable.phases[violatingPhaseIndex];

    if (violatingPhase instanceof DescendingDeceleration) {
      // If we are already decelerating, make sure we decelerate to the correct speed
      violatingPhase.toSpeed = Math.min(approachPoint.targetSpeed, violatingPhase.toSpeed);
    } else {
      phaseTable.phases.splice(
        violatingPhaseIndex,
        0,
        new DescendToDistance(approachPoint.distanceFromStart),
        new DescendingDeceleration(approachPoint.targetSpeed),
      );
    }
  }

  private doesPhaseViolateApproachPoint(phase: SubPhase, approachPoint: ApproachCheckpoint) {
    // We're still before the point
    if (phase.lastResult.distanceFromStart <= approachPoint.distanceFromStart) {
      return false;
    }

    if (phase instanceof DescendingDeceleration) {
      return phase.toSpeed > approachPoint.targetSpeed;
    }

    return phase.lastResult.speed > approachPoint.targetSpeed;
  }

  private doesPhaseViolateSpeedChange(phase: SubPhase, speedChange: VerticalCheckpointForDeceleration) {
    if (speedChange.reason === VerticalCheckpointReason.StartDecelerationToLimit) {
      if (phase.lastResult.altitude >= speedChange.altitude) {
        return false;
      }
    } else if (phase.lastResult.distanceFromStart <= speedChange.distanceFromStart) {
      return false;
    }

    if (phase instanceof DescendingDeceleration) {
      return phase.toSpeed > speedChange.targetSpeed;
    }

    return phase.lastResult.speed > speedChange.targetSpeed;
  }

  private doesPhaseViolateSpeedConstraint(
    previousResult: VerticalCheckpoint,
    phase: SubPhase,
    speedConstraint: MaxSpeedConstraint,
  ) {
    // We're still before the constraint
    if (phase.lastResult.distanceFromStart < speedConstraint.distanceFromStart) {
      return false;
    }

    // We had already passed the constraint
    if (previousResult.distanceFromStart > speedConstraint.distanceFromStart) {
      // We only "violate" the constraint if we don't decelerate at all (i.e not on deceleration segment) or to the incorrect speed
      return phase instanceof DescendingDeceleration
        ? phase.toSpeed > speedConstraint.maxSpeed
        : previousResult.speed > speedConstraint.maxSpeed;
    }

    // Now that we're sure, we pass the constraint on this exact segment, check what speed we were at
    const speedChangePerDistance =
      (previousResult.speed - phase.lastResult.speed) /
      (previousResult.distanceFromStart - phase.lastResult.distanceFromStart);
    const speedAtConstraint =
      phase.lastResult.speed +
      speedChangePerDistance * (speedConstraint.distanceFromStart - phase.lastResult.distanceFromStart);

    return speedAtConstraint - speedConstraint.maxSpeed > 1;
  }

  private doesPhaseViolateAltitudeConstraint(
    previousResult: VerticalCheckpoint,
    phase: SubPhase,
    altitudeConstraint: MinimumDescentAltitudeConstraint,
  ) {
    if (
      phase.lastResult.altitude - altitudeConstraint.minimumAltitude >= -1 || // We're still above the constraint
      previousResult.altitude - altitudeConstraint.minimumAltitude < -100 || // We were already more than 100 ft below the constraint before this subphase
      previousResult.distanceFromStart >= altitudeConstraint.distanceFromStart || // We're already behind the constraint
      phase.shouldFlyAsLevelSegment // A level segment already tries its best at not violating the constraint
    ) {
      return false;
    }

    const gradient =
      (previousResult.altitude - phase.lastResult.altitude) /
      (previousResult.distanceFromStart - phase.lastResult.distanceFromStart);
    const altAtConstraint =
      previousResult.altitude + gradient * (altitudeConstraint.distanceFromStart - previousResult.distanceFromStart);

    return altAtConstraint < altitudeConstraint.minimumAltitude;
  }

  private doesPhaseViolateSpeedLimit(previousResult: VerticalCheckpoint, phase: SubPhase, speedLimit: SpeedLimit) {
    // We're still above the limit
    if (phase.lastResult.altitude > speedLimit.underAltitude) {
      return false;
    }

    // We had already passed the constraint
    if (previousResult.altitude < speedLimit.underAltitude) {
      // We only "violate" the constraint if we don't decelerate at all (i.e not on deceleration segment) or to the incorrect speed
      return phase instanceof DescendingDeceleration
        ? phase.toSpeed > speedLimit.speed
        : previousResult.speed > speedLimit.speed;
    }

    // Now that we're sure, we pass the limit on this exact segment, check what speed we were at
    const speedChangePerAltitude =
      (previousResult.speed - phase.lastResult.speed) / (previousResult.altitude - phase.lastResult.altitude);
    const speedAtSpeedLimitAlt =
      phase.lastResult.speed + speedChangePerAltitude * (speedLimit.underAltitude - phase.lastResult.altitude);

    return speedAtSpeedLimitAlt - speedLimit.speed > 1;
  }
}

class PhaseTable {
  start: VerticalCheckpoint;

  phases: SubPhase[] = [];

  private readonly configuration: AircraftConfigurationRegister = new AircraftConfigurationRegister();

  constructor(
    private readonly parameters: VerticalProfileComputationParameters,
    private readonly winds: HeadwindProfile,
  ) {}

  execute(descentStrategy: DescentStrategy, levelFlightStrategy: DescentStrategy): TemporaryCheckpointSequence {
    const sequence = new TemporaryCheckpointSequence(this.start);

    for (const phase of this.phases) {
      if (phase.reasonBefore !== VerticalCheckpointReason.AtmosphericConditions) {
        if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.AtmosphericConditions) {
          sequence.lastCheckpoint.reason = phase.reasonBefore;
        } else {
          sequence.copyLastCheckpoint({ reason: phase.reasonBefore });
        }
      }

      if (phase.shouldExecute(sequence.lastCheckpoint)) {
        const headwind = this.winds.getHeadwindComponent(
          sequence.lastCheckpoint.distanceFromStart,
          sequence.lastCheckpoint.altitude,
        );
        const phaseResult = phase.execute(phase.shouldFlyAsLevelSegment ? levelFlightStrategy : descentStrategy)(
          sequence.lastCheckpoint,
          headwind,
          this.configuration.setFromSpeed(sequence.lastCheckpoint.speed, this.parameters),
        );

        if (phase instanceof DescendingDeceleration) {
          (sequence.lastCheckpoint as VerticalCheckpointForDeceleration).targetSpeed = phase.toSpeed;
        }

        sequence.addCheckpointFromStep(phaseResult, phase.reasonAfter);

        phase.lastResult = sequence.lastCheckpoint;
      } else {
        phase.lastResult = null;
      }
    }

    return sequence;
  }
}

abstract class SubPhase {
  lastResult?: VerticalCheckpoint = null;

  protected isLevelSegment = false;

  reasonAfter: VerticalCheckpointReason = VerticalCheckpointReason.AtmosphericConditions;

  reasonBefore: VerticalCheckpointReason = VerticalCheckpointReason.AtmosphericConditions;

  get shouldFlyAsLevelSegment(): boolean {
    return this.isLevelSegment;
  }

  abstract shouldExecute(start: VerticalCheckpoint): boolean;

  abstract execute(
    strategy: DescentStrategy,
  ): (start: VerticalCheckpoint, headwind: WindComponent, configuration?: AircraftConfiguration) => StepResults;

  protected scaleStepBasedOnLastCheckpoint(lastCheckpoint: VerticalCheckpoint, step: StepResults, scaling: number) {
    step.distanceTraveled *= scaling;
    step.fuelBurned *= scaling;
    step.timeElapsed *= scaling;
    step.finalAltitude = (1 - scaling) * lastCheckpoint.altitude + scaling * step.finalAltitude;
    step.speed = (1 - scaling) * lastCheckpoint.speed + scaling * step.speed;
  }

  withReasonBefore(reason: VerticalCheckpointReason) {
    this.reasonBefore = reason;

    return this;
  }

  withReasonAfter(reason: VerticalCheckpointReason) {
    this.reasonAfter = reason;

    return this;
  }
}

class DescendingDeceleration extends SubPhase {
  maxDistance: NauticalMiles = Infinity;

  minAltitude: Feet = -Infinity;

  constructor(public toSpeed: number) {
    super();
  }

  withMaxDistance(maxDistance: NauticalMiles) {
    this.maxDistance = maxDistance;

    return this;
  }

  withMinAltitude(minAltitude: Feet) {
    this.minAltitude = minAltitude;

    return this;
  }

  asLevelSegment(): DescendingDeceleration {
    this.isLevelSegment = true;

    return this;
  }

  override shouldExecute(start: VerticalCheckpoint) {
    return (
      start.speed > this.toSpeed &&
      start.distanceFromStart < this.maxDistance &&
      (this.shouldFlyAsLevelSegment || start.altitude > this.minAltitude)
    );
  }

  override execute(strategy: DescentStrategy) {
    return (start: VerticalCheckpoint, headwind: WindComponent, configuration: AircraftConfiguration) => {
      const step = strategy.predictToSpeed(
        start.altitude,
        this.toSpeed,
        start.speed,
        start.mach,
        start.remainingFuelOnBoard,
        headwind,
        configuration,
      );

      if (step.finalAltitude < this.minAltitude || start.distanceFromStart + step.distanceTraveled > this.maxDistance) {
        const scaling = Math.max(
          0,
          Math.min(
            (this.maxDistance - start.distanceFromStart) / step.distanceTraveled,
            (start.altitude - this.minAltitude) / (start.altitude - step.finalAltitude),
            1,
          ),
        );
        this.scaleStepBasedOnLastCheckpoint(start, step, scaling);
      }

      return step;
    };
  }
}
class DescendToAltitude extends SubPhase {
  constructor(public toAltitude: number) {
    super();
  }

  override shouldExecute(start: VerticalCheckpoint) {
    return start.altitude > this.toAltitude;
  }

  override execute(strategy: DescentStrategy) {
    return (start: VerticalCheckpoint, headwind: WindComponent) =>
      strategy.predictToAltitude(
        start.altitude,
        this.toAltitude,
        start.speed,
        start.mach,
        start.remainingFuelOnBoard,
        headwind,
      );
  }
}
class DescendToDistance extends SubPhase {
  minAltitude: Feet = -Infinity;

  constructor(public toDistance: number) {
    super();
  }

  asLevelSegment(): DescendToDistance {
    this.isLevelSegment = true;

    return this;
  }

  override shouldExecute(start: VerticalCheckpoint) {
    return start.distanceFromStart < this.toDistance;
  }

  override execute(strategy: DescentStrategy) {
    return (start: VerticalCheckpoint, headwind: WindComponent, configuration: AircraftConfiguration) => {
      const step = strategy.predictToDistance(
        start.altitude,
        this.toDistance - start.distanceFromStart,
        start.speed,
        start.mach,
        start.remainingFuelOnBoard,
        headwind,
        configuration,
      );

      if (step.finalAltitude < this.minAltitude) {
        const scaling = (this.minAltitude - start.altitude) / (step.finalAltitude - start.altitude);
        this.scaleStepBasedOnLastCheckpoint(start, step, scaling);
      }

      return step;
    };
  }
}
