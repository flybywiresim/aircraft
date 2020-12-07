import { ISimbriefData } from "./simbriefInterface";

const simbriefApiUrl: URL = new URL("https://www.simbrief.com/api/xml.fetcher.php");
const simbriefApiParams = simbriefApiUrl.searchParams;

const getRequestData: RequestInit = {
    headers: {
        'Accept': 'application/json'
    },
    method: "GET"
};

export function getSimbriefData(simbriefUsername: string): Promise<ISimbriefData> {
    simbriefApiParams.append("username", simbriefUsername);
    simbriefApiParams.append("json", "1");
    simbriefApiUrl.search = simbriefApiParams.toString();

    return fetch(simbriefApiUrl.toString(), getRequestData).then(result => simbriefDataParser(result.json()));
}

function simbriefDataParser(simbriefJson: any): ISimbriefData {
    const general = simbriefJson.general;
    const origin = simbriefJson.origin;
    const destination = simbriefJson.destination;
    const times = simbriefJson.times;
    const weights = simbriefJson.weights;
    const fuel = simbriefJson.fuel;
    const params = simbriefJson.params;
    const alternate = simbriefJson.alternate;
    return {
        airline: general.icao_airline,
        flightNumber: general.flight_number,
        cruiseAltitude: general.initial_altitude,
        costIndex: general.costindex,
        route: general.route,
        origin: {
            iata: origin.iata_code,
            icao: origin.icao_code
        },
        destination: {
            iata: destination.iata_code,
            icao: destination.icao_code
        },
        distance: general.air_distance + "nm",
        flightETAInSeconds: times.est_time_enroute,
        weights : {
            cargo: weights.cargo,
            estLandingWeight: weights.est_ldw,
            estTakeOffWeight: weights.est_tow,
            estZeroFuelWeight: weights.est_zfw,
            maxLandingWeight: weights.max_ldw,
            maxTakeOffWeight: weights.max_tow,
            maxZeroFuelWeight: weights.max_zfw,
            passengerCount: weights.pax_count,
            passengerWeight: weights.pax_weight,
            payload: weights.payload
        },
        fuel : {
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
            taxi: fuel.taxi
        },
        units: params.units,
        alternate: {
            icao: alternate.icao_code,
            iata: alternate.iata_code,
            burn: alternate.burn
        },
        times: {
            contfuel_time: times.contfuel_time,
            dest_timezone: times.dest_timezone,
            endurance: times.endurance,
            est_block: times.est_block,
            est_in: times.est_in,
            est_off: times.est_off,
            est_on: times.est_on,
            est_out: times.est_out,
            est_time_enroute: times.est_time_enroute,
            etopsfuel_time: times.etopsfuel_time,
            extrafuel_time: times.extrafuel_time,
            orig_timezone: times.orig_timezone,
            reserve_time: times.reserve_time,
            sched_block: times.sched_block,
            sched_in: times.sched_in,
            sched_off: times.sched_off,
            sched_on: times.sched_on,
            sched_out: times.sched_out,
            sched_time_enroute: times.sched_time_enroute,
            taxi_in: times.taxi_in,
            taxi_out: times.taxi_out
        }
    };
};