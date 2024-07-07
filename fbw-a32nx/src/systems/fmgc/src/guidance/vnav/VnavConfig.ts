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
   * VNAV descent calculation mode (NORMAL, CDA or DPO)
   */
  VNAV_DESCENT_MODE: VnavDescentMode.NORMAL,

  /**
   * Whether to emit CDA flap1/2 pseudo-waypoints (only if VNAV_DESCENT_MODE is CDA)
   */
  VNAV_EMIT_CDA_FLAP_PWP: false,

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

  VNAV_USE_LATCHED_DESCENT_MODE: false,

  /**
   * Percent N1 to add to the predicted idle N1. The real aircraft does also use a margin for this, but I don't know how much
   */
  IDLE_N1_MARGIN: 3,

  /**
   * VNAV needs to make an initial estimate of the fuel on board at destination to compute the descent path.
   * We don't want this figure to be too large as it might crash the predictions. So we clamp it to this value.
   * This value is in lbs.
   */
  MAXIMUM_FUEL_ESTIMATE: 40000,
};
