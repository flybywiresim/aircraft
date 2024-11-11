// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface ISimbriefData {
  origin: IAirportInfo;
  destination: IAirportInfo;
  airline: string | object;
  flightNumber: string;
  callsign: string;
  aircraftReg: string;
  aircraftIcao: string;
  cruiseAltitude: number;
  costIndex: string;
  route: string;
  navlog: INavlogFix[];
  distance: string;
  flightETAInSeconds: string;
  averageTropopause: string;
  weights: IWeights;
  fuel: IFuel;
  units: string;
  alternate: IAlternate;
  times: ITimes;
  weather: IWeather;
  files: Files;
  ofpLayout: string;
  text: string;
}

interface INavlogFix {
  ident: string;
  name: string;
  type: string;
  frequency: string;
  pos_lat: string;
  pos_long: string;
  stage: string;
  via_airway: string;
  is_sid_star: string;
  distance: string;
  track_true: string;
  track_mag: string;
  heading_true: string;
  heading_mag: string;
  altitude_feet: string;
  ind_airsspeed: string;
  true_airspeed: string;
  mach: string;
  mach_thousandths: string;
  wind_component: string;
  groundspeed: string;
  time_leg: string;
  time_total: string;
  fuel_flow: string;
  fuel_leg: string;
  fuel_totalused: string;
  fuel_min_onboard: string;
  fuel_plan_onboard: string;
  oat: string;
  oat_isa_dev: string;
  wind_dir: string;
  wind_spd: string;
  shear: string;
  tropopause_feet: string;
  ground_height: string;
  mora: string;
  fir: 'string';
  fir_units: string;
  fir_valid_levels: string;
  wind_data: IFixWind;
  fir_crossing: any;
}

interface IFixWind {
  level: IWindLevel[];
}

interface IWindLevel {
  altitude: string;
  wind_dir: string;
  wind_spd: string;
  oat: string;
}

interface IAirportInfo {
  icao: string;
  runway: string;
  iata: string;
  name: string;
  posLat: number;
  posLong: number;
  metar: string;
  transAlt: number;
  transLevel: number;
}

export interface IWeights {
  cargo: string;
  estLandingWeight: string;
  estTakeOffWeight: string;
  estZeroFuelWeight: string;
  maxLandingWeight: string;
  maxTakeOffWeight: string;
  maxZeroFuelWeight: string;
  passengerCount: string;
  bagCount: string;
  passengerWeight: string;
  bagWeight: string;
  payload: string;
  freight: string;
}

export interface IFuel {
  avgFuelFlow: number;
  contingency: number;
  enrouteBurn: number;
  etops: number;
  extra: number;
  maxTanks: number;
  minTakeOff: number;
  planLanding: number;
  planRamp: number;
  planTakeOff: number;
  reserve: number;
  taxi: number;
}

interface IAlternate {
  burn: number;
  icao: string;
  iata: string;
  transAlt: number;
  transLevel: number;
  averageWindDirection: number;
  averageWindSpeed: number;
}

interface ITimes {
  contFuelTime: number;
  destTimezone: number;
  endurance: number;
  estBlock: number;
  estIn: number;
  estOff: number;
  estOn: number;
  estOut: number;
  estTimeEnroute: number;
  etopsFuelTime: number;
  extraFuelTime: number;
  origTimeZone: number;
  reserveTime: number;
  schedBlock: number;
  schedIn: string;
  schedOff: number;
  schedOn: number;
  schedOut: string;
  schedTimeEnroute: number;
  taxiIn: number;
  taxiOut: number;
}

interface IWeather {
  avgWindDir: number;
  avgWindSpeed: number;
}

interface Files {
  loadsheet: string;
}

export const EmptyISimbriefData = {
  airline: '',
  flightNumber: '',
  aircraftReg: '',
  cruiseAltitude: 0,
  costIndex: '',
  route: '',
  files: { loadsheet: '' },
  origin: {
    iata: '',
    icao: '',
  },
  destination: {
    iata: '',
    icao: '',
  },
  distance: '0nm',
  flightETAInSeconds: '',
  weights: {
    cargo: 0,
    estLandingWeight: 0,
    estTakeOffWeight: 0,
    estZeroFuelWeight: 0,
    maxLandingWeight: 0,
    maxTakeOffWeight: 0,
    maxZeroFuelWeight: 0,
    passengerCount: 0,
    passengerWeight: 0,
    payload: 0,
  },
  fuel: {
    avgFuelFlow: 0,
    contingency: 0,
    enrouteBurn: 0,
    etops: 0,
    extra: 0,
    maxTanks: 0,
    minTakeOff: 0,
    planLanding: 0,
    planRamp: 0,
    planTakeOff: 0,
    reserve: 0,
    taxi: 0,
  },
  units: '',
  alternate: {
    icao: '',
    iata: '',
    burn: 0,
  },
  times: {
    contFuelTime: 0,
    destTimezone: 0,
    endurance: 0,
    estBlock: 0,
    estIn: 0,
    estOff: 0,
    estOn: 0,
    estOut: 0,
    estTimeEnroute: 0,
    etopsFuelTime: 0,
    extraFuelTime: 0,
    origTimeZone: 0,
    reserveTime: 0,
    schedBlock: 0,
    schedIn: '',
    schedOff: 0,
    schedOn: 0,
    schedOut: '',
    schedTimeEnroute: 0,
    taxiIn: 0,
    taxiOut: 0,
  },
  weather: {
    avgWindDir: 0,
    avgWindSpeed: 0,
  },
  ofpLayout: '',
  text: '',
};
