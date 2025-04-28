//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { TurnDirection } from '@flybywiresim/fbw-sdk';

export interface WaypointStats {
  /**
   * Waypoint ident
   */
  ident: string;

  /**
   * Bearing from previous waypoint in degrees
   */
  bearingInFp: number;

  /**
   * Distance from previous waypoint in flight plan in nautical miles
   */
  distanceInFP: number;

  /**
   * Distance from PPOS in nautical miles
   */
  distanceFromPpos: number;

  /**
   * Predicted time from PPOS in seconds
   */
  timeFromPpos: number;

  /**
   * Predicted ETA from PPOS in seconds
   */
  etaFromPpos: number;

  /**
   * Magnetic variation in degrees
   */
  magneticVariation: number;
}

export interface ApproachStats {
  name: string;

  /**
   * Distance from PPOS in nautical miles
   */
  distanceFromPpos: number;
}

export interface HoldData {
  inboundMagneticCourse?: number;

  turnDirection?: TurnDirection;

  distance?: number;

  time?: number;

  type: HoldType;
}

export enum HoldType {
  Computed = 0,
  Database = 1,
  Pilot = 2,
}

export interface StepData {
  distanceBeforeTermination: NauticalMiles;

  toAltitude: Feet;

  ident: string;
}

export interface OffsetData {
  interceptAngle?: number;

  offsetDistance?: NauticalMiles;

  offsetDirection?: TurnDirection;

  offsetFlags: offsetFlags;
}

export enum offsetFlags {
  Start = 0,
  End = 1,
}
