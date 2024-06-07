/* eslint-disable camelcase */
const REFRESH_RATE: number = 1000; // Time between refreshes in ms
const TRACKING_MAX: number = 40; // # max contacts tracked - AMM 34-43-00:6a
const DISPLAY_MAX: number = 8; // # max contacts tracked - usually configurable by PIN program
const MEMORY_MAX: number = 200; // Max history before culling
const MIN_VS: number = -6000;
const MAX_VS: number = 6000;
const INHIBIT_CLB_RA: number = 39000; // for all climb RA's
const INHIBIT_INC_DES_RA_AGL: number = 1450; // for increase descent RA's
const INHIBIT_ALL_DES_RA_AGL: number = 1200; // 1200 takeoff, 1000 approach
const INHIBIT_ALL_RA: number = 1000; // 1100 in climb, 900 in descent
const REALLY_BIG_NUMBER: number = 1000000;
const INITIAL_DELAY: number = 5; // in seconds
const FOLLOWUP_DELAY: number = 2.5; // in deconds
const INITIAL_ACCEL: number = 8.04; // 0.25G in f/s^2
const FOLLOWUP_ACCEL: number = 10.62; // 0.33G in f/s^2
const TA_EXPIRATION_DELAY: number = 4; // in seconds
const MIN_RA_DURATION: number = 5; // in seconds
const VOL_BOOST: number = 1.25; // multiplier
const CLOSURE_RATE_THRESH: number = -40; // in knots

export enum TcasThreat { THREAT = 0, ALL = 1, ABOVE = 2, BELOW = 3 }
export enum TcasState { NONE = 0, TA = 1, RA = 2 }
export enum TcasMode { STBY = 0, TA = 1, TARA = 2 }
export enum XpdrMode { STBY = 1, ON = 3, ALT = 4, }
export enum TaRaIndex { TA = 0, RA = 1 }
export enum TaRaIntrusion { TRAFFIC = 0, PROXIMITY = 1, TA = 2, RA = 3 }
export enum Intrude { RANGE = 0, ALT = 1, SPEED = 2}
export enum RaSense { UP = 0, DOWN = 1 }
export enum RaType { CORRECT = 0, PREVENT = 1 }
export enum Limits { MIN = 0, MAX = 1 }
export enum Inhibit { NONE = 0, ALL_RA_AURAL_TA = 1, ALL_RA = 2, ALL_CLIMB_RA = 3, ALL_DESC_RA = 4, ALL_INCR_DESC_RA = 5 }

export interface JS_NPCPlane {
    name: string,
    uId: number,
    lat: number,
    lon: number,
    alt: number,
    heading: number
}

interface AltitudeMatrix {
    readonly 3: readonly [number, number],
    readonly 4: readonly [number, number],
    readonly 5: readonly [number, number],
    readonly 6: readonly [number, number],
    readonly 7: readonly [number, number],
}

interface SensitivityMatrix {
    readonly 1: readonly [number, number],
    readonly 2: readonly [number, number],
    readonly 3: readonly [number, number],
    readonly 4: readonly [number, number],
    readonly 5: readonly [number, number],
    readonly 6: readonly [number, number],
    readonly 7: readonly [number, number],
    readonly 8: readonly [number, number],
}

interface SensitivityList {
    readonly 1: number,
    readonly 2: number,
    readonly 3: number,
    readonly 4: number,
    readonly 5: number,
    readonly 6: number,
    readonly 7: number,
    readonly 8: number,
}

interface RangeLimit {
    readonly forward: readonly [number, number]
    readonly side: number,
    readonly back: number
    readonly alt: number
}

export interface RaParams {
    callout: RaCallout,
    sense: RaSense,
    type: RaType,
    vs: VerticalSpeedLimits
}

interface VerticalSpeedLimits {
    readonly green: readonly [number, number],
    readonly red: readonly [number, number]
}

interface RaCallout {
    readonly id: number,
    readonly repeat: boolean,
    readonly sound: RaSound
}

export interface RaSound {
    readonly name: string,
    readonly length: number
}

const THREAT: { [key in TcasThreat] : readonly [number, number]} = {
    [TcasThreat.THREAT]: [-2700, 2700],
    [TcasThreat.ALL]: [-2700, 2700],
    [TcasThreat.ABOVE]: [-2700, 9900],
    [TcasThreat.BELOW]: [-9900, 2700],
};

// Altitude -> Sensitivity
const SENSE: AltitudeMatrix = {
    3: [1000, 2350],
    4: [2350, 5000],
    5: [5000, 10000],
    6: [10000, 20000],
    7: [20000, 47000],
} as const;

// TCAS Range Limit
const RANGE: RangeLimit = { // 34-43-00 6:2339
    forward: [60, 100], // 60-100 Nm Forwards
    side: 30, // 30 Nm side
    back: 20, // 20Nm behind
    alt: 9900,
} as const;

// Sensitivity to TAU limit
const TAU: SensitivityMatrix = {
    1: [-1, -1],
    2: [20, -1],
    3: [25, 15],
    4: [30, 20],
    5: [40, 25],
    6: [45, 30],
    7: [48, 35],
    8: [48, 35],
} as const;

// Incremental Range Protection Volume
const DMOD: SensitivityMatrix = {
    1: [-1, -1],
    2: [0.3, -1],
    3: [0.33, 0.2],
    4: [0.48, 0.35],
    5: [0.75, 0.55],
    6: [1, 0.8],
    7: [1.3, 1.1],
    8: [1.3, 1.1],
} as const;

// Detection Alt Threshold
const ZTHR: SensitivityMatrix = {
    1: [-1, -1],
    2: [850, -1],
    3: [850, 300],
    4: [850, 300],
    5: [850, 350],
    6: [850, 400],
    7: [850, 600],
    8: [1200, 700],
} as const;

// Time Variable Alt Tau Threshold
const TVTHR: SensitivityList = {
    1: -1,
    2: -1,
    3: 15,
    4: 18,
    5: 20,
    6: 22,
    7: 25,
    8: 25,
} as const;

// Positive Advisory Altitude Threshold
const ALIM: SensitivityList = {
    1: -1,
    2: -1,
    3: 300,
    4: 300,
    5: 350,
    6: 400,
    7: 600,
    8: 700,
} as const;

// Limit closure acceleration (workaround/unrealistic)
// TODO FIXME: Replace with HMD accel filter?
const ACCEL: SensitivityMatrix = {
    1: [900, 900],
    2: [1000, 1000],
    3: [1100, 1200],
    4: [1200, 1300],
    5: [1300, 1400],
    6: [2000, 2200],
    7: [2100, 2300],
    8: [2200, 2500],
} as const;

// many lengths are approximate until we can get them accuratly (when boris re-makes them and we have the sources)
const SOUNDS: { [key: string] : RaSound } = {
    pull_up: {
        name: 'aural_pullup_new',
        length: 0.9,
    },
    sink_rate: {
        name: 'aural_sink_rate_new',
        length: 0.9,
    },
    dont_sink: {
        name: 'aural_dontsink_new',
        length: 0.9,
    },
    too_low_gear: {
        name: 'aural_too_low_gear',
        length: 0.8,
    },
    too_low_flaps: {
        name: 'aural_too_low_flaps',
        length: 0.8,
    },
    too_low_terrain: {
        name: 'aural_too_low_terrain',
        length: 0.9,
    },
    minimums: {
        name: 'aural_minimumnew',
        length: 0.67,
    },
    hundred_above: {
        name: 'aural_100above',
        length: 0.72,
    },
    retard: {
        name: 'new_retard',
        length: 0.9,
    },
    alt_2500: {
        name: 'new_2500',
        length: 1.1,
    },
    alt_1000: {
        name: 'new_1000',
        length: 0.9,
    },
    alt_500: {
        name: 'new_500',
        length: 0.6,
    },
    alt_400: {
        name: 'new_400',
        length: 0.6,
    },
    alt_300: {
        name: 'new_300',
        length: 0.6,
    },
    alt_200: {
        name: 'new_200',
        length: 0.6,
    },
    alt_100: {
        name: 'new_100',
        length: 0.6,
    },
    alt_50: {
        name: 'new_50',
        length: 0.4,
    },
    alt_40: {
        name: 'new_40',
        length: 0.4,
    },
    alt_30: {
        name: 'new_30',
        length: 0.4,
    },
    alt_20: {
        name: 'new_20',
        length: 0.4,
    },
    alt_10: {
        name: 'new_10',
        length: 0.3,
    },
    alt_5: {
        name: 'new_5',
        length: 0.3,
    },
    climb_climb: {
        name: 'climb_climb',
        length: 1.6,
    },
    climb_crossing_climb: {
        name: 'climb_crossing_climb',
        length: 1.7,
    },
    increase_climb: {
        name: 'increase_climb',
        length: 1.2,
    },
    climb_climb_now: {
        name: 'climb_climb_now',
        length: 1.9,
    },
    clear_of_conflict: {
        name: 'clear_of_conflict',
        length: 1.5,
    },
    descend_descend: {
        name: 'descend_descend',
        length: 2.1,
    },
    descend_crossing_descend: {
        name: 'descend_crossing_descend',
        length: 1.9,
    },
    increase_descent: {
        name: 'increase_descent',
        length: 1.3,
    },
    descend_descend_now: {
        name: 'descend_descend_now',
        length: 2.2,
    },
    monitor_vs: {
        name: 'monitor_vs',
        length: 1.7,
    },
    maint_vs_maint: {
        name: 'maint_vs_maint',
        length: 3.2,
    },
    maint_vs_crossing_maint: {
        name: 'maint_vs_crossing_maint',
        length: 3.2,
    },
    level_off_level_off: {
        name: 'level_off_level_off',
        length: 2.3,
    },
    traffic_traffic: {
        name: 'traffic_traffic',
        length: 1.5,
    },
} as const;

const CALLOUTS: { [key: string] : RaCallout } = {
    climb: {
        id: 0,
        repeat: false,
        sound: SOUNDS.climb_climb,
    },
    climb_cross: {
        id: 1,
        repeat: true,
        sound: SOUNDS.climb_crossing_climb,
    },
    climb_increase: {
        id: 2,
        repeat: true,
        sound: SOUNDS.increase_climb,
    },
    climb_now: {
        id: 3,
        repeat: true,
        sound: SOUNDS.climb_climb_now,
    },
    clear_of_conflict: {
        id: 4,
        repeat: false,
        sound: SOUNDS.clear_of_conflict,
    },
    descend: {
        id: 5,
        repeat: false,
        sound: SOUNDS.descend_descend,
    },
    descend_cross: {
        id: 6,
        repeat: true,
        sound: SOUNDS.descend_crossing_descend,
    },
    descend_increase: {
        id: 7,
        repeat: true,
        sound: SOUNDS.increase_descent,
    },
    descend_now: {
        id: 8,
        repeat: true,
        sound: SOUNDS.descend_descend_now,
    },
    monitor_vs: {
        id: 9,
        repeat: false,
        sound: SOUNDS.monitor_vs,
    },
    maintain_vs: {
        id: 10,
        repeat: false,
        sound: SOUNDS.maint_vs_maint,
    },
    maintain_vs_cross: {
        id: 11,
        repeat: false,
        sound: SOUNDS.maint_vs_crossing_maint,
    },
    level_off: {
        id: 12,
        repeat: false,
        sound: SOUNDS.level_off_level_off,
    },
    traffic: {
        id: 13,
        repeat: false,
        sound: SOUNDS.traffic_traffic,
    },
} as const;

const RA_VARIANTS: { [key: string] : RaParams } = {
    // PREVENTIVE RA's
    monitor_vs_climb_0: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.UP,
        type: RaType.PREVENT,
        vs: {
            green: [0, MAX_VS],
            red: [MIN_VS, 0],
        },
    },
    monitor_vs_climb_500: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.UP,
        type: RaType.PREVENT,
        vs: {
            green: [-500, MAX_VS],
            red: [MIN_VS, -500],
        },
    },
    monitor_vs_climb_1000: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.UP,
        type: RaType.PREVENT,
        vs: {
            green: [-1000, MAX_VS],
            red: [MIN_VS, -1000],
        },
    },
    monitor_vs_climb_2000: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.UP,
        type: RaType.PREVENT,
        vs: {
            green: [-2000, MAX_VS],
            red: [MIN_VS, -2000],
        },
    },

    monitor_vs_descend_0: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.DOWN,
        type: RaType.PREVENT,
        vs: {
            green: [MIN_VS, 0],
            red: [0, MAX_VS],
        },
    },
    monitor_vs_descend_500: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.DOWN,
        type: RaType.PREVENT,
        vs: {
            green: [MIN_VS, 500],
            red: [500, MAX_VS],
        },
    },
    monitor_vs_descend_1000: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.DOWN,
        type: RaType.PREVENT,
        vs: {
            green: [MIN_VS, 1000],
            red: [1000, MAX_VS],
        },
    },
    monitor_vs_descend_2000: {
        callout: CALLOUTS.monitor_vs,
        sense: RaSense.DOWN,
        type: RaType.PREVENT,
        vs: {
            green: [MIN_VS, 2000],
            red: [2000, MAX_VS],
        },
    },
    // CORRECTIVE RA's
    // CLIMB
    climb: {
        callout: CALLOUTS.climb,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [1500, 2000],
            red: [MIN_VS, 1500],
        },
    },
    climb_cross: {
        callout: CALLOUTS.climb_cross,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [1500, 2000],
            red: [MIN_VS, 1500],
        },
    },
    climb_increase: {
        callout: CALLOUTS.climb_increase,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [2500, 4400],
            red: [MIN_VS, 2500],
        },
    },
    climb_now: {
        callout: CALLOUTS.climb_now,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [1500, 2000],
            red: [MIN_VS, 1500],
        },
    },
    // CORRECTIVE RA's
    // DESCEND
    descend: {
        callout: CALLOUTS.descend,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-2000, -1500],
            red: [-1500, MAX_VS],
        },
    },
    descend_cross: {
        callout: CALLOUTS.descend_cross,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-2000, -1500],
            red: [-1500, MAX_VS],
        },
    },
    descend_increase: {
        callout: CALLOUTS.descend_increase,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-4400, -2500],
            red: [-2500, MAX_VS],
        },
    },
    descend_now: {
        callout: CALLOUTS.descend_now,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-2000, -1500],
            red: [-1500, MAX_VS],
        },
    },
    // CORRECTIVE RA's
    // LEVEL OFF
    // level_off_250_both: {
    //     // Currently not used
    //     // Will be used when support for multi-threat RA's,
    //     // from both above and below, will be added
    //     callout: CALLOUTS.level_off,
    //     sense: RaSense.UP,
    //     type: RaType.CORRECT,
    //     vs: {
    //         green: [-250, 250],
    //         red: [
    //             [MIN_VS, -250],
    //             [250, MAX_VS]
    //         ]
    //     }
    // },
    level_off_300_below: {
        callout: CALLOUTS.level_off,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-400, 0],
            red: [0, MAX_VS],
        },
    },
    level_off_300_above: {
        callout: CALLOUTS.level_off,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [0, 400],
            red: [MIN_VS, 0],
        },
    },
    // CORRECTIVE RA's
    // MAINTAIN VS, CLIMB
    climb_maintain_vs: {
        callout: CALLOUTS.maintain_vs,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [1500, 4400],
            red: [MIN_VS, 1500],
        },
    },
    climb_maintain_vs_crossing: {
        callout: CALLOUTS.maintain_vs,
        sense: RaSense.UP,
        type: RaType.CORRECT,
        vs: {
            green: [1500, 4400],
            red: [MIN_VS, 1500],
        },
    },
    // CORRECTIVE RA's
    // MAINTAIN VS, DESCEND
    descend_maintain_vs: {
        callout: CALLOUTS.maintain_vs,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-4400, -1500],
            red: [-1500, MAX_VS],
        },
    },
    descend_maintain_vs_crossing: {
        callout: CALLOUTS.maintain_vs,
        sense: RaSense.DOWN,
        type: RaType.CORRECT,
        vs: {
            green: [-4400, -1500],
            red: [-1500, MAX_VS],
        },
    },
} as const;

export const TCAS_CONST: { [key: string] : any } = {
    REFRESH_RATE,
    TRACKING_MAX,
    DISPLAY_MAX,
    MEMORY_MAX,
    MIN_VS,
    INHIBIT_CLB_RA, // for all climb RA's
    INHIBIT_INC_DES_RA_AGL, // for increase descent RA's
    INHIBIT_ALL_DES_RA_AGL, // 1200 takeoff, 1000 approach
    INHIBIT_ALL_RA, // 1100 in climb, 900 in descent
    REALLY_BIG_NUMBER,
    INITIAL_DELAY, // in seconds
    FOLLOWUP_DELAY, // in deconds
    INITIAL_ACCEL, // 0.25G in f/s^2
    FOLLOWUP_ACCEL, // 0.33G in f/s^2
    TA_EXPIRATION_DELAY, // in seconds
    MIN_RA_DURATION, // in seconds
    VOL_BOOST, // multiplier
    CLOSURE_RATE_THRESH, // in knots
    THREAT,
    SENSE,
    RANGE,
    TAU,
    DMOD,
    ZTHR,
    TVTHR,
    ALIM,
    ACCEL,
    SOUNDS,
    CALLOUTS,
    RA_VARIANTS,
} as const;
