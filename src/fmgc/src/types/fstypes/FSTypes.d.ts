/*
 * MIT License
 *
 * Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

export declare class WayPoint {
    constructor(_baseInstrument: BaseInstrument);

    icao: string;

    ident: string;

    endsInDiscontinuity?: boolean;

    discontinuityCanBeCleared?: boolean;

    isVectors?: boolean;

    isRunway?: boolean;

    isTurningPoint?: boolean;

    infos: WayPointInfo;

    type: string;

    bearingInFP: number;

    distanceInFP: number;

    cumulativeDistanceInFP: number;

    instrument: BaseInstrument;

    altDesc: number;

    altitude1: number;

    altitude2: number;

    legAltitudeDescription: number;

    legAltitude1: number;

    legAltitude2: number;

    speedConstraint: number;

    additionalData: { [key: string]: any }

    _svgElements: any;
}

declare class WayPointInfo {
    constructor(_instrument: BaseInstrument);

    coordinates: LatLongAlt;

    icao: string;

    ident: string;

    airwayIn: string;

    airwayOut: string;

    routes: any[];

    instrument: BaseInstrument;

    magneticVariation?: number;

    _svgElements: any;

    UpdateInfos(_CallBack?, loadFacilitiesTransitively?);

    CopyBaseInfosFrom(_WP: WayPoint);
}

declare class AirportInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);

    frequencies: any[];

    namedFrequencies: any[];

    departures: any[];

    approaches: RawApproach[];

    arrivals: any[];

    runways: any[];

    oneWayRunways: OneWayRunway[];

    UpdateNamedFrequencies(icao?: string): Promise<void>
}

declare class IntersectionInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
}

declare class VORInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
}

declare class NDBInfo extends WayPointInfo {
    constructor(_instrument: BaseInstrument);
}

declare interface OneWayRunway {
    designation: string;
    direction: number;
    beginningCoordinates: LatLongAlt;
    endCoordinates: LatLongAlt;
    elevation: number;
}

declare interface RawProcedureLeg {
    altDesc: AltitudeDescriptor;
    // constraint 1 metres
    altitude1: number;
    // constraint 2 metres
    altitude2: number;
    // icao of arc centre...
    arcCenterFixIcao: string;
    // course if needed, otherwise 0
    course: number;
    // length of leg in metres or minutes...
    distance: number;
    // distance in minutes?
    distanceMinutes: boolean;
    // fix this leg goes TO
    fixIcao: string;
    flyOver: boolean;
    // reference navaid... is the ILS for final leg of ILS approaches
    originIcao: string;
    // distance to originIcao in metres
    rho: number;
    // knots
    speedRestriction: number;
    // heading to originIcao, megnetic unless trueDegrees is true?
    theta: number;
    trueDegrees: boolean;
    turnDirection: TurnDirection;
    type: LegType;
    __Type: 'JS_Leg';
}

declare enum AltitudeDescriptor {
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
    // X = ? maybe not supported
    // Y = ? maybe not supported
}

declare enum TurnDirection {
    Unknown = 0,
    Left = 1,
    Right = 2,
    Either = 3,
}

// ARINC424 names
declare enum LegType {
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

declare interface RawApproachTransition {
    // denotes the subclass of this instance
    legs: RawProcedureLeg[];
    name: string;
    __Type: 'JS_ApproachTransition';
}

declare interface RawApproach {
    finalLegs: RawProcedureLeg[];
    // unknown/empty
    icaos: Array<string>;
    missedLegs: RawProcedureLeg[];
    // "(VOR|ILS|LOC|RNAV|...) [0-9]{2} ([A-Z])?"
    name: string;
    // 3 digits [0-9]{2}[LCR]
    runway: string;
    transitions: RawApproachTransition[];
    __Type: 'JS_Approach';
}

declare interface RawDeparture {
    // seems to be always empty...
    commonLegs: RawProcedureLeg[];
    enRouteTransitions: RawEnRouteTransition[];
    name: string;
    runwayTransitions: RawRunwayTransition[];
    __Type: 'JS_Departure';
}

declare interface RawArrival {
    // seems to be always empty...
    commonLegs: RawProcedureLeg[];
    enRouteTransitions: RawEnRouteTransition[];
    name: string;
    runwayTransitions: RawRunwayTransition[];
    __Type: 'JS_Arrival';
}

declare interface RawApproachTransition {
    legs: RawProcedureLeg[];
    name: string;
    __Type: 'JS_ApproachTransition';
}

declare interface RawEnRouteTransition {
    legs: RawProcedureLeg[];
    name: string;
    __Type: 'JS_EnRouteTransition';
}

declare interface RawRunwayTransition {
    legs: RawProcedureLeg[];
    runwayDesignation: RunwayDesignatorChar;
    runwayNumber: number;
    __Type: 'JS_RunwayTransition';
}

declare enum RunwayDesignatorChar {
    L = 1,
    R = 2,
    C = 3,
    W = 4, // water
    A = 5,
    B = 6,
}

declare interface RawFacility {
    // sometimes empty, sometimes two digit ICAO area code
    region: string;
    // translation string identifier
    city: string;
    icao: string;
    // often seems to be empty
    name: string;
    lat: number;
    lon: number;
    __Type: string;
}

declare interface RawVor extends RawFacility {
    freqBCD16: number;
    freqMHz: number;
    type: VorType;
    vorClass: VorClass;
    weatherBroadcast: number;
    //[0, 360)
    magneticVariation?: number;
    __Type: 'JS_FacilityVOR';
}

declare enum VorType {
    Unknown = 0,
    VOR = 1,
    VORDME = 2,
    DME = 3,
    TACAN = 4,
    VORTAC = 5,
    ILS = 6,
    VOT = 7,
}

declare enum VorClass {
    Unknown = 0,
    Terminal = 1, // T
    LowAltitude = 2, // L
    HighAlttitude = 3, // H
    ILS = 4, // C TODO Tacan as well according to ARINC?
    VOT = 5,
}

declare interface RawNdb extends RawFacility {
    freqMHz: number;
    type: NdbType;
    weatherBroadcast: number;
    //[0, 360)
    magneticVariation?: number;
    __Type: 'JS_FacilityNDB';
};

declare enum NdbType {
    Unknown = 0,
    CompassLocator = 1, // unsure on ARINC coding
    MH = 2, // marine beacon, >200 W
    H = 3, // NDB beacon, 50 - 199 W
    HH = 4, // NDB beacon, > 200 W
}

declare interface RawIntersection extends RawFacility {
    nearestVorDistance: number;
    nearestVorFrequencyBCD16: number;
    nearestVorFrequencyMHz: number;
    nearestVorICAO: string;
    nearestVorMagneticRadial: number;
    nearestVorTrueRadial: number;
    nearestVorType: VorType;
    routes: RawRoute[]; // airways
    __Type: 'JS_FacilityIntersection';
}

declare interface RawRoute {
    // airway name
    name: string;
    // end of airway
    nextIcao: string;
    // start of airway
    prevIcao: string;
    type: RouteType;
    __Type: 'JS_Route';
}

declare enum RouteType {
    LowLevel = 1, // L, victor
    HighLevel = 2, // H, jet
    All = 3, // B, both
}

declare interface RawAirport extends RawFacility {
    airportClass: AirportClass;
    airportPrivateType: number; // TODO any more detail?
    airspaceType: AirspaceType;
    approaches: RawApproach[];
    arrivals: RawArrival[];
    // often (always?) "Unknown"
    bestApproach: string;
    departures: RawDeparture[];
    // com frequencies, and sometimes navaids too...
    frequencies: RawFrequency[];
    // these two seem to be unused?
    fuel1: string;
    fuel2: string;
    // TODO enum?
    radarCoverage: number;
    runways: RawRunway[];
    towered: boolean;
    __Type: 'JS_FacilityAirport';
}

declare enum AirportClass {
    Unknown = 0,
    Normal = 1,
    SoftUnknown = 2, // TODO no idea but is "soft" according to waypoint.js
    Seaplane = 3,
    Heliport = 4,
    Private = 5,
}

declare enum AirspaceType {
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
    MODEC = 21,
    Radar = 22,
    Training = 23,
}

declare interface RawFrequency {
    freqBCD16: number;
    freqMHz: number;
    name: string;
    type: FrequencyType;
    __Type: 'JS_Frequency';
}

declare enum FrequencyType {
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

declare interface RawRunway {
    // denotes the subclass of this instance
    __Type: string;
    // [0-9]{2}[LCR](\-[0-9]{2}[LCR])?
    designation: string;
    designatorCharPrimary: RunwayDesignatorChar;
    designatorCharSecondary: RunwayDesignatorChar;
    // degrees
    direction: number;
    // metres
    elevation: number;
    latitude: number;
    // metres
    length: number;
    lighting: RunwayLighting;
    longitude: number;
    // these don't seem to be filled on almost all runways, but a curious few are...
    primaryILSFrequency: RawFrequency;
    secondaryILSFrequency: RawFrequency;
    surface: RunwaySurface;
    // metres
    width: number;
}

declare enum RunwayLighting { // TODO not 100% about this one..
    None = 0,
    Low = 1,
    Medium = 2,
    High = 3,
}

declare enum RunwaySurface {
    Concrete = 0,
    Grass = 1,
    Water = 2,
    Cement = 3,
    Asphalt = 4,
    Clay = 7,
    Snow = 8,
    Ice = 9,
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
    Unknown = 254,
    Fs20Material = 512,
    Fs20ApronMaterial = 65283,
}

declare function RegisterViewListener(handler: string): void
