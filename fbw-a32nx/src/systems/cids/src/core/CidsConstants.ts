const CidsConstants = {
    SimVar: {
        DIR1: {
            FAULT: 'L:A32NX_CIDS_DIR_1_FAULT',
            ACTIVE: 'L:A32NX_CIDS_DIR_1_ACTIVE',
        },
        DIR2: {
            FAULT: 'L:A32NX_CIDS_DIR_2_FAULT',
            ACTIVE: 'L:A32NX_CIDS_DIR_2_ACTIVE',
        },
        FLIGHT_PHASE: 'L:A32NX_CIDS_FLIGHT_PHASE',
    },
    /**
     * Will use verbose logging and set debug simvars when `true` -> should be `false` for prod
     */
    DEBUG: true,
};

export const Cids = Object.freeze(CidsConstants);
