// Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
// SPDX-License-Identifier: MIT

export enum AirportClass {
    Unknown = 0,
    Normal = 1,
    SoftUnknown = 2, // TODO no idea but is "soft" according to waypoint.js
    Seaplane = 3,
    Heliport = 4,
    Private = 5,
}

export enum AirportPrivateType {
    Unknown = 0,
    Public = 1,
    Military = 2,
    Private = 3,
}

export enum AirspaceType {
    None = 0,
    Center = 1,
    ClassA = 2,
    ClassB = 3,
    ClassC = 4,
    ClassD = 5,
    ClassE = 6,
    ClassF = 7,
    ClassG = 8,
    Tower = 9,
    Clearance = 10,
    Ground = 11,
    Departure = 12,
    Approach = 13,
    MOA = 14,
    Restricted = 15,
    Prohibited = 16,
    Warning = 17,
    Alert = 18,
    Danger = 19,
    NationalPark = 20,
    ModeC = 21,
    Radar = 22,
    Training = 23,
}

export enum AltitudeDescriptor {
    Empty = 0,
    At = 1, // @, At in Alt1
    AtOrAbove = 2, // +, at or above in Alt1
    AtOrBelow = 3, // -, at or below in Alt1
    Between = 4, // B, range between Alt1 and Alt2
    C = 5, // C, at or above in Alt2
    G = 6, // G, Alt1 At for FAF, Alt2 is glideslope MSL
    H = 7, // H, Alt1 is At or above for FAF, Alt2 is glideslope MSL
    I = 8, // I, Alt1 is at for FACF, Alt2 is glidelope intercept
    J = 9, // J, Alt1 is at or above for FACF, Alt2 is glideslope intercept
    V = 10, // V, Alt1 is procedure alt for step-down, Alt2 is at alt for vertical path angle
    // X, not supported
    // Y, not supported
}

export enum FixTypeFlags {
    None = 0,
    IAF = 1,
    IF = 2,
    MAP = 4,
    FAF = 8,
}

export enum FrequencyType {
    None = 0,
    ATIS = 1,
    Multicom = 2,
    Unicom = 3,
    CTAF = 4,
    Ground = 5,
    Tower = 6,
    Clearance = 7,
    Approach = 8,
    Departure = 9,
    Center = 10,
    FSS = 11,
    AWOS = 12,
    ASOS = 13,
    ClearancePreTaxi = 14,
    RemoteDeliveryClearance = 15,
}

// ARINC424 names
export enum LegType {
    Unknown = 0,
    AF = 1, // Arc to a fix (i.e. DME ARC)
    CA = 2, // Course to an Altitude
    CD = 3, // Course to a DME distance
    CF = 4, // Course to a Fix
    CI = 5, // Course to an intercept (next leg)
    CR = 6, // Course to a VOR radial
    DF = 7, // Direct to Fix from PPOS
    FA = 8, // Track from Fix to Altitude
    FC = 9, // Track from Fix to a Distance
    FD = 10, // Track from Fix to a DME distance (not the same fix)
    FM = 11, // Track from Fix to a Manual termination
    HA = 12, // Holding with Altitude termination
    HF = 13, // Holding, single circuit terminating at the fix
    HM = 14, // Holding with manual termination
    IF = 15, // Initial Fix
    PI = 16, // Procedure turn
    RF = 17, // Constant radius arc between two fixes, lines tangent to arc and a centre fix
    TF = 18, // Track to a Fix
    VA = 19, // Heading to an altitude
    VD = 20, // Heading to a DME distance
    VI = 21, // Heading to an intercept
    VM = 22, // Heading to a manual termination
    VR = 23, // Heading to a VOR radial
}

export enum NdbType {
    CompassLocator = 0, // < 25 W?
    MH = 1, // 25 - <50 W ?
    H = 2, // 50 - 199 W ?
    HH = 3, // > 200 W ?
}

export enum NearestSearchType {
    None = 0,
    Airport = 1,
    Intersection = 2,
    Vor = 3,
    Ndb = 4,
    Boundary = 5,
}

export enum RouteType {
    None = 0,
    LowLevel = 1, // L, victor
    HighLevel = 2, // H, jet
    All = 3, // B, both
}

export enum RunwayDesignatorChar {
    L = 1,
    R = 2,
    C = 3,
    W = 4, // water
    A = 5,
    B = 6,
}

export enum RunwayLighting {
    Unknown = 0,
    None = 1,
    PartTime = 2,
    FullTime = 3,
    Frequency = 4,
}

export enum RunwaySurface {
    Concrete = 0,
    Grass = 1,
    WaterFsx = 2,
    GrassBumpy = 3,
    Asphalt = 4,
    ShortGrass = 5,
    LongGrass = 6,
    HardTurf = 7,
    Snow = 8,
    Ice = 9,
    Urban = 10,
    Forest = 11,
    Dirt = 12,
    Coral = 13,
    Gravel = 14,
    OilTreated = 15,
    SteelMats = 16,
    Bituminous = 17,
    Brick = 18,
    Macadam = 19,
    Planks = 20,
    Sand = 21,
    Shale = 22,
    Tarmac = 23,
    WrightFlyerTrack = 24,
    Ocean = 26,
    Water = 27,
    Pond = 28,
    Lake = 29,
    River = 30,
    WasterWater = 31,
    Paint = 32,
}

export enum TurnDirection {
    Unknown = 0,
    Left = 1,
    Right = 2,
    Either = 3,
}

export enum VorClass {
    Unknown = 0,
    Terminal = 1, // T
    LowAltitude = 2, // L
    HighAlttitude = 3, // H
    ILS = 4, // C TODO Tacan as well according to ARINC?
    VOT = 5,
}

export enum VorType {
    Unknown = 0,
    VOR = 1,
    VORDME = 2,
    DME = 3,
    TACAN = 4,
    VORTAC = 5,
    ILS = 6,
    VOT = 7,
}

// TODO this is an FBW enum, not MSFS, belongs somewhere else
export enum WaypointConstraintType {
    CLB = 1,
    DES = 2,
}
