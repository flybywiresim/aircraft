//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';
import { AltitudeConstraint } from '../../fmgc/constraint';

export type EfisSide = 'L' | 'R';

export type A320EfisNdRangeValue = 10 | 20 | 40 | 80 | 160 | 320;

export type A320EfisOansNdRangeValue = -1 | 10 | 20 | 40 | 80 | 160 | 320;

export type A380EfisNdRangeValue = -1 | 10 | 20 | 40 | 80 | 160 | 320 | 640;

export const a320EfisRangeSettings: A320EfisNdRangeValue[] = [10, 20, 40, 80, 160, 320];

export const a320EfisOansRangeSettings: A320EfisOansNdRangeValue[] = [-1, 10, 20, 40, 80, 160, 320];

export const a380EfisRangeSettings: A380EfisNdRangeValue[] = [-1, 10, 20, 40, 80, 160, 320, 640];

export const a320TerrainThresholdPadValue = '0';

export const a380TerrainThresholdPadValue = '\\xa0';

export const a320NdRangeChange = 'RANGE CHANGE';

export const a380NdRangeChange = 'ND RANGE CHANGE';

export const a320NdModeChange = 'MODE CHANGE';

export const a380NdModeChange = 'ND MODE CHANGE';

export enum EfisNdMode {
  ROSE_ILS,
  ROSE_VOR,
  ROSE_NAV,
  ARC,
  PLAN,
}

export enum EfisOption {
  None = 0,
  Constraints = 1 << 0,
  VorDmes = 1 << 1,
  Waypoints = 1 << 2,
  Ndbs = 1 << 3,
  Airports = 1 << 4,
}

export enum NdSymbolTypeFlags {
  None = 0,
  Vor = 1 << 0,
  VorDme = 1 << 1,
  Ndb = 1 << 2,
  Waypoint = 1 << 3,
  Airport = 1 << 4,
  Runway = 1 << 5,
  Tuned = 1 << 6,
  ActiveLegTermination = 1 << 7,
  EfisOption = 1 << 8,
  Dme = 1 << 9,
  Constraint = 1 << 10,
  FixInfo = 1 << 11,
  FlightPlan = 1 << 12,
  CourseReversalLeft = 1 << 17,
  CourseReversalRight = 1 << 18,
  PwpDecel = 1 << 19,
  PwpTopOfDescent = 1 << 20,
  PwpSpeedChange = 1 << 21,
  PwpClimbLevelOff = 1 << 22,
  PwpDescentLevelOff = 1 << 23,
  PwpStartOfClimb = 1 << 24,
  PwpInterceptProfile = 1 << 25,
  PwpTimeMarker = 1 << 26,
  PwpCdaFlap1 = 1 << 27,
  PwpCdaFlap2 = 1 << 28,
  CyanColor = 1 << 29,
  AmberColor = 1 << 30,
  MagentaColor = 1 << 31,
}

export enum EfisRecomputingReason {
  None,
  RangeChange,
  ModeChange,
  ModeAndRangeChange,
}

export interface NdSymbol {
  databaseId: string;
  ident: string;
  location: Coordinates | null;
  predictedAltitude?: number;
  direction?: number; // true
  length?: number; // nautical miles
  type: NdSymbolTypeFlags;
  constraints?: string[];
  altConstraint?: AltitudeConstraint;
  isAltitudeConstraintMet?: boolean;
  radials?: number[];
  radii?: number[];
  distanceFromAirplane?: number;
}

/**
 * Possible flight plan vector groups to be transmitted to the ND.
 *
 * **NOTE:** this does not necessarily represent the current function of a transmitted flight plan. Those groups are sometimes used for other purposes than their name
 * refers to, for example the DASHED flight plan being used to transmit the non-offset path of an active flight plan with an offset applied.
 */
export enum EfisVectorsGroup {
  /**
   * Solid green line
   */
  ACTIVE,

  /**
   * Dashed green line
   */
  DASHED,

  /**
   * Dashed green line
   */
  OFFSET,

  /**
   * Dashed yellow line
   */
  TEMPORARY,

  /**
   * Dimmed white line
   */
  SECONDARY,

  /**
   * Dashed dimmed white line
   */
  SECONDARY_DASHED,

  /**
   * Solid cyan line
   */
  MISSED,

  /**
   * Dashed cyan line
   */
  ALTERNATE,

  /**
   * Continuous yellow line
   */
  ACTIVE_EOSID,
}

export interface NdTraffic {
  alive?: boolean;
  ID: string;
  lat: number;
  lon: number;
  relativeAlt: number;
  vertSpeed: number;
  intrusionLevel: number;
  posX?: number;
  posY?: number;
  // debug
  seen?: number;
  hidden?: boolean;
  raTau?: number;
  taTau?: number;
  vTau?: number;
  closureRate?: number;
  closureAccel?: number;
}

export const enum NavAidMode {
  Off = 0,
  ADF,
  VOR,
}

export interface TcasWxrMessage {
  text: string;
}
