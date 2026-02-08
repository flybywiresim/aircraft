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
  CourseReversalLeft = 1 << 13,
  CourseReversalRight = 1 << 14,
  CyanColor = 1 << 15,
  AmberColor = 1 << 16,
  MagentaColor = 1 << 17,
  LeftSideOnly = 1 << 18,
  RightSideOnly = 1 << 19,
}

/** NdSymbolTypeFlags was filling up, so we had to separate the PWP flags into this enum */
export enum NdPwpSymbolTypeFlags {
  None = 0,
  PwpEndOfVdMarker = 1 << 0,
  PwpDecel = 1 << 1,
  PwpTopOfDescent = 1 << 2,
  PwpSpeedChange = 1 << 3,
  PwpClimbLevelOff = 1 << 4,
  PwpDescentLevelOff = 1 << 5,
  PwpStartOfClimb = 1 << 6,
  PwpInterceptProfile = 1 << 7,
  PwpTimeMarker = 1 << 8,
  PwpCdaFlap1 = 1 << 9,
  PwpCdaFlap2 = 1 << 10,
}

export enum EfisRecomputingReason {
  None,
  RangeChange,
  ModeChange,
  ModeAndRangeChange,
}

export interface InternalFmsSymbol {
  databaseId: string;
  ident: string;
  location: Coordinates | null;
  predictedAltitude?: number;
  direction?: number; // true
  length?: number; // nautical miles
  type: NdSymbolTypeFlags;
  typePwp?: NdPwpSymbolTypeFlags; // only for PWP
  constraints?: string[];
  altConstraint?: AltitudeConstraint;
  isAltitudeConstraintMet?: boolean;
  radials?: number[];
  radii?: number[];
  distanceFromAirplane?: number;
}

export type NdSymbol = Omit<InternalFmsSymbol, 'predictedAltitude' | 'altConstraint' | 'isAltitudeConstraintMet'>;
export type VdSymbol = Omit<InternalFmsSymbol, 'radials' | 'radii'>;

/**
 * Possible flight plan vector groups to be transmitted to the ND.
 *
 * **NOTE:** this does not necessarily represent the current function of a transmitted flight plan. Those groups are sometimes used for other purposes than their name
 * refers to, for example the DASHED flight plan being used to transmit the non-offset path of an active flight plan with an offset applied.
 *
 * The value of each group is used to determine the drawing order. Low values are drawn first, high values last.
 */
export enum EfisVectorsGroup {
  /**
   * Solid green line
   */
  ACTIVE = 2,

  /**
   * Dashed green line
   */
  DASHED = 3,

  /**
   * Dashed green line
   */
  OFFSET = 4,

  /**
   * Dashed yellow line
   */
  TEMPORARY = 5,

  /**
   * Dimmed white line
   */
  SECONDARY = 0,

  /**
   * Dashed dimmed white line
   */
  SECONDARY_DASHED = 1,

  /**
   * Solid cyan line
   */
  MISSED = 6,

  /**
   * Dashed cyan line
   */
  ALTERNATE = 7,

  /**
   * Continuous yellow line
   */
  ACTIVE_EOSID = 8,
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

export interface HUDSyntheticRunway {
  // LatLongAlt
  location: Coordinates;
  thresholdLocation: Coordinates;
  startLocation: Coordinates;
  // degrees
  gradient: number | null;
  direction: number | null;
  latitude: number | null;
  longitude: number | null;
  // metres
  thresholdCrossingHeight: number | null;
  elevation: number | null;
  length: number | null;
  width: number | null;
  cornerCoordinates: LatLongAlt[];
  centerlineCoordinates: LatLongAlt[];
}
