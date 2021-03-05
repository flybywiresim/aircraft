/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

export interface ISimbriefData {
    origin: IAirportInfo,
    destination: IAirportInfo,
    airline: string,
    flightNumber: string,
    aircraftReg: string,
    cruiseAltitude: number,
    costIndex: string,
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
