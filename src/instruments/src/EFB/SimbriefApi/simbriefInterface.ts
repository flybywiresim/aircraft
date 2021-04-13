/* eslint-disable camelcase */

export interface ISimbriefData {
    origin: IAirportInfo,
    destination: IAirportInfo,
    airline: string,
    flightNumber: string,
    aircraftReg: string,
    cruiseAltitude: number,
    costIndex: number,
    route: string,
    distance: string,
    flightETAInSeconds: string,
    weights: IWeights,
    fuel: IFuel,
    units: string,
    alternate: IAlternate,
    times: ITimes,
    files: Files,
    text: string,
}

interface IAirportInfo {
    icao: string,
    iata: string
}

export interface IWeights {
    cargo: number,
    estLandingWeight: number,
    estTakeOffWeight: number,
    estZeroFuelWeight: number,
    maxLandingWeight: number,
    maxTakeOffWeight: number,
    maxZeroFuelWeight: number,
    passengerCount: number,
    passengerWeight: number,
    payload: number
}

export interface IFuel {
    avgFuelFlow: number,
    contingency: number,
    enrouteBurn: number,
    etops: number,
    extra: number,
    maxTanks: number,
    minTakeOff: number,
    planLanding: number,
    planRamp: number,
    planTakeOff: number,
    reserve: number,
    taxi: number
}

interface IAlternate {
    burn: number,
    icao: string,
    iata: string
}

interface ITimes {
    contfuel_time: number,
    dest_timezone: number,
    endurance: number,
    est_block: number,
    est_in: number,
    est_off: number,
    est_on: number,
    est_out: number,
    est_time_enroute: number,
    etopsfuel_time: number,
    extrafuel_time: number,
    orig_timezone: number,
    reserve_time: number,
    sched_block: number,
    sched_in: string,
    sched_off: number,
    sched_on: number,
    sched_out: string,
    sched_time_enroute: number,
    taxi_in: number,
    taxi_out: number,
}

interface Files {
    loadsheet: string
}
