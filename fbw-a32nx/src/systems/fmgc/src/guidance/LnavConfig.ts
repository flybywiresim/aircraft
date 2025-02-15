// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

export const LnavConfig = {
  VerboseFpmLog: false,

  /* ========== PATHGEN CONFIG ========== */

  /**
   * The minimum TAS we ever compute guidables with
   */
  DefaultMinPredictedTas: 160,

  /**
   * Coefficient applied to all transition turn radii
   */
  TurnRadiusFactor: 1.0,

  /**
   * The number of transitions to compute after the active leg (-1: no limit, compute all transitions)
   */
  NumComputedTransitionsAfterActive: -1,

  /* ========== DEBUG INFO ========== */

  /**
   * Whether to print geometry generation / update debug info
   */
  DebugGeometry: false,

  /**
   * Whether to use the L:A32NX_DEBUG_TAS and L:A32NX_DEBUG_GS LVar for prediction speeds
   */
  DebugUseSpeedLvars: false,

  /**
   * Whether to force the drawing of course reversal (hold, proc turn) vectors at any point in the path
   */
  DebugForceIncludeCourseReversalVectors: false,

  /**
   * Whether to print guidance debug information on the ND
   */
  DebugGuidance: false,

  /**
   * Whether to print guidable recomputation info
   */
  DebugGuidableRecomputation: false,

  /**
   * Whether to draw path debug points and print them out
   */
  DebugPredictedPath: false,

  /**
   * Whether to print SVG path generation debug info
   */
  DebugPathDrawing: false,

  /**
   * Whether to print FMS timing information
   */
  DebugPerf: false,

  /**
   * Whether to save the flight plan to local storage (keeps flight plan over instrument reload)
   */
  DebugSaveFplnLocalStorage: false,
};
