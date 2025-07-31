// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { BaseGeometryProfile } from '@fmgc/guidance/vnav/profile/BaseGeometryProfile';
import { ConstraintReader } from '@fmgc/guidance/vnav/ConstraintReader';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { isAltitudeConstraintMet } from '@fmgc/guidance/vnav/descent/DescentPathBuilder';
import { FlightPlanService } from '@fmgc/flightplanning/FlightPlanService';
import { AltitudeConstraint, AltitudeDescriptor, SpeedConstraint } from '@flybywiresim/fbw-sdk';
import { FlightPlanLeg } from '@fmgc/flightplanning/legs/FlightPlanLeg';

// TODO: Merge this with VerticalCheckpoint
export interface VerticalWaypointPrediction {
  waypointIndex: number;
  distanceFromStart: NauticalMiles;
  secondsFromPresent: Seconds;
  altitude: Feet;
  speed: Knots | Mach;
  altitudeConstraint: AltitudeConstraint;
  speedConstraint: SpeedConstraint;
  isAltitudeConstraintMet: boolean;
  isSpeedConstraintMet: boolean;
  altError: number;
  distanceToTopOfDescent: NauticalMiles | null;
  estimatedFuelOnBoard: Pounds;
  distanceFromAircraft: NauticalMiles;
}

export enum VerticalCheckpointReason {
  Liftoff = 'Liftoff',
  ThrustReductionAltitude = 'ThrustReductionAltitude',
  AccelerationAltitude = 'AccelerationAltitude',
  TopOfClimb = 'TopOfClimb',
  AtmosphericConditions = 'AtmosphericConditions',
  PresentPosition = 'PresentPosition',
  LevelOffForClimbConstraint = 'LevelOffForClimbConstraint',
  AltitudeConstraint = 'AltitudeConstraint',
  ContinueClimb = 'ContinueClimb',
  CrossingClimbSpeedLimit = 'CrossingClimbSpeedLimit',
  SpeedConstraint = 'SpeedConstraint',
  CrossingFcuAltitudeClimb = 'FcuAltitudeClimb',

  // Cruise
  StepClimb = 'StepClimb',
  TopOfStepClimb = 'TopOfStepClimb',
  StepDescent = 'StepDescent',
  BottomOfStepDescent = 'BottomOfStepDescent', // I don't think this actually exists?

  // Descent
  CrossingFcuAltitudeDescent = 'FcuAltitudeDescent',
  InterceptDescentProfileManaged = 'InterceptDescentProfileManaged',
  InterceptDescentProfileSelected = 'InterceptDescentProfileSelected',
  LevelOffForDescentConstraint = 'LevelOffForDescentConstraint',
  ContinueDescent = 'ContinueDescent',
  ContinueDescentArmed = 'ContinueDescentArmed',
  TopOfDescent = 'TopOfDescent',
  CrossingDescentSpeedLimit = 'CrossingDescentSpeedLimit',
  IdlePathAtmosphericConditions = 'IdlePathAtmosphericConditions',
  IdlePathEnd = 'IdlePathEnd',
  GeometricPathStart = 'GeometricPathStart',
  GeometricPathConstraint = 'GeometricPathConstraint',
  GeometricPathTooSteep = 'GeometricPathTooSteep',
  GeometricPathEnd = 'GeometricPathEnd',
  StartDecelerationToConstraint = 'StartDecelerationToConstraint',
  StartDecelerationToLimit = 'StartDecelerationToLimit',

  // Approach
  Decel = 'Decel',
  Flaps1 = 'Flaps1',
  Flaps2 = 'Flaps2',
  Flaps3 = 'Flaps3',
  FlapsFull = 'FlapsFull',
  Landing = 'Landing',
}

export interface VerticalCheckpoint {
  reason: VerticalCheckpointReason;
  distanceFromStart: NauticalMiles;
  secondsFromPresent: Seconds;
  altitude: Feet;
  remainingFuelOnBoard: number;
  speed: Knots;
  mach: Mach;
}

export interface VerticalCheckpointForDeceleration extends VerticalCheckpoint {
  targetSpeed: Knots;
}

export interface ApproachCheckpoint extends VerticalCheckpointForDeceleration {
  reason:
    | VerticalCheckpointReason.Decel
    | VerticalCheckpointReason.Flaps1
    | VerticalCheckpointReason.Flaps2
    | VerticalCheckpointReason.Flaps3
    | VerticalCheckpointReason.FlapsFull;
}

// I'm sure there's a better way to handle the distinction between `VerticalCheckpoint` and `VerticalCheckpointForDeceleration`
export function isSpeedChangePoint(checkpoint: VerticalCheckpoint): checkpoint is VerticalCheckpointForDeceleration {
  return (
    checkpoint.reason === VerticalCheckpointReason.StartDecelerationToConstraint ||
    checkpoint.reason === VerticalCheckpointReason.StartDecelerationToLimit
  );
}

export function isApproachCheckpoint(checkpoint: VerticalCheckpoint): checkpoint is ApproachCheckpoint {
  return (
    checkpoint.reason === VerticalCheckpointReason.Decel ||
    checkpoint.reason === VerticalCheckpointReason.Flaps1 ||
    checkpoint.reason === VerticalCheckpointReason.Flaps2 ||
    checkpoint.reason === VerticalCheckpointReason.Flaps3 ||
    checkpoint.reason === VerticalCheckpointReason.FlapsFull
  );
}

export interface MaxAltitudeConstraint {
  distanceFromStart: NauticalMiles;
  maxAltitude: Feet;
}

export interface MaxSpeedConstraint {
  distanceFromStart: NauticalMiles;
  maxSpeed: Feet;
}

export interface DescentAltitudeConstraint {
  distanceFromStart: NauticalMiles;
  constraint: AltitudeConstraint;
  leg: FlightPlanLeg;
}

export interface GeographicCruiseStep {
  distanceFromStart: NauticalMiles;
  toAltitude: Feet;
  waypointIndex: number;
  isIgnored: boolean;
}

export class NavGeometryProfile extends BaseGeometryProfile {
  public waypointPredictions: Map<number, VerticalWaypointPrediction> = new Map();

  constructor(
    private flightPlanService: FlightPlanService,
    private constraintReader: ConstraintReader,
    private atmosphericConditions: AtmosphericConditions,
  ) {
    super();
  }

  override get maxAltitudeConstraints(): MaxAltitudeConstraint[] {
    return this.constraintReader.climbAlitudeConstraints;
  }

  override get descentAltitudeConstraints(): DescentAltitudeConstraint[] {
    return this.constraintReader.descentAltitudeConstraints;
  }

  override get maxClimbSpeedConstraints(): MaxSpeedConstraint[] {
    return this.constraintReader.climbSpeedConstraints;
  }

  override get descentSpeedConstraints(): MaxSpeedConstraint[] {
    return this.constraintReader.descentSpeedConstraints;
  }

  override get distanceToPresentPosition(): number {
    return this.constraintReader.distanceToPresentPosition;
  }

  override get cruiseSteps(): GeographicCruiseStep[] {
    return this.constraintReader.cruiseSteps;
  }

  get totalFlightPlanDistance(): number {
    return this.constraintReader.totalFlightPlanDistance;
  }

  get lastCheckpoint(): VerticalCheckpoint | null {
    if (this.checkpoints.length < 1) {
      return null;
    }

    return this.checkpoints[this.checkpoints.length - 1];
  }

  get finalDescentAngle(): Degrees {
    return this.constraintReader.finalDescentAngle;
  }

  get fafDistanceToEnd(): NauticalMiles {
    return this.constraintReader.fafDistanceToEnd;
  }

  get finalAltitude(): Feet {
    return this.constraintReader.finalAltitude;
  }

  addCheckpointFromLast(checkpointBuilder: (lastCheckpoint: VerticalCheckpoint) => Partial<VerticalCheckpoint>) {
    this.checkpoints.push({ ...this.lastCheckpoint, ...checkpointBuilder(this.lastCheckpoint) });
  }

  /**
   * This is used to display predictions in the MCDU
   */
  private computePredictionsAtWaypoints(): Map<number, VerticalWaypointPrediction> {
    const predictions = new Map<number, VerticalWaypointPrediction>();

    if (!this.isReadyToDisplay) {
      return predictions;
    }

    const topOfDescent = this.findVerticalCheckpoint(VerticalCheckpointReason.TopOfDescent);
    const distanceToPresentPosition = this.distanceToPresentPosition;

    const activePlan = this.flightPlanService.active;

    for (let i = activePlan.activeLegIndex - 1; i < activePlan.firstMissedApproachLegIndex; i++) {
      const leg = activePlan.maybeElementAt(i);

      if (!leg || leg.isDiscontinuity === true) {
        continue;
      }

      const distanceFromStart = leg.calculated?.cumulativeDistanceWithTransitions;
      const { secondsFromPresent, altitude, speed, mach, remainingFuelOnBoard } =
        this.interpolateEverythingFromStart(distanceFromStart);

      const altitudeConstraint = leg.altitudeConstraint;
      const speedConstraint = leg.speedConstraint;

      predictions.set(i, {
        waypointIndex: i,
        distanceFromStart,
        secondsFromPresent,
        altitude,
        speed: this.atmosphericConditions.casOrMach(speed, mach, altitude),
        altitudeConstraint,
        isAltitudeConstraintMet: altitudeConstraint && isAltitudeConstraintMet(altitudeConstraint, altitude, 250),
        speedConstraint,
        isSpeedConstraintMet: this.isSpeedConstraintMet(speed, speedConstraint),
        altError: this.computeAltError(altitude, altitudeConstraint),
        distanceToTopOfDescent: topOfDescent ? topOfDescent.distanceFromStart - distanceFromStart : null,
        estimatedFuelOnBoard: remainingFuelOnBoard,
        distanceFromAircraft: distanceFromStart - distanceToPresentPosition,
      });
    }

    return predictions;
  }

  private isSpeedConstraintMet(speed: Knots, constraint?: SpeedConstraint): boolean {
    if (!constraint) {
      return true;
    }

    return speed - constraint.speed < 5;
  }

  private computeAltError(predictedAltitude: Feet, constraint?: AltitudeConstraint): number {
    if (!constraint) {
      return 0;
    }

    switch (constraint.altitudeDescriptor) {
      case AltitudeDescriptor.AtAlt1:
      case AltitudeDescriptor.AtAlt1GsIntcptAlt2:
      case AltitudeDescriptor.AtAlt1AngleAlt2:
        return predictedAltitude - constraint.altitude1;
      case AltitudeDescriptor.AtOrAboveAlt1:
      case AltitudeDescriptor.AtOrAboveAlt1GsIntcptAlt2:
      case AltitudeDescriptor.AtOrAboveAlt1AngleAlt2:
        return Math.min(predictedAltitude - constraint.altitude1, 0);
      case AltitudeDescriptor.AtOrBelowAlt1:
      case AltitudeDescriptor.AtOrBelowAlt1AngleAlt2:
        return Math.max(predictedAltitude - constraint.altitude1, 0);
      case AltitudeDescriptor.BetweenAlt1Alt2:
        if (predictedAltitude >= constraint.altitude1) {
          return predictedAltitude - constraint.altitude1;
        }
        if (predictedAltitude <= constraint.altitude2) {
          return predictedAltitude - constraint.altitude1;
        }

        return 0;
      case AltitudeDescriptor.AtOrAboveAlt2:
        return Math.min(predictedAltitude - constraint.altitude2, 0);
      default:
        return 0;
    }
  }

  override finalizeProfile(): void {
    super.finalizeProfile();

    this.waypointPredictions = this.computePredictionsAtWaypoints();
  }

  invalidate(): void {
    this.isReadyToDisplay = false;
    this.waypointPredictions = new Map();
  }

  getDistanceFromStart(distanceFromEnd: NauticalMiles): NauticalMiles {
    return this.constraintReader.totalFlightPlanDistance - distanceFromEnd;
  }

  override resetAltitudeConstraints() {
    this.constraintReader.climbAlitudeConstraints = [];
    this.constraintReader.descentAltitudeConstraints = [];
  }

  override resetSpeedConstraints() {
    this.constraintReader.climbSpeedConstraints = [];
    this.constraintReader.descentSpeedConstraints = [];
  }

  ignoreCruiseStep(waypointIndex: number) {
    this.constraintReader.ignoreCruiseStep(waypointIndex);
  }
}
