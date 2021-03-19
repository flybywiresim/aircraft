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

import { EmptyISimbriefData, ISimbriefData } from './simbriefInterface';

const simbriefApiUrl: URL = new URL('https://www.simbrief.com/api/xml.fetcher.php');
const simbriefApiParams = simbriefApiUrl.searchParams;

// eslint-disable-next-line no-undef
const getRequestData: RequestInit = {
    headers: { Accept: 'application/json' },
    method: 'GET',
};

export function getSimbriefData(simbriefUsername: string): Promise<ISimbriefData> {
    simbriefApiParams.append('username', simbriefUsername);
    simbriefApiParams.append('json', '1');
    simbriefApiUrl.search = simbriefApiParams.toString();

    return fetch(simbriefApiUrl.toString(), getRequestData)
        .then((res) => res.json())
        .then(
            (result: any) => {
                console.info(result);
                return simbriefDataParser(result);
            },
            () => {
                console.log('err');
                return EmptyISimbriefData;
            },
        );
}

function simbriefDataParser(simbriefJson: any): ISimbriefData {
    const { general } = simbriefJson;
    const { origin } = simbriefJson;
    const { aircraft } = simbriefJson;
    const { destination } = simbriefJson;
    const { times } = simbriefJson;
    const { weights } = simbriefJson;
    const { fuel } = simbriefJson;
    const { params } = simbriefJson;
    const { alternate } = simbriefJson;
    const { files } = simbriefJson;
    const { text } = simbriefJson;
    return {
        airline: general.icao_airline,
        flightNumber: general.flight_number,
        aircraftReg: aircraft.reg,
        cruiseAltitude: general.initial_altitude,
        costIndex: general.costindex,
        route: general.route,
        files: { loadsheet: files.pdf.link ? files.directory + files.pdf.link : undefined },
        origin: {
            iata: origin.iata_code,
            icao: origin.icao_code,
        },
        destination: {
            iata: destination.iata_code,
            icao: destination.icao_code,
        },
        distance: `${general.air_distance}nm`,
        flightETAInSeconds: times.est_time_enroute,
        weights: {
            cargo: weights.cargo,
            estLandingWeight: weights.est_ldw,
            estTakeOffWeight: weights.est_tow,
            estZeroFuelWeight: weights.est_zfw,
            maxLandingWeight: weights.max_ldw,
            maxTakeOffWeight: weights.max_tow,
            maxZeroFuelWeight: weights.max_zfw,
            passengerCount: weights.pax_count,
            passengerWeight: weights.pax_weight,
            payload: weights.payload,
        },
        fuel: {
            avgFuelFlow: fuel.avg_fuel_flow,
            contingency: fuel.contingency,
            enrouteBurn: fuel.enroute_burn,
            etops: fuel.etops,
            extra: fuel.extra,
            maxTanks: fuel.max_tanks,
            minTakeOff: fuel.min_takeoff,
            planLanding: fuel.plan_landing,
            planRamp: fuel.plan_ramp,
            planTakeOff: fuel.plan_takeoff,
            reserve: fuel.reserve,
            taxi: fuel.taxi,
        },
        units: params.units,
        alternate: {
            icao: alternate.icao_code,
            iata: alternate.iata_code,
            burn: alternate.burn,
        },
        times: {
            contFuelTime: times.contfuel_time,
            destTimezone: times.dest_timezone,
            endurance: times.endurance,
            estBlock: times.est_block,
            estIn: times.est_in,
            estOff: times.est_off,
            estOn: times.est_on,
            estOut: times.est_out,
            estTimeEnroute: times.est_time_enroute,
            etopsFuelTime: times.etopsfuel_time,
            extraFuelTime: times.extrafuel_time,
            origTimeZone: times.orig_timezone,
            reserveTime: times.reserve_time,
            schedBlock: times.sched_block,
            schedIn: times.sched_in,
            schedOff: times.sched_off,
            schedOn: times.sched_on,
            schedOut: times.sched_out,
            schedTimeEnroute: times.sched_time_enroute,
            taxiIn: times.taxi_in,
            taxiOut: times.taxi_out,
        },
        text: text.plan_html,
    };
}
