// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Common } from '@fmgc/guidance/vnav/common';
import { PseudoWaypointFlightPlanInfo } from '@fmgc/guidance/PseudoWaypoint';
import {
  GeographicCruiseStep,
  DescentAltitudeConstraint,
  MaxAltitudeConstraint,
  MaxSpeedConstraint,
  VerticalCheckpoint,
  VerticalCheckpointReason,
} from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { VnavConfig } from '@fmgc/guidance/vnav/VnavConfig';

export interface PerfToAltPrediction {
  altitude: Feet;
  distanceFromStart: NauticalMiles;
  secondsFromPresent: Seconds;
}

export interface PerfCrzToPrediction {
  reason: VerticalCheckpointReason;
  distanceFromPresentPosition: NauticalMiles;
  secondsFromPresent: Seconds;
}

export abstract class BaseGeometryProfile {
  public isReadyToDisplay: boolean = false;

  public checkpoints: VerticalCheckpoint[] = [];

  abstract get maxAltitudeConstraints(): MaxAltitudeConstraint[];

  abstract get descentAltitudeConstraints(): DescentAltitudeConstraint[];

  abstract get maxClimbSpeedConstraints(): MaxSpeedConstraint[];

  abstract get descentSpeedConstraints(): MaxSpeedConstraint[];

  abstract get cruiseSteps(): GeographicCruiseStep[];

  abstract get distanceToPresentPosition(): NauticalMiles;

  get lastCheckpoint(): VerticalCheckpoint | null {
    if (this.checkpoints.length < 1) {
      return null;
    }

    return this.checkpoints[this.checkpoints.length - 1];
  }

  addCheckpointFromLast(checkpointBuilder: (lastCheckpoint: VerticalCheckpoint) => Partial<VerticalCheckpoint>) {
    this.checkpoints.push({ ...this.lastCheckpoint, ...checkpointBuilder(this.lastCheckpoint) });
  }

  predictAtTime(secondsFromPresent: Seconds): PseudoWaypointFlightPlanInfo {
    const distanceFromStart = this.interpolateDistanceAtTime(secondsFromPresent);
    const { altitude, speed } = this.interpolateEverythingFromStart(distanceFromStart);

    return {
      distanceFromStart,
      altitude,
      speed,
      secondsFromPresent,
    };
  }

  private interpolateFromCheckpoints<T extends number, U extends number>(
    indexValue: T,
    keySelector: (checkpoint: VerticalCheckpoint) => T,
    valueSelector: (checkpoint: VerticalCheckpoint) => U,
  ) {
    if (indexValue <= keySelector(this.checkpoints[0])) {
      return valueSelector(this.checkpoints[0]);
    }

    for (let i = 0; i < this.checkpoints.length - 1; i++) {
      if (indexValue > keySelector(this.checkpoints[i]) && indexValue <= keySelector(this.checkpoints[i + 1])) {
        return Common.interpolate(
          indexValue,
          keySelector(this.checkpoints[i]),
          keySelector(this.checkpoints[i + 1]),
          valueSelector(this.checkpoints[i]),
          valueSelector(this.checkpoints[i + 1]),
        );
      }
    }

    return valueSelector(this.checkpoints[this.checkpoints.length - 1]);
  }

  private interpolateFromCheckpointsBackwards<T extends number, U extends number>(
    indexValue: T,
    keySelector: (checkpoint: VerticalCheckpoint) => T,
    valueSelector: (checkpoint: VerticalCheckpoint) => U,
    snapReverse: boolean = false,
  ) {
    if (indexValue < keySelector(this.checkpoints[this.checkpoints.length - 1])) {
      return valueSelector(this.checkpoints[this.checkpoints.length - 1]);
    }

    for (let i = this.checkpoints.length - 2; i >= 0; i--) {
      if (
        (!snapReverse &&
          indexValue <= keySelector(this.checkpoints[i]) &&
          indexValue > keySelector(this.checkpoints[i + 1])) ||
        (snapReverse &&
          indexValue < keySelector(this.checkpoints[i]) &&
          indexValue >= keySelector(this.checkpoints[i + 1]))
      ) {
        return Common.interpolate(
          indexValue,
          keySelector(this.checkpoints[i]),
          keySelector(this.checkpoints[i + 1]),
          valueSelector(this.checkpoints[i]),
          valueSelector(this.checkpoints[i + 1]),
        );
      }
    }

    return valueSelector(this.checkpoints[0]);
  }

  /**
   * Find the time from start at which the profile predicts us to be at a distance along the flightplan.
   * @param distanceFromStart Distance along that path
   * @returns Predicted altitude
   */
  interpolateTimeAtDistance(distanceFromStart: NauticalMiles): Seconds {
    return this.interpolateFromCheckpoints(
      distanceFromStart,
      (checkpoint) => checkpoint.distanceFromStart,
      (checkpoint) => checkpoint.secondsFromPresent,
    );
  }

  /**
   * Find the altitude at which the profile predicts us to be at a distance along the flightplan.
   * @param distanceFromStart Distance along that path
   * @returns Predicted altitude
   */
  interpolateAltitudeAtDistance(distanceFromStart: NauticalMiles): Feet {
    return this.interpolateFromCheckpoints(
      distanceFromStart,
      (checkpoint) => checkpoint.distanceFromStart,
      (checkpoint) => checkpoint.altitude,
    );
  }

  /**
   * Find the speed at which the profile predicts us to be at a distance along the flightplan.
   * @param distanceFromStart Distance along that path
   * @returns Predicted speed
   */
  interpolateSpeedAtDistance(distanceFromStart: NauticalMiles): Feet {
    return this.interpolateFromCheckpoints(
      distanceFromStart,
      (checkpoint) => checkpoint.distanceFromStart,
      (checkpoint) => checkpoint.speed,
    );
  }

  /**
   * Find the distanceFromStart at which the profile predicts us to be at a time since departure
   * @param secondsFromPresent Time since departure
   * @returns Predicted distance
   */
  interpolateDistanceAtTime(secondsFromPresent: Seconds): NauticalMiles {
    return this.interpolateFromCheckpoints(
      secondsFromPresent,
      (checkpoint) => checkpoint.secondsFromPresent,
      (checkpoint) => checkpoint.distanceFromStart,
    );
  }

  interpolateEverythingFromStart(
    distanceFromStart: NauticalMiles,
    doInterpolateAltitude = true,
  ): Omit<VerticalCheckpoint, 'reason'> {
    if (distanceFromStart <= this.checkpoints[0].distanceFromStart) {
      return {
        distanceFromStart,
        secondsFromPresent: this.checkpoints[0].secondsFromPresent,
        altitude: this.checkpoints[0].altitude,
        remainingFuelOnBoard: this.checkpoints[0].remainingFuelOnBoard,
        speed: this.checkpoints[0].speed,
        mach: this.checkpoints[0].mach,
      };
    }

    for (let i = 0; i < this.checkpoints.length - 1; i++) {
      if (
        distanceFromStart > this.checkpoints[i].distanceFromStart &&
        distanceFromStart <= this.checkpoints[i + 1].distanceFromStart
      ) {
        return {
          distanceFromStart,
          secondsFromPresent: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].secondsFromPresent,
            this.checkpoints[i + 1].secondsFromPresent,
          ),
          altitude: doInterpolateAltitude
            ? Common.interpolate(
                distanceFromStart,
                this.checkpoints[i].distanceFromStart,
                this.checkpoints[i + 1].distanceFromStart,
                this.checkpoints[i].altitude,
                this.checkpoints[i + 1].altitude,
              )
            : this.checkpoints[i].altitude,
          remainingFuelOnBoard: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].remainingFuelOnBoard,
            this.checkpoints[i + 1].remainingFuelOnBoard,
          ),
          speed: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].speed,
            this.checkpoints[i + 1].speed,
          ),
          mach: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].mach,
            this.checkpoints[i + 1].mach,
          ),
        };
      }
    }

    return {
      distanceFromStart,
      secondsFromPresent: this.lastCheckpoint.secondsFromPresent,
      altitude: this.lastCheckpoint.altitude,
      remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard,
      speed: this.lastCheckpoint.speed,
      mach: this.lastCheckpoint.mach,
    };
  }

  interpolateDistanceAtAltitude(altitude: Feet): NauticalMiles {
    return this.interpolateFromCheckpoints(
      altitude,
      (checkpoint) => checkpoint.altitude,
      (checkpoint) => checkpoint.distanceFromStart,
    );
  }

  /**
   *
   * @param altitude Altitude to interpolate from
   * @param snapReverse True if we are looking for the first distance at which the altitude is reached or the last. (Think of a level segment)
   * @returns
   */
  interpolateDistanceAtAltitudeBackwards(altitude: Feet, snapReverse: boolean = false): NauticalMiles {
    return this.interpolateFromCheckpointsBackwards(
      altitude,
      (checkpoint) => Math.round(checkpoint.altitude),
      (checkpoint) => checkpoint.distanceFromStart,
      snapReverse,
    );
  }

  interpolateFuelAtDistance(distance: NauticalMiles): NauticalMiles {
    return this.interpolateFromCheckpoints(
      distance,
      (checkpoint) => checkpoint.distanceFromStart,
      (checkpoint) => checkpoint.remainingFuelOnBoard,
    );
  }

  interpolatePathAngleAtDistance(distanceFromStart: NauticalMiles): Degrees {
    if (distanceFromStart < this.checkpoints[0].distanceFromStart) {
      return 0;
    }

    for (let i = 0; i < this.checkpoints.length - 1; i++) {
      if (
        distanceFromStart > this.checkpoints[i].distanceFromStart &&
        distanceFromStart <= this.checkpoints[i + 1].distanceFromStart
      ) {
        return (
          MathUtils.RADIANS_TO_DEGREES *
          Math.atan(
            (this.checkpoints[i + 1].altitude - this.checkpoints[i].altitude) /
              (this.checkpoints[i + 1].distanceFromStart - this.checkpoints[i].distanceFromStart) /
              6076.12,
          )
        );
      }
    }

    return 0;
  }

  /**
   * Find first checkpoint with a reason
   * @param reasons The reasons to look for
   * @returns The first checkpoint with a reason
   */
  findVerticalCheckpoint(...reasons: VerticalCheckpointReason[]): VerticalCheckpoint | undefined {
    return this.checkpoints.find((checkpoint) => reasons.includes(checkpoint.reason));
  }

  findLastVerticalCheckpoint(...reasons: VerticalCheckpointReason[]): VerticalCheckpoint | undefined {
    return [...this.checkpoints].reverse().find((checkpoint) => reasons.includes(checkpoint.reason));
  }

  findLastVerticalCheckpointIndex(...reasons: VerticalCheckpointReason[]): number {
    return findLastIndex(this.checkpoints, ({ reason }) => reasons.includes(reason));
  }

  purgeVerticalCheckpoints(reason: VerticalCheckpointReason): void {
    this.checkpoints = this.checkpoints.filter((checkpoint) => checkpoint.reason !== reason);
  }

  addInterpolatedCheckpoint(
    distanceFromStart: NauticalMiles,
    additionalProperties: HasAtLeast<VerticalCheckpoint, 'reason'>,
  ): VerticalCheckpoint {
    if (distanceFromStart <= this.checkpoints[0].distanceFromStart) {
      this.checkpoints.unshift({
        distanceFromStart,
        secondsFromPresent: this.checkpoints[0].secondsFromPresent,
        altitude: this.checkpoints[0].altitude,
        remainingFuelOnBoard: this.checkpoints[0].remainingFuelOnBoard,
        speed: this.checkpoints[0].speed,
        mach: this.checkpoints[0].mach,
        ...additionalProperties,
      });

      return this.checkpoints[0];
    }

    for (let i = 0; i < this.checkpoints.length - 1; i++) {
      if (
        distanceFromStart > this.checkpoints[i].distanceFromStart &&
        distanceFromStart <= this.checkpoints[i + 1].distanceFromStart
      ) {
        this.checkpoints.splice(i + 1, 0, {
          distanceFromStart,
          secondsFromPresent: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].secondsFromPresent,
            this.checkpoints[i + 1].secondsFromPresent,
          ),
          altitude: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].altitude,
            this.checkpoints[i + 1].altitude,
          ),
          remainingFuelOnBoard: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].remainingFuelOnBoard,
            this.checkpoints[i + 1].remainingFuelOnBoard,
          ),
          speed: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].speed,
            this.checkpoints[i + 1].speed,
          ),
          mach: Common.interpolate(
            distanceFromStart,
            this.checkpoints[i].distanceFromStart,
            this.checkpoints[i + 1].distanceFromStart,
            this.checkpoints[i].mach,
            this.checkpoints[i + 1].mach,
          ),
          ...additionalProperties,
        });

        return this.checkpoints[i + 1];
      }
    }

    this.checkpoints.push({
      distanceFromStart,
      secondsFromPresent: this.lastCheckpoint.secondsFromPresent,
      altitude: this.lastCheckpoint.altitude,
      remainingFuelOnBoard: this.lastCheckpoint.remainingFuelOnBoard,
      speed: this.lastCheckpoint.speed,
      mach: this.lastCheckpoint.mach,
      ...additionalProperties,
    });

    return this.lastCheckpoint;
  }

  addCheckpointAtDistanceFromStart(distanceFromStart: NauticalMiles, ...checkpoints: VerticalCheckpoint[]) {
    if (distanceFromStart <= this.checkpoints[0].distanceFromStart) {
      this.checkpoints.unshift(...checkpoints);

      return;
    }

    for (let i = 0; i < this.checkpoints.length - 1; i++) {
      if (
        distanceFromStart > this.checkpoints[i].distanceFromStart &&
        distanceFromStart <= this.checkpoints[i + 1].distanceFromStart
      ) {
        this.checkpoints.splice(i + 1, 0, ...checkpoints);

        return;
      }
    }

    this.checkpoints.push(...checkpoints);
  }

  sortCheckpoints() {
    this.checkpoints.sort((a, b) => a.distanceFromStart - b.distanceFromStart);
  }

  finalizeProfile() {
    this.sortCheckpoints();

    this.isReadyToDisplay = true;
  }

  computeClimbPredictionToAltitude(altitude: Feet): PerfToAltPrediction | undefined {
    const [minAlt, maxAlt] = this.checkpoints.reduce(
      ([currentMin, currentMax], checkpoint) => [
        Math.min(currentMin, checkpoint.altitude),
        Math.max(currentMax, checkpoint.altitude),
      ],
      [Infinity, -Infinity],
    );

    if (altitude < minAlt || altitude > maxAlt) {
      return undefined;
    }

    const distanceToFcuAltitude = this.interpolateFromCheckpoints(
      altitude,
      (checkpoint) => checkpoint.altitude,
      (checkpoint) => checkpoint.distanceFromStart,
    );
    const timeToFcuAltitude = this.interpolateTimeAtDistance(distanceToFcuAltitude);

    return {
      altitude,
      distanceFromStart: distanceToFcuAltitude,
      secondsFromPresent: timeToFcuAltitude,
    };
  }

  computeDescentPredictionToAltitude(altitude: Feet): PerfToAltPrediction | undefined {
    const [minAlt, maxAlt] = this.checkpoints.reduce(
      ([currentMin, currentMax], checkpoint) => [
        Math.min(currentMin, checkpoint.altitude),
        Math.max(currentMax, checkpoint.altitude),
      ],
      [Infinity, -Infinity],
    );

    if (altitude < minAlt || altitude > maxAlt) {
      return undefined;
    }

    const ppos = this.findVerticalCheckpoint(VerticalCheckpointReason.PresentPosition);
    if (!ppos) {
      return undefined;
    }

    // TODO: Do this in one call
    const distanceToFcuAltitude = this.interpolateFromCheckpointsBackwards(
      altitude,
      (checkpoint) => checkpoint.altitude,
      (checkpoint) => checkpoint.distanceFromStart,
      true,
    );
    const timeToFcuAltitude = this.interpolateFromCheckpointsBackwards(
      altitude,
      (checkpoint) => checkpoint.altitude,
      (checkpoint) => checkpoint.secondsFromPresent,
      true,
    );

    return {
      altitude,
      distanceFromStart: distanceToFcuAltitude - ppos.distanceFromStart,
      secondsFromPresent: timeToFcuAltitude,
    };
  }

  addPresentPositionCheckpoint(presentPosition: LatLongAlt, remainingFuelOnBoard: number, mach: Mach, vman: Knots) {
    this.checkpoints.push({
      reason: VerticalCheckpointReason.PresentPosition,
      distanceFromStart: this.distanceToPresentPosition,
      secondsFromPresent: 0,
      altitude: presentPosition.alt,
      remainingFuelOnBoard,
      speed: VnavConfig.ALLOW_DEBUG_PARAMETER_INJECTION
        ? SimVar.GetSimVarValue('L:A32NX_FM_VNAV_DEBUG_SPEED', 'knots')
        : // Not sure what the initial speed should be, but we want it to be above maneuvering speed because predictions will predict a stall and crash otherwise.
          Math.max(SimVar.GetSimVarValue('AIRSPEED INDICATED', 'knots'), vman),
      // Note that the `mach` field here is usually not the Mach number that the aircraft is predicted to travel, but rather the Mach number
      // at which the speed target would change to be a Mach number.
      mach,
    });
  }

  abstract resetAltitudeConstraints(): void;

  abstract resetSpeedConstraints(): void;

  getRemainingFuelAtDestination(): Pounds | null {
    if (this.checkpoints.length < 1) {
      return null;
    }

    if (this.lastCheckpoint.reason !== VerticalCheckpointReason.Landing) {
      return null;
    }

    return this.lastCheckpoint.remainingFuelOnBoard;
  }

  getTimeToDestination(): Pounds | null {
    if (this.checkpoints.length < 1) {
      return null;
    }

    if (this.lastCheckpoint.reason !== VerticalCheckpointReason.Landing) {
      return null;
    }

    return this.lastCheckpoint.secondsFromPresent;
  }
}

type HasAtLeast<T, U extends keyof T> = Pick<T, U> & Partial<Omit<T, U>>;

function findLastIndex<T>(array: Array<T>, predicate: (value: T, index: number, obj: T[]) => boolean): number {
  let l = array.length;

  while (l--) {
    if (predicate(array[l], l, array)) {
      return l;
    }
  }

  return -1;
}
