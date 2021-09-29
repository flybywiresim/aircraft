/* eslint-disable camelcase */

export enum TcasThreat {
    THREAT = 0,
    ALL = 1,
    ABOVE = 2,
    BELOW = 3
}

export enum TcasState {
    NONE = 0,
    TA = 1,
    RA = 2
}

export enum TaRaIndex {
    TA = 0,
    RA = 1
}

export enum TaRaIntrusion {
    TRAFFIC = 0,
    PROXIMITY = 1,
    TA = 2,
    RA = 3
}

export enum Intrude {
    RANGE = 0,
    ALT = 1
}

export enum RaSense {
    UP = 0,
    DOWN = 1
}

export enum RaType {
    CORRECT = 0,
    PREVENT = 1
}

export interface RaParams {
    callout: RaCallout,
    sense: RaSense,
    type: RaType,
    vs: {
        green: number[],
        red: number[]
    }
}

export interface RaCallout {
    id: number,
    repeat: boolean,
    sound: RaSound
}

export interface RaSound {
    name: string,
    length: number
}

export enum Inhibit {
    NONE = 0,
    ALL_RA_AURAL_TA = 1,
    ALL_RA = 2,
    ALL_CLIMB_RA = 3,
    ALL_DESC_RA = 4,
    ALL_INCR_DESC_RA = 5
}

export interface JS_NPCPlane {
    name: string,
    uId: number,
    lat: number,
    lon: number,
    alt: number,
    heading: number
}

interface SensitivityMatrix {
    1: number[],
    2: number[],
    3: number[],
    4: number[],
    5: number[],
    6: number[],
    7: number[],
    8: number[],
}

interface SensitivityList {
    1: number,
    2: number,
    3: number,
    4: number,
    5: number,
    6: number,
    7: number,
    8: number,
}

export const MIN_VS = -6000;

export class TcasConst {
    public static readonly MIN_VS = -6000;

    public static readonly MAX_VS = 6000;

    public static readonly INHIBIT_CLB_RA = 39000; // for all climb RA's

    public static readonly INHIBIT_INC_DES_RA_AGL = 1450; // for increase descent RA's

    public static readonly INHIBIT_ALL_DES_RA_AGL = 1200; // 1200 takeoff, 1000 approach

    public static readonly INHIBIT_ALL_RA = 1000; // 1100 in climb, 900 in descent

    public static readonly REALLY_BIG_NUMBER = 1000000;

    public static readonly INITIAL_DELAY = 5; // in seconds

    public static readonly FOLLOWUP_DELAY = 2.5; // in deconds

    public static readonly INITIAL_ACCEL = 8.04; // 0.25G in f/s^2

    public static readonly FOLLOWUP_ACCEL = 10.62; // 0.33G in f/s^2

    public static readonly TA_EXPIRATION_DELAY = 4; // in seconds

    public static readonly MIN_RA_DURATION = 5; // in seconds

    public static readonly VOL_BOOST = 1.25; // multiplier

    public static readonly CLOSURE_RATE_THRESH = -40; // in knots

    public static readonly TAU: SensitivityMatrix = {
        1: [-1, -1],
        2: [20, -1],
        3: [25, 15],
        4: [30, 20],
        5: [40, 25],
        6: [45, 30],
        7: [48, 35],
        8: [48, 35],
    }

    public static readonly DMOD: SensitivityMatrix = {
        1: [-1, -1],
        2: [0.3, -1],
        3: [0.33, 0.2],
        4: [0.48, 0.35],
        5: [0.75, 0.55],
        6: [1, 0.8],
        7: [1.3, 1.1],
        8: [1.3, 1.1],
    }

    public static readonly ZTHR: SensitivityMatrix = {
        1: [-1, -1],
        2: [850, -1],
        3: [850, 300],
        4: [850, 300],
        5: [850, 350],
        6: [850, 400],
        7: [850, 600],
        8: [1200, 700],
    }

    public static readonly TVTHR: SensitivityList = {
        1: -1,
        2: -1,
        3: 15,
        4: 18,
        5: 20,
        6: 22,
        7: 25,
        8: 25,
    }

    public static readonly ALIM: SensitivityList = {
        1: -1,
        2: -1,
        3: 300,
        4: 300,
        5: 350,
        6: 400,
        7: 600,
        8: 700,
    }

    // many lengths are approximate until we can get them accuratly (when boris re-makes them and we have the sources)
    public static readonly SOUNDS = {
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
    };

    public static readonly CALLOUTS = {
        climb: {
            id: 0,
            repeat: false,
            sound: TcasConst.SOUNDS.climb_climb,
        },
        climb_cross: {
            id: 1,
            repeat: true,
            sound: TcasConst.SOUNDS.climb_crossing_climb,
        },
        climb_increase: {
            id: 2,
            repeat: true,
            sound: TcasConst.SOUNDS.increase_climb,
        },
        climb_now: {
            id: 3,
            repeat: true,
            sound: TcasConst.SOUNDS.climb_climb_now,
        },
        clear_of_conflict: {
            id: 4,
            repeat: false,
            sound: TcasConst.SOUNDS.clear_of_conflict,
        },
        descend: {
            id: 5,
            repeat: false,
            sound: TcasConst.SOUNDS.descend_descend,
        },
        descend_cross: {
            id: 6,
            repeat: true,
            sound: TcasConst.SOUNDS.descend_crossing_descend,
        },
        descend_increase: {
            id: 7,
            repeat: true,
            sound: TcasConst.SOUNDS.increase_descent,
        },
        descend_now: {
            id: 8,
            repeat: true,
            sound: TcasConst.SOUNDS.descend_descend_now,
        },
        monitor_vs: {
            id: 9,
            repeat: false,
            sound: TcasConst.SOUNDS.monitor_vs,
        },
        maintain_vs: {
            id: 10,
            repeat: false,
            sound: TcasConst.SOUNDS.maint_vs_maint,
        },
        maintain_vs_cross: {
            id: 11,
            repeat: false,
            sound: TcasConst.SOUNDS.maint_vs_crossing_maint,
        },
        level_off: {
            id: 12,
            repeat: false,
            sound: TcasConst.SOUNDS.level_off_level_off,
        },
        traffic: {
            id: 13,
            repeat: false,
            sound: TcasConst.SOUNDS.traffic_traffic,
        },
    };

    public static readonly RA_VARIANTS = {
        // PREVENTIVE RA's
        monitor_vs_climb_0: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.UP,
            type: RaType.PREVENT,
            vs: {
                green: [0, TcasConst.MAX_VS],
                red: [TcasConst.MIN_VS, 0],
            },
        },
        monitor_vs_climb_500: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.UP,
            type: RaType.PREVENT,
            vs: {
                green: [-500, TcasConst.MAX_VS],
                red: [TcasConst.MIN_VS, -500],
            },
        },
        monitor_vs_climb_1000: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.UP,
            type: RaType.PREVENT,
            vs: {
                green: [-1000, TcasConst.MAX_VS],
                red: [TcasConst.MIN_VS, -1000],
            },
        },
        monitor_vs_climb_2000: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.UP,
            type: RaType.PREVENT,
            vs: {
                green: [-2000, TcasConst.MAX_VS],
                red: [TcasConst.MIN_VS, -2000],
            },
        },

        monitor_vs_descend_0: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.DOWN,
            type: RaType.PREVENT,
            vs: {
                green: [TcasConst.MIN_VS, 0],
                red: [0, TcasConst.MAX_VS],
            },
        },
        monitor_vs_descend_500: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.DOWN,
            type: RaType.PREVENT,
            vs: {
                green: [TcasConst.MIN_VS, 500],
                red: [500, TcasConst.MAX_VS],
            },
        },
        monitor_vs_descend_1000: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.DOWN,
            type: RaType.PREVENT,
            vs: {
                green: [TcasConst.MIN_VS, 1000],
                red: [1000, TcasConst.MAX_VS],
            },
        },
        monitor_vs_descend_2000: {
            callout: TcasConst.CALLOUTS.monitor_vs,
            sense: RaSense.DOWN,
            type: RaType.PREVENT,
            vs: {
                green: [TcasConst.MIN_VS, 2000],
                red: [2000, TcasConst.MAX_VS],
            },
        },
        // CORRECTIVE RA's
        // CLIMB
        climb: {
            callout: TcasConst.CALLOUTS.climb,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [1500, 2000],
                red: [TcasConst.MIN_VS, 1500],
            },
        },
        climb_cross: {
            callout: TcasConst.CALLOUTS.climb_cross,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [1500, 2000],
                red: [TcasConst.MIN_VS, 1500],
            },
        },
        climb_increase: {
            callout: TcasConst.CALLOUTS.climb_increase,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [2500, 4400],
                red: [TcasConst.MIN_VS, 2500],
            },
        },
        climb_now: {
            callout: TcasConst.CALLOUTS.climb_now,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [1500, 2000],
                red: [TcasConst.MIN_VS, 1500],
            },
        },
        // CORRECTIVE RA's
        // DESCEND
        descend: {
            callout: TcasConst.CALLOUTS.descend,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-2000, -1500],
                red: [-1500, TcasConst.MAX_VS],
            },
        },
        descend_cross: {
            callout: TcasConst.CALLOUTS.descend_cross,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-2000, -1500],
                red: [-1500, TcasConst.MAX_VS],
            },
        },
        descend_increase: {
            callout: TcasConst.CALLOUTS.descend_increase,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-4400, -2500],
                red: [-2500, TcasConst.MAX_VS],
            },
        },
        descend_now: {
            callout: TcasConst.CALLOUTS.descend_now,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-2000, -1500],
                red: [-1500, TcasConst.MAX_VS],
            },
        },
        // CORRECTIVE RA's
        // LEVEL OFF
        // level_off_250_both: {
        //     // Currently not used
        //     // Will be used when support for multi-threat RA's,
        //     // from both above and below, will be added
        //     callout: TcasConst.CALLOUTS.level_off,
        //     sense: RaSense.UP,
        //     type: RaType.CORRECT,
        //     vs: {
        //         green: [-250, 250],
        //         red: [
        //             [TcasConst.MIN_VS, -250],
        //             [250, TcasConst.MAX_VS]
        //         ]
        //     }
        // },
        level_off_300_below: {
            callout: TcasConst.CALLOUTS.level_off,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-400, 0],
                red: [0, TcasConst.MAX_VS],
            },
        },
        level_off_300_above: {
            callout: TcasConst.CALLOUTS.level_off,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [0, 400],
                red: [TcasConst.MIN_VS, 0],
            },
        },
        // CORRECTIVE RA's
        // MAINTAIN VS, CLIMB
        climb_maintain_vs: {
            callout: TcasConst.CALLOUTS.maintain_vs,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [1500, 4400],
                red: [TcasConst.MIN_VS, 1500],
            },
        },
        climb_maintain_vs_crossing: {
            callout: TcasConst.CALLOUTS.maintain_vs,
            sense: RaSense.UP,
            type: RaType.CORRECT,
            vs: {
                green: [1500, 4400],
                red: [TcasConst.MIN_VS, 1500],
            },
        },
        // CORRECTIVE RA's
        // MAINTAIN VS, DESCEND
        descend_maintain_vs: {
            callout: TcasConst.CALLOUTS.maintain_vs,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-4400, -1500],
                red: [-1500, TcasConst.MAX_VS],
            },
        },
        descend_maintain_vs_crossing: {
            callout: TcasConst.CALLOUTS.maintain_vs,
            sense: RaSense.DOWN,
            type: RaType.CORRECT,
            vs: {
                green: [-4400, -1500],
                red: [-1500, TcasConst.MAX_VS],
            },
        },
    };
}
