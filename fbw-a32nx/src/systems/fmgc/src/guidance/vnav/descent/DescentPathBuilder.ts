// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import {
  DescentAltitudeConstraint,
  MaxSpeedConstraint,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { GeometricPathBuilder } from '@fmgc/guidance/vnav/descent/GeometricPathBuilder';
import { DescentStrategy, IdleDescentStrategy } from '@fmgc/guidance/vnav/descent/DescentStrategy';
import { StepResults } from '@fmgc/guidance/vnav/Predictions';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { AltitudeDescriptor, MathUtils } from '@flybywiresim/fbw-sdk';
import { SpeedLimit } from '@fmgc/guidance/vnav/SpeedLimit';
import { ConstraintUtils, AltitudeConstraint } from '@fmgc/flightplanning/data/constraint';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';

export class DescentPathBuilder {
  private geometricPathBuilder: GeometricPathBuilder;

  private idleDescentStrategy: DescentStrategy;

  constructor(
    private computationParametersObserver: VerticalProfileComputationParametersObserver,
    private atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {
    this.geometricPathBuilder = new GeometricPathBuilder(
      computationParametersObserver,
      atmosphericConditions,
      this.acConfig,
    );

    this.idleDescentStrategy = new IdleDescentStrategy(
      computationParametersObserver,
      atmosphericConditions,
      this.acConfig,
    );
  }

  computeManagedDescentPath(
    sequence: TemporaryCheckpointSequence,
    profile: BaseGeometryProfile,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    cruiseAltitude: Feet,
  ) {
    const TOL = 10;
    const decelPoint: VerticalCheckpoint = { ...sequence.lastCheckpoint };

    const geometricSequence = new TemporaryCheckpointSequence(decelPoint);
    const idleSequence = new TemporaryCheckpointSequence(decelPoint);

    this.buildIdlePath(idleSequence, profile, speedProfile, windProfile, cruiseAltitude);

    for (let i = profile.descentAltitudeConstraints.length - 1; i >= 0; i -= 1) {
      const constraintPoint = profile.descentAltitudeConstraints[i];

      if (constraintPoint.distanceFromStart >= decelPoint.distanceFromStart) {
        // If we've found a constraint that's beyond the decel point, we can ignore it.
        continue;
      } else if (!this.isConstraintBelowCruisingAltitude(constraintPoint.constraint, cruiseAltitude)) {
        // Constraints above the cruise altitude are ignored
        break;
      }

      const altAtConstraint = idleSequence.interpolateAltitudeBackwards(constraintPoint.distanceFromStart);
      const [isAltitudeConstraintMet, altitudeToContinueFrom] = evaluateAltitudeConstraint(
        constraintPoint.constraint,
        altAtConstraint,
        TOL,
      );
      if (!isAltitudeConstraintMet) {
        const geometricPathPoint = {
          distanceFromStart: constraintPoint.distanceFromStart,
          altitude: altitudeToContinueFrom,
        };

        // Plan geometric path between decel point and geometric path point (point between geometric and idle path)
        const geometricSegments: PlannedGeometricSegment[] = [];
        GeometricPathPlanner.planDescentSegments(
          profile.descentAltitudeConstraints,
          decelPoint,
          geometricPathPoint,
          geometricSegments,
          TOL,
        );

        // Execute
        geometricSequence.reset(geometricSequence.at(0));
        this.geometricPathBuilder.executeGeometricSegments(
          geometricSequence,
          geometricSegments,
          profile.descentSpeedConstraints.slice(),
          windProfile,
        );

        idleSequence.reset(geometricSequence.lastCheckpoint);
        this.buildIdlePath(idleSequence, profile, speedProfile, windProfile, cruiseAltitude);
      }
    }

    if (geometricSequence.length > 1) {
      geometricSequence.lastCheckpoint.reason = VerticalCheckpointReason.GeometricPathStart;
    } else {
      geometricSequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.GeometricPathStart });
    }

    sequence.push(...geometricSequence.get());
    sequence.push(...idleSequence.get());
  }

  private buildIdlePath(
    sequence: TemporaryCheckpointSequence,
    profile: BaseGeometryProfile,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    topOfDescentAltitude: Feet,
  ): void {
    // Assume the last checkpoint is the start of the geometric path
    sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.IdlePathEnd });

    const { managedDescentSpeedMach, descentSpeedLimit } = this.computationParametersObserver.get();
    const speedConstraintsAhead = this.speedConstraintGenerator(profile.descentSpeedConstraints, sequence);

    // We try to figure out what speed we might be decelerating for
    let previousCasTarget =
      this.tryGetAnticipatedTarget(
        sequence,
        profile.descentSpeedConstraints,
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

    for (let i = 0; i < 100 && topOfDescentAltitude - sequence.lastCheckpoint.altitude > 1; i++) {
      const { distanceFromStart, altitude, speed, remainingFuelOnBoard } = sequence.lastCheckpoint;
      const headwind = windProfile.getHeadwindComponent(distanceFromStart, altitude);
      const isUnderSpeedLimitAltitude =
        speedProfile.shouldTakeDescentSpeedLimitIntoAccount() && altitude < descentSpeedLimit.underAltitude;

      const casTarget = speedProfile.getTarget(distanceFromStart - 1e-4, altitude + 1e-4, ManagedSpeedType.Descent);
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
        const scaling = Math.min(1, (topOfDescentAltitude - altitude) / (speedStep.finalAltitude - altitude));
        this.scaleStepBasedOnLastCheckpoint(sequence.lastCheckpoint, speedStep, scaling);

        const didCrossoverSpeedLimitAltitude = wasPreviouslyUnderSpeedLimitAltitude && !isUnderSpeedLimitAltitude;
        const checkpointReason = didCrossoverSpeedLimitAltitude
          ? VerticalCheckpointReason.StartDecelerationToLimit
          : VerticalCheckpointReason.StartDecelerationToConstraint;

        sequence.addDecelerationCheckpointFromStep(speedStep, checkpointReason, previousCasTarget);
      } else {
        // Try alt path
        let finalAltitude = Math.min(altitude + 1500, topOfDescentAltitude);
        let reason = VerticalCheckpointReason.IdlePathAtmosphericConditions;
        if (isUnderSpeedLimitAltitude && finalAltitude >= descentSpeedLimit.underAltitude) {
          finalAltitude = descentSpeedLimit.underAltitude;
          reason = VerticalCheckpointReason.CrossingDescentSpeedLimit;
        }

        const altitudeStep = this.idleDescentStrategy.predictToAltitude(
          altitude,
          finalAltitude,
          speed,
          managedDescentSpeedMach,
          remainingFuelOnBoard,
          headwind,
        );
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
          sequence.addCheckpointFromStep(distanceStep, VerticalCheckpointReason.SpeedConstraint);
        } else {
          sequence.addCheckpointFromStep(altitudeStep, reason);
        }
      }

      previousCasTarget = casTarget;
      wasPreviouslyUnderSpeedLimitAltitude = isUnderSpeedLimitAltitude;
    }

    if (sequence.lastCheckpoint.reason === VerticalCheckpointReason.IdlePathAtmosphericConditions) {
      sequence.lastCheckpoint.reason = VerticalCheckpointReason.TopOfDescent;
    } else {
      sequence.copyLastCheckpoint({ reason: VerticalCheckpointReason.TopOfDescent });
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

  isConstraintBelowCruisingAltitude(constraint: AltitudeConstraint, finalCruiseAltitude: Feet): boolean {
    return ConstraintUtils.minimumAltitude(constraint) <= finalCruiseAltitude;
  }

  private *speedConstraintGenerator(
    constraints: MaxSpeedConstraint[],
    sequence: TemporaryCheckpointSequence,
  ): Generator<MaxSpeedConstraint> {
    for (let i = constraints.length - 1; i >= 0; ) {
      // Small tolerance here, so we don't get stuck on a constraint
      if (constraints[i].distanceFromStart - sequence.lastCheckpoint.distanceFromStart > -1e-4) {
        i--;
        continue;
      }

      yield constraints[i];
    }
  }
}

export class GeometricPathPlanner {
  static planDescentSegments(
    constraints: DescentAltitudeConstraint[],
    start: GeometricPathPoint,
    end: GeometricPathPoint,
    segments: PlannedGeometricSegment[] = [],
    tolerance: number,
  ): PlannedGeometricSegment[] {
    // A "gradient" is just a quantity of units Feet / NauticalMiles
    const gradient = calculateGradient(start, end);

    for (let i = 0; i < constraints.length; i++) {
      const constraintPoint = constraints[i];

      if (
        constraintPoint.distanceFromStart >= start.distanceFromStart ||
        constraintPoint.distanceFromStart <= end.distanceFromStart
      ) {
        continue;
      }

      const altAtConstraint = start.altitude + gradient * (constraintPoint.distanceFromStart - start.distanceFromStart);

      const [isAltitudeConstraintMet, altitudeToContinueFrom] = evaluateAltitudeConstraint(
        constraintPoint.constraint,
        altAtConstraint,
        tolerance,
      );
      if (!isAltitudeConstraintMet) {
        const center = { distanceFromStart: constraintPoint.distanceFromStart, altitude: altitudeToContinueFrom };

        this.planDescentSegments(constraints, start, center, segments, tolerance);
        this.planDescentSegments(constraints, center, end, segments, tolerance);

        return;
      }
    }

    segments.push({ end, gradient });
  }
}

function evaluateAltitudeConstraint(constraint: AltitudeConstraint, altitude: Feet, tol: number): [boolean, Feet] {
  // Even though in the MCDU constraints count as met if within 250 ft, we use 10 ft here for the initial path construction.
  switch (constraint.altitudeDescriptor) {
    case AltitudeDescriptor.AtAlt1:
    case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
    case AltitudeDescriptor.AtAlt1AngleAlt2:
      return [
        isAltitudeConstraintMet(constraint, altitude, tol),
        MathUtils.clamp(altitude, constraint.altitude1, constraint.altitude1),
      ];
    case AltitudeDescriptor.AtOrAboveAlt1:
    case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
    case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
      return [isAltitudeConstraintMet(constraint, altitude, tol), Math.max(altitude, constraint.altitude1)];
    case AltitudeDescriptor.AtOrBelowAlt1:
    case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
      return [isAltitudeConstraintMet(constraint, altitude, tol), Math.min(altitude, constraint.altitude1)];
    case AltitudeDescriptor.BetweenAlt1Alt2:
      return [
        isAltitudeConstraintMet(constraint, altitude, tol),
        MathUtils.clamp(altitude, constraint.altitude2, constraint.altitude1),
      ];
    case AltitudeDescriptor.AtOrAboveAlt2:
      return [isAltitudeConstraintMet(constraint, altitude, tol), Math.max(altitude, constraint.altitude2)];
    default:
      return [true, altitude];
  }
}

export const isAltitudeConstraintMet = (constraint: AltitudeConstraint, altitude: Feet, tol: Feet = 250) => {
  switch (constraint.altitudeDescriptor) {
    case AltitudeDescriptor.AtAlt1:
    case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
    case AltitudeDescriptor.AtAlt1AngleAlt2:
      return Math.abs(altitude - constraint.altitude1) < tol;
    case AltitudeDescriptor.AtOrAboveAlt1:
    case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
    case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
      return altitude - constraint.altitude1 > -tol;
    case AltitudeDescriptor.AtOrBelowAlt1:
    case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
      return altitude - constraint.altitude1 < tol;
    case AltitudeDescriptor.BetweenAlt1Alt2:
      return altitude - constraint.altitude2 > -tol && altitude - constraint.altitude1 < tol;
    case AltitudeDescriptor.AtOrAboveAlt2:
      return altitude - constraint.altitude2 > -tol;
    default:
      return true;
  }
};

export type GeometricPathPoint = {
  distanceFromStart: NauticalMiles;
  altitude: Feet;
};

export type PlannedGeometricSegment = {
  gradient: number;
  end: GeometricPathPoint;
  isTooSteep?: boolean;
};

export function calculateGradient(start: GeometricPathPoint, end: GeometricPathPoint): number {
  return Math.abs(start.distanceFromStart - end.distanceFromStart) < 1e-9
    ? 0
    : (start.altitude - end.altitude) / (start.distanceFromStart - end.distanceFromStart);
}
