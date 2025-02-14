// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

export enum VnavDescentMode {
  NORMAL,
  CDA,
  DPO,
}

export const VnavConfig = {
  /**
   * Whether to pring debug information and errors during the VNAV computation.
   */
  DEBUG_PROFILE: false,

  /**
   * Whether to print guidance debug information on the ND
   */
  DEBUG_GUIDANCE: false,

  /**
   * Whether to use debug simvars (VNAV_DEBUG_*) to determine aircraft position and state.
   * This is useful for testing VNAV without having to fly the aircraft. This lets you put the aircraft some distance before destination at a given altitude and speed.
   * The following simvars can be used:
   * - A32NX_FM_VNAV_DEBUG_POINT: Indicates the distance from start (NM) at which to draw a debug pseudowaypoint on the ND
   * - A32NX_FM_VNAV_DEBUG_ALTITUDE: Indicates the indicated altitude (ft) VNAV uses for predictions
   * - A32NX_FM_VNAV_DEBUG_SPEED: Indicates the indicated airspeed (kts) VNAV uses for predictions
   * - A32NX_FM_VNAV_DEBUG_DISTANCE_TO_END: Indicates the distance (NM) to end VNAV uses for predictions
   */
  ALLOW_DEBUG_PARAMETER_INJECTION: false,
};
