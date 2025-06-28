// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getSimbriefData } from '../../Apis/Simbrief';
import { IFuel, IWeights } from '../../Apis/Simbrief/simbriefInterface';

import { store, RootState } from '../store';

export interface SimbriefData {
  departingAirport: string;
  departingRunway: string;
  departingIata: string;
  departingName: string;
  departingPosLat: number;
  departingPosLong: number;
  departingMetar: string;
  arrivingAirport: string;
  arrivingRunway: string;
  arrivingIata: string;
  arrivingName: string;
  arrivingPosLat: number;
  arrivingPosLong: number;
  arrivingMetar: string;
  flightDistance: string;
  flightETAInSeconds: string;
  cruiseAltitude: number;
  weights: IWeights;
  fuels: IFuel;
  weather: {
    avgWindDir: string;
    avgWindSpeed: string;
  };
  units: string;
  altIcao?: string;
  altIata?: string;
  altBurn?: number;
  tripTime: number;
  contFuelTime: number;
  resFuelTime: number;
  taxiOutTime: number;
  schedOut: string;
  schedIn: string;
  airline: string;
  flightNum: string;
  aircraftReg: string;
  aircraftIcao: string;
  route: string;
  ofpLayout: string;
  loadsheet: string;
  costInd: string;
}

export const initialState: {
  data: SimbriefData;
  simbriefDataPending: boolean;
  payloadImported: boolean;
  fuelImported: boolean;
  toastPresented: boolean;
} = {
  data: {
    airline: '',
    flightNum: '',
    departingAirport: '',
    departingRunway: '',
    departingIata: '',
    departingName: '',
    departingPosLat: 0,
    departingPosLong: 0,
    departingMetar: '',
    arrivingAirport: '',
    arrivingRunway: '',
    arrivingIata: '',
    arrivingName: '',
    arrivingPosLat: 0,
    arrivingPosLong: 0,
    arrivingMetar: '',
    aircraftIcao: '',
    aircraftReg: '',
    flightDistance: '',
    route: '',
    flightETAInSeconds: '',
    cruiseAltitude: 0,
    weights: {
      cargo: '0',
      estLandingWeight: '0',
      estTakeOffWeight: '0',
      estZeroFuelWeight: '0',
      maxLandingWeight: '0',
      maxTakeOffWeight: '0',
      maxZeroFuelWeight: '0',
      bagCount: '0',
      passengerCount: '0',
      passengerWeight: '0',
      bagWeight: '0',
      payload: '0',
      freight: '0',
    },
    fuels: {
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
    weather: {
      avgWindDir: '',
      avgWindSpeed: '',
    },
    units: '',
    altIcao: '',
    altIata: '',
    altBurn: 0,
    tripTime: 0,
    contFuelTime: 0,
    resFuelTime: 0,
    taxiOutTime: 0,
    schedIn: '',
    schedOut: '',
    ofpLayout: '',
    loadsheet: '',
    costInd: '',
  },
  payloadImported: false,
  fuelImported: false,
  toastPresented: false,
  simbriefDataPending: false,
};

export const simbriefSlice = createSlice({
  name: 'simBrief',
  initialState,
  reducers: {
    setSimbriefData: (state, action: PayloadAction<SimbriefData>) => {
      state.data = action.payload;
    },
    setSimbriefDataPending: (state, action: PayloadAction<boolean>) => {
      state.simbriefDataPending = action.payload;
    },
    setPayloadImported: (state, action: PayloadAction<boolean>) => {
      state.payloadImported = action.payload;
    },
    setFuelImported: (state, action: PayloadAction<boolean>) => {
      state.fuelImported = action.payload;
    },
    setToastPresented: (state, action: PayloadAction<boolean>) => {
      state.toastPresented = action.payload;
    },
  },
});

export async function fetchSimbriefDataAction(
  navigraphUsername: string,
  overrideSimbriefID: string,
): Promise<PayloadAction<SimbriefData>> {
  const returnedSimbriefData = await getSimbriefData(navigraphUsername, overrideSimbriefID);

  return setSimbriefData({
    airline: typeof returnedSimbriefData.airline === 'string' ? returnedSimbriefData.airline : '',
    flightNum: returnedSimbriefData.flightNumber,
    departingAirport: returnedSimbriefData.origin.icao,
    departingRunway: returnedSimbriefData.origin.runway,
    departingIata: returnedSimbriefData.origin.iata,
    departingName: returnedSimbriefData.origin.name,
    departingPosLat: returnedSimbriefData.origin.posLat,
    departingPosLong: returnedSimbriefData.origin.posLong,
    departingMetar: returnedSimbriefData.origin.metar,
    arrivingAirport: returnedSimbriefData.destination.icao,
    arrivingRunway: returnedSimbriefData.destination.runway,
    arrivingIata: returnedSimbriefData.destination.iata,
    arrivingName: returnedSimbriefData.destination.name,
    arrivingPosLat: returnedSimbriefData.destination.posLat,
    arrivingPosLong: returnedSimbriefData.destination.posLong,
    arrivingMetar: returnedSimbriefData.destination.metar,
    aircraftReg: returnedSimbriefData.aircraftReg,
    aircraftIcao: returnedSimbriefData.aircraftIcao,
    flightDistance: returnedSimbriefData.distance,
    flightETAInSeconds: returnedSimbriefData.flightETAInSeconds,
    cruiseAltitude: returnedSimbriefData.cruiseAltitude,
    route: returnedSimbriefData.route,
    weights: {
      cargo: returnedSimbriefData.weights.cargo,
      estLandingWeight: returnedSimbriefData.weights.estLandingWeight,
      estTakeOffWeight: returnedSimbriefData.weights.estTakeOffWeight,
      estZeroFuelWeight: returnedSimbriefData.weights.estZeroFuelWeight,
      maxLandingWeight: returnedSimbriefData.weights.maxLandingWeight,
      maxTakeOffWeight: returnedSimbriefData.weights.maxTakeOffWeight,
      maxZeroFuelWeight: returnedSimbriefData.weights.maxZeroFuelWeight,
      passengerCount: returnedSimbriefData.weights.passengerCount,
      bagCount: returnedSimbriefData.weights.bagCount,
      passengerWeight: returnedSimbriefData.weights.passengerWeight,
      bagWeight: returnedSimbriefData.weights.bagWeight,
      payload: returnedSimbriefData.weights.payload,
      freight: returnedSimbriefData.weights.freight,
    },
    fuels: {
      avgFuelFlow: returnedSimbriefData.fuel.avgFuelFlow,
      contingency: returnedSimbriefData.fuel.contingency,
      enrouteBurn: returnedSimbriefData.fuel.enrouteBurn,
      etops: returnedSimbriefData.fuel.etops,
      extra: returnedSimbriefData.fuel.extra,
      maxTanks: returnedSimbriefData.fuel.maxTanks,
      minTakeOff: returnedSimbriefData.fuel.minTakeOff,
      planLanding: returnedSimbriefData.fuel.planLanding,
      planRamp: returnedSimbriefData.fuel.planRamp,
      planTakeOff: returnedSimbriefData.fuel.planTakeOff,
      reserve: returnedSimbriefData.fuel.reserve,
      taxi: returnedSimbriefData.fuel.taxi,
    },
    weather: {
      avgWindDir: returnedSimbriefData.weather.avgWindDir.toString(),
      avgWindSpeed: returnedSimbriefData.weather.avgWindSpeed.toString(),
    },
    units: returnedSimbriefData.units,
    altIcao: returnedSimbriefData.alternate.icao,
    altIata: returnedSimbriefData.alternate.iata,
    altBurn: returnedSimbriefData.alternate.burn,
    tripTime: returnedSimbriefData.times.estTimeEnroute,
    contFuelTime: returnedSimbriefData.times.contFuelTime,
    resFuelTime: returnedSimbriefData.times.reserveTime,
    taxiOutTime: returnedSimbriefData.times.taxiOut,
    schedOut: returnedSimbriefData.times.schedOut,
    schedIn: returnedSimbriefData.times.schedIn,
    ofpLayout: returnedSimbriefData.ofpLayout,
    loadsheet: returnedSimbriefData.text,
    costInd: returnedSimbriefData.costIndex,
  });
}

/**
 * @returns Whether or not the SimBrief data has been altered from its original state
 */
export const isSimbriefDataLoaded = (): boolean =>
  JSON.stringify((store.getState() as RootState).simbrief.data) !== JSON.stringify(initialState.data);

export const { setSimbriefData, setSimbriefDataPending, setPayloadImported, setFuelImported, setToastPresented } =
  simbriefSlice.actions;

export default simbriefSlice.reducer;
