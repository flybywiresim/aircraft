export type RangeSetting = 10 | 20 | 40 | 80 | 160 | 320;
export const rangeSettings: RangeSetting[] = [10, 20, 40, 80, 160, 320];

export enum Mode {
    ROSE_ILS,
    ROSE_VOR,
    ROSE_NAV,
    ARC,
    PLAN,
}

export type EfisSide = 'L' | 'R'

export enum EfisOption {
    None = 0,
    Constraints = 1,
    VorDmes = 2,
    Waypoints = 3,
    Ndbs = 4,
    Airports = 5,
}

// TODO get from proper place
interface LatLongData {
    lat: number,
    long: number,
}

export enum NdSymbolTypeFlags {
    Vor = 1 << 0,
    VorDme = 1 << 1,
    Ndb = 1 << 2,
    Waypoint = 1 << 3,
    Airport = 1 << 4,
    Runway = 1 << 5,
    Tuned = 1 << 6,
    ActiveLegTermination = 1 << 7,
    EfisOption = 1 << 8,
    Dme = 1 << 9,
    ConstraintMet = 1 << 10,
    ConstraintMissed = 1 << 11,
    ConstraintUnknown = 1 << 12,
    SpeedChange = 1 << 13,
    FixInfo = 1 << 14,
    FlightPlan = 1 << 15,
}

export interface NdSymbol {
    databaseId: string,
    ident: string,
    location: LatLongData,
    direction?: number, // true
    length?: number, // nautical miles
    type: NdSymbolTypeFlags,
    constraints?: string[],
    radials?: number[],
    radii?: number[],
}
