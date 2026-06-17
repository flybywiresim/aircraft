/** This is duplicated to avoid having a weird import from the navdata typings */
export interface JS_ICAO {
  __Type: 'JS_ICAO';
  type: string;
  region: string;
  airport: string;
  ident: string;
}

/** FS2024 only. */
export interface JS_RunwayIdentifier {
  __Type: 'JS_RunwayIdentifier';
  number: string;
  designator: string;
}

/** FS2024 only. */
export interface JS_ApproachIdentifier {
  __Type: 'JS_ApproachIdentifier';
  runway: JS_RunwayIdentifier;
  type: string;
  suffix: string;
}

/** FS2024 only. */
export interface JS_FlightPlanRoute {
  __Type: 'JS_FlightPlanRoute';
  departureAirport: JS_ICAO;
  departureRunway: JS_RunwayIdentifier;
  departure: string;
  departureTransition: string;
  departureVfrPattern: JS_FlightPlanRouteVfrPatternProcedure;
  destinationAirport: JS_ICAO;
  destinationRunway: JS_RunwayIdentifier;
  arrival: string;
  arrivalTransition: string;
  approach: JS_ApproachIdentifier;
  approachTransition: string;
  approachVfrPattern: JS_FlightPlanRouteVfrPatternProcedure;
  enroute: JS_EnrouteLeg[];
  isVfr: boolean;
  cruiseAltitude: JS_FlightAltitude;
}

export interface JS_FlightAltitude {
  __Type: 'JS_FlightAltitude';
  altitude: number;
  isFlightLevel: boolean;
}

export interface JS_FlightPlanRouteVfrPatternProcedure {
  __Type: 'JS_VfrPatternProcedure';
  type: string;
  distance: number;
  altitude: number;
  isLeftTraffic: boolean;
}

/** FS2024 only. */
export interface JS_EnrouteLeg {
  __Type: 'JS_EnrouteLeg';
  isPpos: boolean;
  fixIcao: JS_ICAO;
  hasLatLon: boolean;
  lat: number;
  lon: number;
  hasPointBearingDistance: boolean;
  referenceIcao: JS_ICAO;
  bearing: number;
  distance: number;
  altitude: null;
  name: string;
  via: string;
}
