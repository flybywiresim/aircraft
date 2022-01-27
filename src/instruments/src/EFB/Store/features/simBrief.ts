import { createSlice } from '@reduxjs/toolkit';
import { getSimbriefData } from '../../SimbriefApi';
import { IFuel, IWeights } from '../../SimbriefApi/simbriefInterface';

import { TypedAction } from '../store';

export interface SimbriefData {
    departingAirport: string;
    departingRunway: string;
    departingIata: string;
    departingName: string;
    departingPosLat: number;
    departingPosLong: number;
    arrivingAirport: string;
    arrivingRunway: string;
    arrivingIata: string;
    arrivingName: string;
    arrivingPosLat: number;
    arrivingPosLong: number;
    flightDistance: string;
    flightETAInSeconds: string;
    cruiseAltitude: number;
    weights: IWeights;
    fuels: IFuel;
    weather: {
        avgWindDir: string;
        avgWindSpeed: string;
    }
    units: string;
    altIcao: string;
    altIata: string;
    altBurn: number;
    tripTime: number;
    contFuelTime: number;
    resFuelTime: number;
    taxiOutTime: number;
    schedOut: string;
    schedIn: string;
    airline: string;
    flightNum: string;
    aircraftReg: string;
    route: string;
    loadsheet: string;
    costInd: string;
}

export const initialState: {data: SimbriefData} = {
    data: {
        airline: '',
        flightNum: '',
        departingAirport: '',
        departingRunway: '',
        departingIata: '',
        departingName: '',
        departingPosLat: 0,
        departingPosLong: 0,
        arrivingAirport: '',
        arrivingRunway: '',
        arrivingIata: '',
        arrivingName: '',
        arrivingPosLat: 0,
        arrivingPosLong: 0,
        aircraftReg: '',
        flightDistance: '',
        route: '',
        flightETAInSeconds: '',
        cruiseAltitude: 0,
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
        loadsheet: '',
        costInd: '',
    },
};

export const simBriefSlice = createSlice({
    name: 'simBrief',
    initialState,
    reducers: {
        setSimbriefData: (state, action: TypedAction<SimbriefData>) => {
            state.data = action.payload;
        },
    },
});

export async function fetchSimbriefDataAction(simbriefUserId: string): Promise<TypedAction<SimbriefData>> {
    const returnedSimbriefData = await getSimbriefData(simbriefUserId);

    if (simbriefUserId) {
        return setSimbriefData({
            airline: returnedSimbriefData.airline,
            flightNum: returnedSimbriefData.flightNumber,
            departingAirport: returnedSimbriefData.origin.icao,
            departingRunway: returnedSimbriefData.origin.runway,
            departingIata: returnedSimbriefData.origin.iata,
            departingName: returnedSimbriefData.origin.name,
            departingPosLat: returnedSimbriefData.origin.posLat,
            departingPosLong: returnedSimbriefData.origin.posLong,
            arrivingAirport: returnedSimbriefData.destination.icao,
            arrivingRunway: returnedSimbriefData.destination.runway,
            arrivingIata: returnedSimbriefData.destination.iata,
            arrivingName: returnedSimbriefData.destination.name,
            arrivingPosLat: returnedSimbriefData.destination.posLat,
            arrivingPosLong: returnedSimbriefData.destination.posLong,
            aircraftReg: returnedSimbriefData.aircraftReg,
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
                passengerWeight: returnedSimbriefData.weights.passengerWeight,
                payload: returnedSimbriefData.weights.payload,
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
            loadsheet: returnedSimbriefData.text,
            costInd: returnedSimbriefData.costIndex,
        });
    }

    return {
        type: 'SET_SIMBRIEF_DATA',
        payload: {} as SimbriefData,
    };
}

export const { setSimbriefData } = simBriefSlice.actions;

export default simBriefSlice.reducer;
