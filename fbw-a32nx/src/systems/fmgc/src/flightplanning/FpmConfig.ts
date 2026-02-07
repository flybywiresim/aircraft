// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

export interface FpmConfig {
  /** Whether deleting a waypoint or a discontinuity creates a temporary flight plan */
  TMPY_ON_DELETE_WAYPOINT: boolean;

  /** Whether toggling an overfly creates a temporary flight plan */
  TMPY_ON_OVERFLY: boolean;

  /** Whether changing a constraint on a leg creates a temporary flight plan */
  TMPY_ON_CONSTRAINT_EDIT: boolean;

  /**
   * Whether inserting a waypoint directly in the fligh plan creates a temporary flight plan
   * Note that NEXT WPT will always create a temporary flight plan
   */
  TMPY_ON_INSERT_WAYPOINT: boolean;

  /** Whether further changes can be made to the temporary flight plan after it is created from a revision */
  ALLOW_REVISIONS_ON_TMPY: boolean;

  /** Whether to allow FIX INFO entries on non-active flight plans */
  ALLOW_NON_ACTIVE_FIX_INFOS: boolean;

  /** Maximum number of flight plan legs */
  MAX_NUM_LEGS: number;

  /** Whether to advertise only VIAs that are compatible with the selected STAR (first waypoint of VIA is in STAR) */
  CHECK_VIA_COMPATIBILITY: boolean;

  /** Whether the next abeam point of a DIR TO WITH ABEAM is considered as the TO waypoint emitted by the FPM */
  DIR_TO_ABEAM_POINT_IS_TO_WPT: boolean;

  /**
   * Whether or not to keep the taxi fuel in the active flight plan if a swap with a secondary plan,
   * that does not have a taxi fuel value entered, is performed
   */
  PERSIST_TAXI_FUEL_ON_SEC_SWAP: boolean;

  /** The number of different flight levels for which cruise wind entries may be made */
  NUM_CRUISE_WIND_LEVELS: number;

  /** The number of different flight levels for which climb wind entries may be made */
  NUM_CLIMB_WIND_LEVELS: number;

  /** The number of different flight levels for which descent wind entries may be made */
  NUM_DESCENT_WIND_LEVELS: number;
}

export class FpmConfigs {
  static A380: FpmConfig = {
    TMPY_ON_DELETE_WAYPOINT: true,
    TMPY_ON_OVERFLY: true,
    TMPY_ON_CONSTRAINT_EDIT: true,
    TMPY_ON_INSERT_WAYPOINT: true,
    ALLOW_REVISIONS_ON_TMPY: true,
    ALLOW_NON_ACTIVE_FIX_INFOS: false,
    MAX_NUM_LEGS: 200,
    CHECK_VIA_COMPATIBILITY: true,
    DIR_TO_ABEAM_POINT_IS_TO_WPT: true,
    PERSIST_TAXI_FUEL_ON_SEC_SWAP: true,
    NUM_CRUISE_WIND_LEVELS: 4,
    NUM_CLIMB_WIND_LEVELS: 5,
    NUM_DESCENT_WIND_LEVELS: 10,
  };

  static A320_HONEYWELL_H3: FpmConfig = {
    TMPY_ON_DELETE_WAYPOINT: false,
    TMPY_ON_OVERFLY: false,
    TMPY_ON_CONSTRAINT_EDIT: false,
    TMPY_ON_INSERT_WAYPOINT: false,
    ALLOW_REVISIONS_ON_TMPY: false,
    ALLOW_NON_ACTIVE_FIX_INFOS: false,
    MAX_NUM_LEGS: 250,
    CHECK_VIA_COMPATIBILITY: false,
    DIR_TO_ABEAM_POINT_IS_TO_WPT: false,
    PERSIST_TAXI_FUEL_ON_SEC_SWAP: false,
    NUM_CRUISE_WIND_LEVELS: 4,
    NUM_CLIMB_WIND_LEVELS: 5,
    // Normally 5, 10 with the 4D RTA option
    NUM_DESCENT_WIND_LEVELS: 10,
  };
}
