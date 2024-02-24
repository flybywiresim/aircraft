// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { AircraftVersionChecker, getAircraftType } from '@flybywiresim/fbw-sdk';
import { ISimbriefData } from './simbriefInterface';

const SIMBRIEF_BASE_URL = 'https://www.simbrief.com/api/xml.fetcher.php';

const getRequestData: RequestInit = {
    headers: { Accept: 'application/json' },
    method: 'GET',
};

export const getSimbriefData = async (navigraphUsername: string, overrideSimbriefID: string): Promise<ISimbriefData> => {
    const simbriefApiUrl = new URL(SIMBRIEF_BASE_URL);
    const simbriefApiParams = simbriefApiUrl.searchParams;

    if (overrideSimbriefID) {
        simbriefApiParams.append('userid', overrideSimbriefID);
    } else {
        simbriefApiParams.append('username', navigraphUsername);
    }

    simbriefApiParams.append('json', '1');

    // Adding the build version to the url parameters to allow Navigraph/Simbrief to track requests from the A32NX
    // The try/catch is there as the a380x build info file cannot be loaded with the current package setup/order and
    // will throw an error - if this is fixed (build_info for a380x is readable from the flyPad for the A380X) then
    // this try/catch could be removed, but it doesn't hurt to have it here even then as an extra safety measure
    try {
        const versionInfo = await AircraftVersionChecker.getBuildInfo(getAircraftType());
        simbriefApiParams.append('client', `fbw-${versionInfo.version}`);
    } catch (e) {
        console.error('Error getting build info', e);
    }

    simbriefApiUrl.search = simbriefApiParams.toString();

    return fetch(simbriefApiUrl.toString(), getRequestData)
        .then((res) => {
            if (!res.ok) {
                return res.json().then((json) => Promise.reject(new Error(json.fetch.status)));
            }
            return res.json().then((json) => simbriefDataParser(json));
        });
};

export const simbriefDataParser = (simbriefJson: any): ISimbriefData => {
    const { general, navlog, origin, aircraft, destination, times, weights, fuel, params, files, text, weather, atc } = simbriefJson;
    const alternate = Array.isArray(simbriefJson.alternate) ? simbriefJson.alternate[0] : simbriefJson.alternate;

    return {
        airline: general.icao_airline,
        flightNumber: general.flight_number,
        callsign: atc.callsign,
        aircraftReg: aircraft.reg,
        cruiseAltitude: general.initial_altitude,
        costIndex: general.costindex,
        route: general.route,
        navlog: navlog.fix,
        files: { loadsheet: files.pdf.link ? files.directory + files.pdf.link : undefined },
        origin: {
            iata: origin.iata_code,
            runway: origin.plan_rwy,
            icao: origin.icao_code,
            name: origin.name,
            posLat: origin.pos_lat,
            posLong: origin.pos_long,
            metar: weather.orig_metar,
            transAlt: parseInt(origin.trans_alt, 10),
            transLevel: parseInt(origin.trans_level, 10),
        },
        destination: {
            iata: destination.iata_code,
            runway: destination.plan_rwy,
            icao: destination.icao_code,
            name: destination.name,
            posLat: destination.pos_lat,
            posLong: destination.pos_long,
            metar: weather.dest_metar,
            transAlt: parseInt(destination.trans_alt, 10),
            transLevel: parseInt(destination.trans_level, 10),
        },
        distance: `${general.air_distance}nm`,
        flightETAInSeconds: times.est_time_enroute,
        averageTropopause: general.avg_tropopause,
        weights: {
            cargo: weights.cargo,
            estLandingWeight: weights.est_ldw,
            estTakeOffWeight: weights.est_tow,
            estZeroFuelWeight: weights.est_zfw,
            maxLandingWeight: weights.max_ldw,
            maxTakeOffWeight: weights.max_tow,
            maxZeroFuelWeight: weights.max_zfw,
            passengerCount: weights.pax_count_actual,
            bagCount: weights.bag_count_actual,
            passengerWeight: weights.pax_weight,
            bagWeight: weights.bag_weight,
            payload: weights.payload,
            freight: weights.freight_added,
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
            transAlt: parseInt(alternate.trans_alt, 10),
            transLevel: parseInt(alternate.trans_level, 10),
            averageWindDirection: parseInt(alternate.avg_wind_dir, 10),
            averageWindSpeed: parseInt(alternate.avg_wind_spd, 10),
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
        weather: {
            avgWindDir: general.avg_wind_dir,
            avgWindSpeed: general.avg_wind_spd,
        },
        text: text.plan_html.replace(/^<div [^>]+>/, '').replace(/<\/div>$/, ''),
    };
};
