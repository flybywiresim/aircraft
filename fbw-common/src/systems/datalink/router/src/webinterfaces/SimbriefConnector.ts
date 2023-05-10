//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { AtsuTimestamp, FlightPlanMessage, NotamMessage, FlightPerformanceMessage, FlightFuelMessage, FlightWeightsMessage } from '@datalink/common';
import { NXDataStore } from '@shared/persistence';

const SimbriefUrl = 'https://www.simbrief.com/api/xml.fetcher.php?json=1&userid=';

/* eslint-disable camelcase */
interface IGeneral {
    icao_airline: string,
    flight_number: string,
    is_etops: string,
    constindex: string,
    initial_altitude: string,
    stepclimb_string: string,
    avg_tropopause: string,
    route: string,
    route_ifps: string,
}

interface IAirportNotam {
    notam_id: string,
    location_icao: string,
    date_created: string,
    date_effective: string,
    date_expire: string,
    date_expire_is_estimated: string,
    date_modified: string,
    notam_text: string,
    notam_raw: string,
}

interface IAirport {
    icao_code: string,
    iata_code: string,
    name: string,
    plan_rwy: string,
    trans_alt: string,
    trans_level: string,
    notam: IAirportNotam[],
}

interface IFix {
    ident: string,
    name: string,
    type: string,
    pos_lat: string,
    pos_long: string,
    via_airway: string,
    is_sid_star: string,
}

interface INavigationLog {
    fix: IFix[],
}

interface IEtopsPoint {
    icao_code: string,
    pos_lat_apt: string,
    pos_long_apt: string,
    pos_lat_fix: string,
    pos_long_fix: string,
    elapsed_time: string,
    min_fob: string,
    est_fob: string,
}

interface IEtopsDiversionAirport {
    icao_code: string,
    track_true: string,
    distance: string,
    est_fob: string,
}

interface IEtopsEqualTimePoint {
    pos_lat: string,
    pos_long: string,
    elapsed_time: string,
    min_fob: string,
    est_fob: string,
    etops_condition: string,
    div_time: string,
    div_burn: string,
    critical_fuel: string,
    div_altitude: string,
    div_airport: IEtopsDiversionAirport[],
}

interface IEtopsCriticalPoint {
    fix_type: string,
    pos_lat: string,
    pos_long: string,
    elapsed_time: string,
    est_fob: string,
    critical_fuel: string,
}

interface IEtops {
    rule: string,
    entry: IEtopsPoint,
    exit: IEtopsPoint,
    suitable_airport: IAirport[],
    equal_time_point: IEtopsEqualTimePoint,
    critical_point: IEtopsCriticalPoint,
}

interface IAtc {
    callsign: string,
    fir_orig: string,
    fir_dest: string,
    fir_altn: string,
    fir_etps: string[],
    fir_enroute: string[],
}

interface IFuel {
    taxi: string,
    enroute_burn: string,
    contingency: string,
    alternate_burn: string,
    reserve: string,
    etops: string,
    extra: string,
    min_takeoff: string,
    plan_takeoff: string,
    plan_ramp: string,
    plan_landing: string,
}

interface ITimes {
    est_time_enroute: string,
    sched_time_enroute: string,
    sched_out: string,
    sched_off: string,
    sched_on: string,
    sched_in: string,
    sched_block: string,
    est_out: string,
    est_off: string,
    est_on: string,
    est_in: string,
    est_block: string,
    taxi_out: string,
    taxi_in: string,
    reserve_time: string,
    endurance: string,
    contfuel_time: string,
    etopsfuel_time: string,
    extrafuel_time: string,
}

interface IWeights {
    pax_count: string,
    bag_count: string,
    pax_weight: string,
    bag_weight: string,
    freight_added: string,
    cargo: string,
    payload: string,
    est_zfw: string,
}

interface INotamRecord {
    notam_id: string,
    icao_id: string,
    notam_created_dtg: string,
    notam_effective_dtg: string,
    notam_expire_dtg: string,
    notam_lastmod_dtg: string,
    notam_inserted_dtg: string,
    notam_text: string,
    notam_report: string,
}

interface INotams {
    notamdrec: INotamRecord[],
}

interface IPerformanceImpact {
    time_enroute: string,
    time_difference: string,
    enroute_burn: string,
    burn_difference: string,
    ramp_fuel: string,
    cost_index: string,
}

interface IImpact {
    minus_6000ft?: IPerformanceImpact,
    minus_4000ft?: IPerformanceImpact,
    minus_2000ft?: IPerformanceImpact,
    plus_2000ft?: IPerformanceImpact,
    plus_4000ft?: IPerformanceImpact,
    plus_6000ft?: IPerformanceImpact,
    higher_ci?: IPerformanceImpact,
    lower_ci?: IPerformanceImpact,
    zfw_plus_1000?: IPerformanceImpact,
    zfw_minus_1000?: IPerformanceImpact,
}

interface ICrew {
    cpt: string,
    fo: string,
    dx: string,
    pu: string,
    fa: string[],
}

interface ISimbriefData {
    general: IGeneral,
    origin: IAirport,
    destination: IAirport,
    alternate: IAirport,
    navlog: INavigationLog,
    etops?: IEtops,
    atc: IAtc,
    fuel: IFuel,
    times: ITimes,
    weights: IWeights,
    impacts: IImpact,
    crew: ICrew,
    notams: INotams
}
/* eslint-enable camelcase */

export class SimbriefConnector {
    private static ofpData: ISimbriefData = null;

    private static async receiveData(): Promise<[string, ISimbriefData]> {
        const simBriefUserId = NXDataStore.get('CONFIG_SIMBRIEF_USERID', '');

        if (simBriefUserId) {
            return fetch(`${SimbriefUrl}&userid=${simBriefUserId}`)
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`Simbrief API error: ${response.status}`);
                    }

                    const message = await response.text();
                    const json = await response.json() as ISimbriefData;

                    return [message, json];
                });
        }

        throw new Error('No SimBrief pilot ID provided');
    }

    public static async receiveFlightplan(): Promise<FlightPlanMessage> {
        return SimbriefConnector.receiveData().then(([data, ofp]) => {
            SimbriefConnector.ofpData = ofp;
            const message = new FlightPlanMessage(data);
            message.Flightnumber = ofp.general.icao_airline + ofp.general.flight_number;
            message.Callsign = ofp.atc.callsign;
            message.EstimatedTimeEnroute = parseInt(ofp.times.est_time_enroute);

            /* extract the airport data */
            message.Origin.icao = ofp.origin.icao_code;
            message.Origin.runway = ofp.origin.plan_rwy;
            message.Destination.icao = ofp.destination.icao_code;
            message.Destination.runway = ofp.destination.plan_rwy;
            message.Alternate.icao = ofp.alternate.icao_code;
            message.Alternate.runway = ofp.alternate.plan_rwy;

            /* create the route chunks */
            for (let i = 0; i < ofp.navlog.fix.length; ++i) {
                const lastFix = ofp.navlog.fix[i - 1];
                const fix = ofp.navlog.fix[i];

                if (fix.ident === 'TOC' || fix.ident === 'TOD') {
                    continue;
                }

                const lastChunk = message.RouteChunks[message.RouteChunks.length - 1];

                if (fix.is_sid_star === '1') {
                    if (!lastChunk) {
                        message.RouteChunks.push({ instruction: 'procedure', ident: fix.via_airway });
                    } else if (lastChunk.instruction !== 'procedure') {
                        message.RouteChunks.push({ instruction: 'procedure', ident: fix.via_airway });
                    }
                } else if (lastChunk?.instruction === 'procedure' && lastChunk.ident === fix.via_airway) {
                    message.RouteChunks.push({ instruction: 'sidEnrouteTransition', ident: fix.ident, locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) } });
                } else if (fix.via_airway === 'DCT') {
                    if (fix.type === 'ltlg') {
                        message.RouteChunks.push({ instruction: 'latlong', lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) });
                    } else {
                        message.RouteChunks.push({ instruction: 'waypoint', ident: fix.ident, locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) } });
                    }
                } else if (!(lastChunk && lastChunk.instruction === 'airway' && lastChunk.ident === fix.via_airway)) {
                    if (lastFix && lastChunk && lastChunk.instruction === 'airway' && fix.via_airway !== lastFix.via_airway) {
                        message.RouteChunks.push({ instruction: 'airwayTermination', ident: lastFix.ident });
                    }
                    message.RouteChunks.push({ instruction: 'airway', ident: fix.via_airway, locationHint: { lat: parseFloat(fix.pos_lat), long: parseFloat(fix.pos_long) } });
                } else if (ofp.navlog.fix[i + 1] && ofp.navlog[i + 1].via_airway !== fix.via_airway) {
                    message.RouteChunks.push({ instruction: 'airwayTermination', ident: fix.ident });
                }
            }

            return message;
        });
    }

    private static convertTimestamp(stamp: string): AtsuTimestamp {
        const timestamp = new AtsuTimestamp();

        if (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z$/.test(stamp)) {
            // process: 2023-04-28T10:48:00Z
            timestamp.Year = parseInt(stamp.substring(0, 4));
            timestamp.Month = parseInt(stamp.substring(5, 7));
            timestamp.Day = parseInt(stamp.substring(8, 10));
            const hours = parseInt(stamp.substring(11, 13)) * 3600;
            const minutes = parseInt(stamp.substring(14, 16)) * 60;
            const seconds = parseInt(stamp.substring(17, 19));
            timestamp.Seconds = hours + minutes + seconds;
        } else if (/^[0-9]{12}$/.test(stamp)) {
            // process: 202304141150
            timestamp.Year = parseInt(stamp.substring(0, 4));
            timestamp.Month = parseInt(stamp.substring(4, 6));
            timestamp.Day = parseInt(stamp.substring(6, 8));
            timestamp.Seconds = parseInt(stamp.substring(8, 10)) * 3600 + parseInt(stamp.substring(10, 12)) * 60;
        }

        return timestamp;
    }

    private static convertAirportNotam(notam: IAirportNotam): NotamMessage {
        const converted = new NotamMessage();

        converted.Identifier = notam.notam_id;
        converted.Icao = notam.location_icao;
        converted.Text = notam.notam_text;
        converted.CreatedTimestamp = SimbriefConnector.convertTimestamp(notam.date_created);
        converted.EffectiveTimestamp = SimbriefConnector.convertTimestamp(notam.date_effective);
        converted.ExpireTimestamp = SimbriefConnector.convertTimestamp(notam.date_expire);
        converted.RawMessage = notam.notam_raw;

        return converted;
    }

    private static convertNotamRecord(notam: INotamRecord): NotamMessage {
        const converted = new NotamMessage();

        converted.Identifier = notam.notam_id;
        converted.Icao = notam.icao_id;
        converted.Text = notam.notam_text;
        converted.CreatedTimestamp = SimbriefConnector.convertTimestamp(notam.notam_created_dtg);
        converted.EffectiveTimestamp = SimbriefConnector.convertTimestamp(notam.notam_effective_dtg);
        converted.ExpireTimestamp = SimbriefConnector.convertTimestamp(notam.notam_expire_dtg);
        converted.RawMessage = notam.notam_report;

        return converted;
    }

    public static async receiveNotams(): Promise<NotamMessage[]> {
        if (SimbriefConnector.ofpData === null) await SimbriefConnector.receiveData();

        const notams: NotamMessage[] = [];

        SimbriefConnector.ofpData.origin.notam.forEach((notam) => notams.push(SimbriefConnector.convertAirportNotam(notam)));
        SimbriefConnector.ofpData.destination.notam.forEach((notam) => notams.push(SimbriefConnector.convertAirportNotam(notam)));
        SimbriefConnector.ofpData.alternate.notam.forEach((notam) => notams.push(SimbriefConnector.convertAirportNotam(notam)));

        SimbriefConnector.ofpData.notams.notamdrec.forEach((notam) => {
            const index = notams.findIndex((message) => message.Identifier === notam.notam_id);
            if (index === -1) {
                notams.push(SimbriefConnector.convertNotamRecord(notam));
            }
        });

        return notams;
    }

    public static async receivePerformance(): Promise<FlightPerformanceMessage> {
        if (SimbriefConnector.ofpData === null) await SimbriefConnector.receiveData();

        const performance = new FlightPerformanceMessage();

        performance.CruiseLevel = parseInt(SimbriefConnector.ofpData.general.initial_altitude);
        performance.PlannedCostIndex = parseInt(SimbriefConnector.ofpData.general.constindex);
        performance.TropopauseAltitude = parseInt(SimbriefConnector.ofpData.general.avg_tropopause);
        if (SimbriefConnector.ofpData.impacts.minus_6000ft) {
            performance.CostIndexMinus6000Feet = parseInt(SimbriefConnector.ofpData.impacts.minus_6000ft.cost_index);
        }
        if (SimbriefConnector.ofpData.impacts.minus_4000ft) {
            performance.CostIndexMinus4000Feet = parseInt(SimbriefConnector.ofpData.impacts.minus_4000ft.cost_index);
        }
        if (SimbriefConnector.ofpData.impacts.minus_2000ft) {
            performance.CostIndexMinus2000Feet = parseInt(SimbriefConnector.ofpData.impacts.minus_2000ft.cost_index);
        }
        if (SimbriefConnector.ofpData.impacts.zfw_minus_1000) {
            performance.CostIndexZfwMinus1000 = parseInt(SimbriefConnector.ofpData.impacts.zfw_minus_1000.cost_index);
        }
        if (SimbriefConnector.ofpData.impacts.zfw_plus_1000) {
            performance.CostIndexZfwPlus1000 = parseInt(SimbriefConnector.ofpData.impacts.zfw_plus_1000.cost_index);
        }

        return performance;
    }

    public static async receiveFuel(): Promise<FlightFuelMessage> {
        if (SimbriefConnector.ofpData === null) await SimbriefConnector.receiveData();

        const fuel = new FlightFuelMessage();

        fuel.PlannedRamp = parseInt(SimbriefConnector.ofpData.fuel.plan_ramp);
        fuel.PlannedTakeoff = parseInt(SimbriefConnector.ofpData.fuel.plan_takeoff);
        fuel.PlannedLanding = parseInt(SimbriefConnector.ofpData.fuel.plan_landing);
        fuel.Taxi = parseInt(SimbriefConnector.ofpData.fuel.taxi);
        fuel.Contingency = parseInt(SimbriefConnector.ofpData.fuel.contingency);
        fuel.Enroute = parseInt(SimbriefConnector.ofpData.fuel.enroute_burn);
        fuel.Alternate = parseInt(SimbriefConnector.ofpData.fuel.alternate_burn);
        fuel.Extra = parseInt(SimbriefConnector.ofpData.fuel.extra);
        fuel.MinimumTakeoff = parseInt(SimbriefConnector.ofpData.fuel.min_takeoff);

        return fuel;
    }

    public static async receiveWeights(): Promise<FlightWeightsMessage> {
        if (SimbriefConnector.ofpData === null) await SimbriefConnector.receiveData();

        const weights = new FlightWeightsMessage();

        weights.CockpitCrewCount = 1;
        if (SimbriefConnector.ofpData.crew.fo !== '') weights.CockpitCrewCount += 1;
        if (SimbriefConnector.ofpData.crew.dx !== '') weights.CockpitCrewCount += 1;
        if (SimbriefConnector.ofpData.crew.pu !== '') weights.CockpitCrewCount += 1;

        weights.FlightAttendantCount = SimbriefConnector.ofpData.crew.fa.length;
        weights.PaxCount = parseInt(SimbriefConnector.ofpData.weights.pax_count);
        weights.PaxWeight = parseInt(SimbriefConnector.ofpData.weights.pax_weight);
        weights.BagCount = parseInt(SimbriefConnector.ofpData.weights.bag_count);
        weights.BagWeight = parseInt(SimbriefConnector.ofpData.weights.bag_weight);
        weights.Cargo = parseInt(SimbriefConnector.ofpData.weights.cargo);
        weights.Payload = parseInt(SimbriefConnector.ofpData.weights.payload);
        weights.EstimatedZeroFuelWeight = parseInt(SimbriefConnector.ofpData.weights.est_zfw);

        return weights;
    }
}
