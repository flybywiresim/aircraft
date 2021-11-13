export const LnavConfig = {

    /* ========== PATHGEN CONFIG ========== */

    /**
     * The minimum TAS we ever compute guidables with
     */
    DEFAULT_MIN_PREDICTED_TAS: 160,

    /**
     * Coefficient applied to all transition turn radii
     */
    TURN_RADIUS_FACTOR: 1.1,

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

};
