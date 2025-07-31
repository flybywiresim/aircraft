// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { VerticalCheckpoint, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { GeometricPathBuilder } from '@fmgc/guidance/vnav/descent/GeometricPathBuilder';
import { HeadwindProfile } from '@fmgc/guidance/vnav/wind/HeadwindProfile';
import { TemporaryCheckpointSequence } from '@fmgc/guidance/vnav/profile/TemporaryCheckpointSequence';
import { AltitudeConstraint, AltitudeDescriptor, ConstraintUtils, MathUtils } from '@flybywiresim/fbw-sdk';
import { AircraftConfig } from '@fmgc/flightplanning/AircraftConfigTypes';
import { IdlePathBuilder } from '@fmgc/guidance/vnav/descent/IdlePathBuilder';
import { GeometricPathPlanner, PlannedGeometricSegment } from '@fmgc/guidance/vnav/descent/GeometricPathPlanner';

export class DescentPathBuilder {
  private geometricPathBuilder: GeometricPathBuilder;

  private idlePathBuilder: IdlePathBuilder;

  constructor(
    computationParametersObserver: VerticalProfileComputationParametersObserver,
    atmosphericConditions: AtmosphericConditions,
    private readonly acConfig: AircraftConfig,
  ) {
    this.idlePathBuilder = new IdlePathBuilder(computationParametersObserver, atmosphericConditions, this.acConfig);

    this.geometricPathBuilder = new GeometricPathBuilder(
      computationParametersObserver,
      atmosphericConditions,
      this,
      this.acConfig,
    );
  }

  computeManagedDescentPath(
    sequence: TemporaryCheckpointSequence,
    profile: BaseGeometryProfile,
    speedProfile: SpeedProfile,
    windProfile: HeadwindProfile,
    cruiseAltitude: Feet,
    toDistance: NauticalMiles = -Infinity,
  ) {
    const TOL = 10;
    const decelPoint: VerticalCheckpoint = { ...sequence.lastCheckpoint };

    const geometricSequence = new TemporaryCheckpointSequence(decelPoint);
    const idleSequence = new TemporaryCheckpointSequence(decelPoint);

    this.idlePathBuilder.buildIdlePath(
      idleSequence,
      profile.descentSpeedConstraints,
      speedProfile,
      windProfile,
      cruiseAltitude,
      toDistance,
    );

    for (let i = profile.descentAltitudeConstraints.length - 1; i >= 0; i -= 1) {
      const constraintPoint = profile.descentAltitudeConstraints[i];

      if (
        constraintPoint.distanceFromStart >= decelPoint.distanceFromStart ||
        constraintPoint.distanceFromStart <= toDistance
      ) {
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
          leg: constraintPoint.leg,
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
          profile,
          speedProfile,
          windProfile,
        );

        idleSequence.reset(geometricSequence.lastCheckpoint);
        this.idlePathBuilder.buildIdlePath(
          idleSequence,
          profile.descentSpeedConstraints,
          speedProfile,
          windProfile,
          cruiseAltitude,
          toDistance,
        );
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

  private isConstraintBelowCruisingAltitude(constraint: AltitudeConstraint, finalCruiseAltitude: Feet): boolean {
    return ConstraintUtils.minimumAltitude(constraint) <= finalCruiseAltitude;
  }
}

export function evaluateAltitudeConstraint(
  constraint: AltitudeConstraint,
  altitude: Feet,
  tol: number,
): [boolean, Feet] {
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
