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

    DEBUG_PROFILE: false,

    ALLOW_DEBUG_PARAMETER_INJECTION: false,

    VNAV_USE_LATCHED_DESCENT_MODE: false,

    /**
     * Percent N1 to add to the predicted idle N1. The real aircraft does also use a margin for this, but I don't know how much
     */
    IDLE_N1_MARGIN: 3,
};
