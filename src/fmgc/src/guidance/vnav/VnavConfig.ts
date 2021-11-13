//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export enum VnavDescentMode {
    NORMAL,
    CDA,
    DPO,
}

export const VnavConfig = {

    /**
     * Whether to calculate climb profile
     */
    VNAV_CALCULATE_CLIMB_PROFILE: false,

    /**
     * Whether to emit ToD pseudo waypoint
     */
    VNAV_EMIT_TOD: false,

    /**
     * Whether to emit (DECEL) pseudo waypoint
     */
    VNAV_EMIT_DECEL: true,

    /**
     * VNAV descent calculation mode (NORMAL, CDA or DPO)
     */
    VNAV_DESCENT_MODE: VnavDescentMode.CDA,

    /**
     * Whether to emit CDA flap1/2 pseudo-waypoints (only if VNAV_DESCENT_MODE is CDA)
     */
    VNAV_EMIT_CDA_FLAP_PWP: true,

};
