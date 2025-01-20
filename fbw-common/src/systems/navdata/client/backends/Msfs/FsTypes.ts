// Copyright (c) 2020-2021 Working Title, FlyByWire Simulations
// SPDX-License-Identifier: MIT

// disable a few lints rules as we're using MSFS type names
/* eslint-disable camelcase */

/** FS2024 only. */
export interface JS_ICAO {
  __Type: 'JS_ICAO';
  type: string;
  region: string;
  airport: string;
  ident: string;
}

export interface JS_Approach {
  __Type: 'JS_Approach';
  /** multiple approach identifier */
  approachSuffix: string;
  /** approach type */
  approachType: ApproachType;
  /** final approach legs up to and including MAP */
  finalLegs: JS_Leg[];
  /** seems to be empty */
  icaos: string[];
  /** missed approach legs, not including MAP */
  missedLegs: JS_Leg[];
  /** approach name */
  name: string;
  /** flags to identify the intended guidance source */
  rnavTypeFlags: RnavTypeFlags;
  /** runway as a string, empty for multiple runway approaches */
  runway: string;
  /** runway designator char/suffix */
  runwayDesignator: RunwayDesignatorChar;
  /** runway number without suffix */
  runwayNumber: number;
  /** approach vias/transitions */
  transitions: JS_ApproachTransition[];
  /** FS2024 only. */
  rnpAr?: boolean;
  /** FS2024 only. */
  rnpArMissed?: boolean;
}

export interface JS_ApproachTransition {
  __Type: 'JS_ApproachTransition';
  legs: JS_Leg[];
  /** unfortunately just the name of the first waypoint/initial fix */
  name: string;
}

export interface JS_Arrival {
  __Type: 'JS_Arrival';
  /** legs common to all transitions and runways */
  commonLegs: JS_Leg[];
  /** enroute transitions */
  enRouteTransitions: JS_EnRouteTransition[];
  /** name in ARINC 424 format */
  name: string;
  runwayTransitions: JS_RunwayTransition[];
  /** FS2024 only. */
  rnpAr?: boolean;
}
export interface JS_Departure {
  __Type: 'JS_Departure';
  commonLegs: JS_Leg[];
  enRouteTransitions: JS_EnRouteTransition[];
  /** name in ARINC 424 format */
  name: string;
  runwayTransitions: JS_RunwayTransition[];
  /** FS2024 only. */
  rnpAr?: boolean;
}

export type JS_Procedure = JS_Approach | JS_Arrival | JS_Departure;

export interface JS_EnRouteTransition {
  __Type: 'JS_EnRouteTransition';
  legs: JS_Leg[];
  /** unfortunately just the name of the first waypoint/initial fix */
  name: string;
}

export interface JS_FacilityAirport {
  __Type: 'JS_FacilityAirport';
  /** FS2024 only. Specifies what data was request for this facility. */
  loadedDataFlags?: number;
  airportClass: AirportClass;
  airportPrivateType: AirportPrivateType;
  airpspaceType: AirspaceType;
  approaches: JS_Approach[];
  arrivals: JS_Arrival[];
  /** always "Unknown"... */
  bestApproach: string;
  /** needs translated with Utils.Translate */
  city: string;
  departures: JS_Departure[];
  frequencies: JS_Frequency[];
  fuel1: string;
  fuel2: string;
  gates: JS_Gate[];
  /** the MSFS database identifier, not 4 letter icao code! */
  icao: string;
  /** The MSFS database identifier in object form; MSFS2024 only. */
  icaoStruct?: JS_ICAO;
  /** airport reference point latitude */
  lat: number;
  /** airport reference point longitude */
  lon: number;
  /** FS2024 only. +/- 180 degrees. */
  magvar?: number;
  /** needs translated with Utils.Translate */
  name: string;
  radarCoverage: number;
  region: string;
  runways: JS_Runway[];
  /** always seems to be false */
  towered: boolean;
  /** FS2024 only. */
  holdingPatterns?: JS_HoldingPattern[];
  /** Metres, 0 if not defined. FS2024 only. */
  transitionAlt?: number;
  /** Metres, 0 if not defined. FS2024 only. */
  transitionLevel?: number;
  /** FS2024 only. */
  iata?: string;
}

export interface JS_FacilityIntersection {
  __Type: 'JS_FacilityIntersection';
  /** usually empty */
  city: string;
  /** msfs database identifier */
  icao: string;
  /** facility latitude */
  lat: number;
  /** facility longitude */
  lon: number;
  /** name, usually blank */
  name: string;
  nearestVorDistance: number;
  nearestVorFrequencyBCD16: number;
  nearestVorFrequencyMHz: number;
  nearestVorICAO: string;
  nearestVorMagneticRadial: number;
  nearestVorTrueRadial: number;
  nearestVorType: VorType;
  /** icao region (2 char) */
  region: string;
  /** airways to/from this intersection */
  routes: JS_Route[];
}

/** the record for a NDB, there will be a @see JS_FacilityIntersection associated if there are airways to/from the NDB */
export interface JS_FacilityNDB {
  __Type: 'JS_FacilityNDB';
  /** usually empty */
  city: string;
  freqBCD16: number;
  /** frequency, actually in KHz */
  freqMHz: number;
  /** msfs database identifier */
  icao: string;
  /** facility latitude */
  lat: number;
  /** facility longitude */
  lon: number;
  /** name, usually blank */
  name: string;
  /** icao region (2 char) */
  region: string;
  /** type */
  type: NdbType;
  /** unknown */
  weatherBroadcast: number;
  /** FS2024 only. +/- 180 degrees. */
  magvar?: number;
  /** metres. FS2024 only. */
  range?: number;
  /** FS2024 only. */
  bfoRequired?: boolean;
}

/** FS2024 only. */
export interface JS_DME {
  readonly __Type: 'JS_DME';
  /** The altitude of the DME transmitter. */
  readonly alt: number;
  /** Whether the DME station is colocated with the glideslope. */
  readonly atGlideslope: boolean;
  /** Whether the DME station is colocated with the nav transmitter (VOR or LOC). */
  readonly atNav: boolean;
  /** The latitude of the DME transmitter. */
  readonly lat: number;
  /** The longitude of the DME transmitter. */
  readonly lon: number;
}

/** FS2024 only. */
export enum TacanMode {
  None = 0,
  X = 88, // ASCII 'X'
  Y = 89, // ASCII 'Y'
}

/** FS2024 only. */
export interface JS_TACAN {
  readonly __Type: 'JS_TACAN';
  /** The altitude of the DME transmitter. */
  readonly alt: number;
  /** TACAN channel number. */
  readonly channel: number;
  /** The latitude of the DME transmitter. */
  readonly lat: number;
  /** The longitude of the DME transmitter. */
  readonly lon: number;
  /** The TACAN mode. */
  readonly mode: TacanMode;
}

/** the record for a VOR, there will be a @see JS_FacilityIntersection associated if there are airways to/from the VOR */
export interface JS_FacilityVOR {
  __Type: 'JS_FacilityVOR';
  /** usually empty */
  city: string;
  freqBCD16: number;
  /** frequency, with weird precision/rounding */
  freqMHz: number;
  /** msfs database identifier */
  icao: string;
  /** facility latitude */
  lat: number;
  /** facility longitude */
  lon: number;
  /** station declination coded in the database... not the current magnetic variation! */
  magneticVariation: number;
  /** name, usually blank */
  name: string;
  /** icao region (2 char) */
  region: string;
  /** type */
  type: VorType;
  /** class */
  vorClass: VorClass;
  /** unknown */
  weatherBroadcast: number;
  /** FS2024 only. +/- 180 degrees. */
  magvar?: number;
  /** metres. FS2024 only. */
  navRange?: number;
  /** FS2024 only. */
  dme?: JS_DME | null;
  /** FS2024 only. */
  ils?: JS_ILSFrequency | null;
  /** FS2024 only. */
  tacan?: JS_TACAN | null;
  /** FS2024 only. */
  trueReferenced?: boolean;
}

export type JS_Facility = JS_FacilityAirport | JS_FacilityIntersection | JS_FacilityNDB | JS_FacilityVOR;

interface JS_FrequencyBase {
  freqBCD16: number;
  freqMHz: number;
  /** icao of the associated navaid, or empty string */
  icao: string;
  /** frequency name, no translation needed */
  name: string;
  /** 0 for non-com frequencies e.g. ILS */
  type: FrequencyType;
}

export interface JS_Frequency extends JS_FrequencyBase {
  __Type: 'JS_Frequency';
}

export interface JS_ILSFrequency extends JS_FrequencyBase {
  __Type: 'JS_ILSFrequency';
  /** FS2024 only. */
  hasBackcourse?: boolean;
  hasGlideslope: number;
  /** Metres. FS2024 only. */
  glideslopeAlt?: number;
  glideslopeAngle: number;
  /** FS2024 only. */
  glideslopeLat?: number;
  /** FS2024 only. */
  glideslopeLon?: number;
  localizerCourse: number;
  /** Degrees, FS2024 only. */
  localizerWidth?: number;
  magvar: number;
  /** FS2024 only. */
  lsCategory?: LandingSystemCategory;
}

export interface JS_Gate {
  __Type: 'JS_Gate';
  /** values currently borked */
  latitude: number;
  /** values currently borked */
  longitude: number;
  /** unknown meaning */
  name: number;
  /** gate number */
  number: number;
  /** unknown meaning */
  suffix: number;
}

export interface JS_Leg {
  __Type: 'JS_Leg';
  /** altitude descriptor per ARINC 424... only the first few seem to be used */
  altDesc: AltitudeDescriptor;
  /** altitude 1 in metres to be interpreted per @see altDesc */
  altitude1: number;
  /** altitude 2 in metres to be interpreted per @see altDesc */
  altitude2: number;
  /** centre fix for RF legs */
  arcCenterFixIcao: string;
  /** course in degrees, true or mag depending on @see trueDegrees */
  course: number;
  /** distance in metres or minutes, to be intrepeted per ARINC 424 depending on leg type and @see distanceMinutes */
  distance: number;
  /** is the distance in minutes */
  distanceMinutes: boolean;
  /** the waypoint for this leg, to be intrepeted per ARINC 424 */
  fixIcao: string;
  /** identifies IF, IAF, FAF, MAP, etc. */
  fixTypeFlags: FixTypeFlags;
  /** should this leg termination be overflown */
  flyOver: boolean;
  /** recommended navaid, to be intrepeted per ARINC 424 */
  originIcao: string;
  /** rho in metres, to be intrepeted per ARINC 424 depending on leg type */
  rho: number;
  /** the speed limit, assumed at or below */
  speedRestriction: number;
  /** FS2024 only. */
  speedRestrictionType: SpeedRestrictionDescriptor;
  /** theta in magnetic degrees, to be intrepeted per ARINC 424 */
  theta: number;
  /** if the @see course is in true degrees instead of magnetic */
  trueDegrees: boolean;
  /** forced turn direction for the transition onto this leg, turn direction valid is implied */
  turnDirection: TurnDirection;
  /** ARINC 424 leg type */
  type: LegType;
  /** Vertical angle for the leg in degrees + 360 */
  verticalAngle: number;
  /** metres, FS2024 only. */
  rnp?: number;
}

export interface JS_Route {
  __Type: 'JS_Route';
  /** airway name */
  name: string;
  /** waypoint after this on the airway */
  nextIcao: string;
  /** FS2024 only. */
  nextIcaoStruct?: JS_ICAO;
  /** Metres, FS2024 only. */
  nextMinAlt?: number;
  /** waypoint before this on the airway */
  prevIcao: string;
  /** FS2024 only. */
  prevIcaoStruct?: JS_ICAO;
  /** Metres, FS2024 only. */
  prevMinAlt?: number;
  type: RouteType;
}

export interface JS_Runway {
  __Type: 'JS_Runway';
  /** runway designation numbers only, split by - */
  designation: string;
  designatorCharPrimary: RunwayDesignatorChar;
  designatorCharSecondary: RunwayDesignatorChar;
  /** runway bearing in true degrees */
  direction: number;
  /** runway elevation in metres */
  elevation: number;
  /** latitude of the centre of the runway */
  latitude: number;
  /** runway length in metres */
  length: number;
  /** seems to always be 0 */
  lighting: RunwayLighting;
  /** longitude of the centre of the runway */
  longitude: number;
  /** primary elevation in metres... not sure if threshold or end */
  primaryElevation: number;
  /** ils frequency for the primary end... not always filled */
  primaryILSFrequency: JS_ILSFrequency;
  /** offset of the primary end threshold in metres */
  primaryThresholdLength: number;
  /** secondary elevation in metres... not sure if threshold or end */
  secondaryElevation: number;
  /** ils frequency for the secondary end... not always filled */
  secondaryILSFrequency: JS_ILSFrequency;
  /** offset of the secondary end threshold in metres */
  secondaryThresholdLength: number;
  surface: RunwaySurface;
  /** runway width in metres */
  width: number;
}

export interface JS_RunwayTransition {
  __Type: 'JS_RunwayTransition';
  legs: JS_Leg[];
  /** matches up to @see JS_Runway.designatorCharPrimary and @see JS_Runway.designatorCharSecondary */
  runwayDesignation: RunwayDesignatorChar;
  /** matches up to @see JS_Runway.designation and @see JS_Runway.designation as a number */
  runwayNumber: number;
}

/** FS2024 only. */
export interface JS_HoldingPattern {
  __Type: 'JS_HoldingPattern';
  /** The holding fix ICAO. */
  readonly icaoStruct: JS_ICAO;
  /** Course for the inbound leg of the holding pattern, in degrees. Can be magnetic or true. */
  readonly inboundCourse: number;
  /** The holding leg length, in metres, or 0 if the hold is time-based. */
  readonly legLength: number;
  /** The holding leg length, in minutes, or 0 if the hold is distance-based. */
  readonly legTime: number;
  /** Maximum altitude in the hold, in metres, or 0 if none. */
  readonly maxAltitude: number;
  /** Minimum altitude in the hold, in metres, or 0 if none. */
  readonly minAltitude: number;
  /** Friendly name of the holding pattern. */
  readonly name: string;
  /** The required arc radius in the hold, in metres, or 0 if none. */
  readonly radius: number;
  /** The required navigation performance in the hold, in metres, or 0 if none. */
  readonly rnp: number;
  /** Maximum speed in the hold, in knots, or 0 if none. */
  readonly speed: number;
  /** Whether the hold is right-turn (true), or left-turn (false). */
  readonly turnRight: boolean;
}

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

/** FS2024 only. */
export enum SpeedRestrictionDescriptor {
  Unused,
  At,
  AtOrAbove,
  AtOrBelow,
  Between,
}

export enum ApproachType {
  Unknown = 0,
  Gps = 1,
  Vor = 2,
  Ndb = 3,
  Ils = 4,
  Loc = 5,
  Sdf = 6,
  Lda = 7,
  VorDme = 8,
  NdbDme = 9,
  Rnav = 10,
  Backcourse = 11,
}

export enum FixTypeFlags {
  None = 0,
  IAF = 1,
  IF = 2,
  MAP = 4,
  FAF = 8,
  MAHP = 16,
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

export enum IcaoSearchFilter {
  None = 0,
  Airports = 1,
  Intersections = 2,
  Vors = 3,
  Ndbs = 4,
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

export enum RnavTypeFlags {
  None = 0,
  LNAV = 1,
  LNAVVNAV = 2,
  LP = 4,
  LPV = 8,
}

export enum RouteType {
  None = 0,
  LowLevel = 1, // L, victor
  HighLevel = 2, // H, jet
  All = 3, // B, both
}

export enum RunwayDesignatorChar {
  None = 0,
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
  HighAltitude = 3, // H
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

/** FS2024 only. */
export enum LandingSystemCategory {
  None = 0,
  Cat1,
  Cat2,
  Cat3,
  Localizer,
  Igs,
  LdaNoGs,
  LdaWithGs,
  SdfNoGs,
  SdfWithGs,
}
