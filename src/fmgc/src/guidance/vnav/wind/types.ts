// These are how the winds are entered in the MCDU. The are saved in FMCMainDisplay.
// They should probably be typed properly using d.ts files, but this is an intermediate step until the whole MCDU gets typed at some point
export interface FmcWindVector {
    direction: number,
    speed: number,
}

export type FmcWindEntry = FmcWindVector & { altitude: number };

export interface FmcWinds {
    climb: FmcWindVector[],
    cruise: FmcWindVector[],
    des: FmcWindVector[],
    alternate: null,
}
