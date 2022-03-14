// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

export const LnavConfig = {

    /* ========== PATHGEN CONFIG ========== */

    /**
     * The minimum TAS we ever compute guidables with
     */
    DEFAULT_MIN_PREDICTED_TAS: 160,

    /**
     * Coefficient applied to all transition turn radii
     */
    TURN_RADIUS_FACTOR: 1.0,

    /**
     * The number of transitions to compute after the active leg (-1: no limit, compute all transitions)
     */
    NUM_COMPUTED_TRANSITIONS_AFTER_ACTIVE: -1,

    /* ========== DEBUG INFO ========== */

    /**
     * Whether to print geometry generation / update debug info
     */
    DEBUG_GEOMETRY: false,

    /**
     * Whether to use the L:A32NX_DEBUG_TAS and L:A32NX_DEBUG_GS LVar for prediction speeds
     */
    DEBUG_USE_SPEED_LVARS: false,

    /**
     * Whether to force the drawing of course reversal (hold, proc turn) vectors at any point in the path
     */
    DEBUG_FORCE_INCLUDE_COURSE_REVERSAL_VECTORS: false,

    /**
     * Whether to print guidance debug information on the ND
     */
    DEBUG_GUIDANCE: false,

    /**
     * Whether to print guidable recomputation info
     */
    DEBUG_GUIDABLE_RECOMPUTATION: false,

    /**
     * Whether to draw path debug points and print them out
     */
    DEBUG_PREDICTED_PATH: false,

    /**
     * Whether to print SVG path generation debug info
     */
    DEBUG_PATH_DRAWING: false,

    /**
     * Whether to print FMS timing information
     */
    DEBUG_PERF: false,

    /**
     * Whether to save the flight plan to local storage (keeps flight plan over instrument reload)
     */
    DEBUG_SAVE_FPLN_LOCAL_STORAGE: false,

};
