/* eslint-disable no-await-in-loop */
/* eslint-disable camelcase */
/* global Avionics */
import { NXFictionalMessages, NXSystemMessages } from '@fmgc/lib/NXSystemMessages';
import { SimBriefApi } from '@shared/SimBriefApi';
import { NXApi } from '@fmgc/utils/NXApi';
import { NXDataStore } from '@shared/persistence';
// TODO: Migrate properties to camel case

const msgSep = '---------------------------[color]white';
const srcMap = {
    FAA: 'faa',
    IVAO: 'ivao',
    MSFS: 'ms',
    NOAA: 'aviationweather',
    PILOTEDGE: 'pilotedge',
    VATSIM: 'vatsim',
};

export const wordWrapToStringList = (text: string, maxLength: number) => {
    const result = [];
    let line = [];
    let length = 0;
    text.split(' ').forEach((word: string | any[]) => {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(' '));
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });
    if (line.length > 0) {
        result.push(line.join(' '));
    }
    return result;
};

export const fetchTimeValue = () => {
    let timeValue = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
    if (timeValue) {
        const seconds = Number.parseInt(timeValue);
        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
        timeValue = displayTime.toString();
        return timeValue.substring(0, 5);
    }
    return null;
};

export const getMETAR = async (icaos: any, lines: string[], updateView: () => void) => {
    const storedMetarSrc = NXDataStore.get('CONFIG_METAR_SRC', 'MSFS');
    for (const icao of icaos) {
        if (icao !== '') {
            await NXApi.getMetar(icao, srcMap[storedMetarSrc])
                .then((data: { metar: any; }) => {
                    lines.push(`METAR ${icao}[color]cyan`);
                    const newLines = wordWrapToStringList(data.metar, 25);
                    newLines.forEach((l) => lines.push(l.concat('[color]green')));
                    lines.push(msgSep);
                })
                .catch(() => {
                    lines.push(`METAR ${icao}[color]cyan`);
                    lines.push('STATION NOT AVAILABLE[color]amber');
                    lines.push(msgSep);
                });
        }
    }
    updateView();
};

export const getTAF = async (icaos: any, lines: string[], updateView: () => void) => {
    const storedTafSrc = NXDataStore.get('CONFIG_TAF_SRC', 'NOAA');
    for (const icao of icaos) {
        if (icao !== '') {
            await NXApi.getTaf(icao, srcMap[storedTafSrc])
                .then((data: { taf: any; }) => {
                    lines.push(`TAF ${icao}[color]cyan`);
                    const newLines = wordWrapToStringList(data.taf, 25);
                    newLines.forEach((l) => lines.push(l.concat('[color]green')));
                    lines.push(msgSep);
                })
                .catch(() => {
                    lines.push(`TAF ${icao}[color]cyan`);
                    lines.push('STATION NOT AVAILABLE[color]amber');
                    lines.push(msgSep);
                });
        }
    }
    updateView();
};

export const getATIS = async (icao: string, lines: string[], type: any, store: { sendStatus: string; }, updateView: () => void) => {
    const storedAtisSrc = NXDataStore.get('CONFIG_ATIS_SRC', 'FAA');
    if (icao !== '') {
        await NXApi.getAtis(icao, srcMap[storedAtisSrc])
            .then((data: { arr: any; combined: any; dep: any; }) => {
                let atisData: any;
                switch (type) {
                case 0:
                    if ('arr' in data) {
                        atisData = data.arr;
                    } else {
                        atisData = data.combined;
                    }
                    break;
                case 1:
                    if ('dep' in data) {
                        atisData = data.dep;
                    } else {
                        atisData = data.combined;
                    }
                    break;
                default:
                    atisData = data.combined;
                }
                lines.push(`ATIS ${icao}[color]cyan`);
                const newLines = wordWrapToStringList(atisData, 25);
                newLines.forEach((l) => lines.push(l.concat('[color]green')));
                lines.push(msgSep);
            })
            .catch(() => {
                lines.push(`ATIS ${icao}[color]cyan`);
                lines.push('D-ATIS NOT AVAILABLE[color]amber');
                lines.push(msgSep);
            });
    }
    store.sendStatus = 'SENT';
    updateView();
};

/**
 *  Converts lbs to kg
 * @param {string | number} value
 */
const lbsToKg = (value: string | number) => (+value * 0.453592).toString();

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu FMCMainDisplay
 * @param {() => void} updateView
 */
export const getSimBriefOfp = (
    mcdu: {
         addNewMessage: (arg0: any) => void;
        simbrief: {
            sendStatus: string;
            units: string;
            route: any;
            cruiseAltitude: any;
            originIcao: any;
            destinationIcao: any;
            blockFuel: any;
            payload: any;
            estZfw: any;
            paxCount: any;
            paxWeight: any;
            cargo: any;
            costIndex: any;
            navlog: any;
            // eslint-disable-next-line camelcase
            icao_airline: any;
            // eslint-disable-next-line camelcase
            flight_number: any;
            alternateIcao: any;
            avgTropopause: any;
            ete: any;
            blockTime: any;
            outTime: any;
            onTime: any;
            inTime: any;
            offTime: any;
            taxiFuel: any;
            tripFuel: any;
        };
    },
    updateView: () => void,
) => {
    const simBriefUserId = NXDataStore.get('CONFIG_SIMBRIEF_USERID', '');

    if (!simBriefUserId) {
        mcdu.addNewMessage(NXFictionalMessages.noSimBriefUser);
        throw new Error('No SimBrief pilot ID provided');
    }

    mcdu.simbrief.sendStatus = 'REQUESTING';
    updateView();

    return SimBriefApi.getSimBriefOfp(simBriefUserId)
        .then((
            data: {
                params: { units: any; };
                general: {
                    route: any;
                    initial_altitude: any;
                    costindex: any;
                    icao_airline: any;
                    flight_number: any;
                    avg_tropopause: any;
                };
                origin: { icao_code: any; };
                destination: { icao_code: any; };
                fuel: { plan_ramp: any; taxi: any; enroute_burn: any; };
                weights: { payload: any; est_zfw: any; pax_count: any; pax_weight: any; cargo: any; };
                navlog: { fix: any; }; alternate: { icao_code: any; };
                times: { est_time_enroute: any; est_block: any; est_out: any; est_on: any; est_in: any; est_off: any; }; },
        ) => {
            mcdu.simbrief.units = data.params.units;
            mcdu.simbrief.route = data.general.route;
            mcdu.simbrief.cruiseAltitude = data.general.initial_altitude;
            mcdu.simbrief.originIcao = data.origin.icao_code;
            mcdu.simbrief.destinationIcao = data.destination.icao_code;
            mcdu.simbrief.blockFuel = mcdu.simbrief.units === 'kgs' ? data.fuel.plan_ramp : lbsToKg(data.fuel.plan_ramp);
            mcdu.simbrief.payload = mcdu.simbrief.units === 'kgs' ? data.weights.payload : lbsToKg(data.weights.payload);
            mcdu.simbrief.estZfw = mcdu.simbrief.units === 'kgs' ? data.weights.est_zfw : lbsToKg(data.weights.est_zfw);
            mcdu.simbrief.paxCount = data.weights.pax_count;
            mcdu.simbrief.paxWeight = mcdu.simbrief.units === 'kgs' ? data.weights.pax_weight : lbsToKg(data.weights.pax_weight);
            mcdu.simbrief.cargo = mcdu.simbrief.units === 'kgs' ? data.weights.cargo : lbsToKg(data.weights.cargo);
            mcdu.simbrief.costIndex = data.general.costindex;
            mcdu.simbrief.navlog = data.navlog.fix;
            mcdu.simbrief.icao_airline = typeof data.general.icao_airline === 'string' ? data.general.icao_airline : '';
            mcdu.simbrief.flight_number = data.general.flight_number;
            mcdu.simbrief.alternateIcao = data.alternate.icao_code;
            mcdu.simbrief.avgTropopause = data.general.avg_tropopause;
            mcdu.simbrief.ete = data.times.est_time_enroute;
            mcdu.simbrief.blockTime = data.times.est_block;
            mcdu.simbrief.outTime = data.times.est_out;
            mcdu.simbrief.onTime = data.times.est_on;
            mcdu.simbrief.inTime = data.times.est_in;
            mcdu.simbrief.offTime = data.times.est_off;
            mcdu.simbrief.taxiFuel = mcdu.simbrief.units === 'kgs' ? data.fuel.taxi : lbsToKg(data.fuel.taxi);
            mcdu.simbrief.tripFuel = mcdu.simbrief.units === 'kgs' ? data.fuel.enroute_burn : lbsToKg(data.fuel.enroute_burn);
            mcdu.simbrief.sendStatus = 'DONE';

            updateView();

            return mcdu.simbrief;
        })
        .catch((_err: { message: any; }) => {
            console.log(_err.message);

            mcdu.simbrief.sendStatus = 'READY';
            updateView();
        });
};

export const getSimBriefUser = (value: any, mcdu: { sendDataToScratchpad: (arg0: any) => void; addNewMessage: (arg0: any) => void; }, updateView: () => void) => {
    if (!value) {
        throw new Error('No SimBrief username/pilot ID provided');
    }

    SimBriefApi.getSimBriefUser(value)
        .then((data: { fetch: { status: string; userid: any; }; }) => {
            if (data.fetch.status === 'Error: Unknown UserID') {
                mcdu.sendDataToScratchpad(value);
                mcdu.addNewMessage(NXFictionalMessages.noSimBriefUser);
            } else {
                NXDataStore.set('CONFIG_SIMBRIEF_USERID', data.fetch.userid);
            }

            updateView();
        })
        .catch((_err: { message: any; }) => {
            console.log(_err.message);
            updateView();
        });
};

/**
 * There are two uplink requests that are made at the same time:
 * - AOC ACT F-PLN
 * - PERF DATA
 */
export const insertUplink = (
    mcdu: {
        simbrief: {
            originIcao: any;
            destinationIcao: any;
            cruiseAltitude: any;
            costIndex: any;
            alternateIcao: any;
            avgTropopause: any;
            icao_airline: any;
            flight_number: any; };
        addNewMessage: (arg0: any) => void;
        tryUpdateFromTo: (arg0: string, arg1: (result: any) => Promise<void>) => void;
        tryUpdateAltDestination: (arg0: any) => any;
        getDelayRouteChange: () => number;
        page: { Current: any; InitPageA: any; };
        updateFlightNo: (arg0: string, arg1: (result: any) => void) => void;
        setCruiseFlightLevelAndTemperature: (arg0: any) => void;
        tryUpdateCostIndex: (arg0: any) => void;
        tryUpdateTropo: (arg0: any) => void;
        getDelayHigh: () => number; },
) => {
    const {
        originIcao,
        destinationIcao,
        cruiseAltitude,
        costIndex,
        alternateIcao,
        avgTropopause,
        icao_airline,
        flight_number,
    } = mcdu.simbrief;

    const fromTo = `${originIcao}/${destinationIcao}`;
    const fltNbr = `${icao_airline}${flight_number}`;

    mcdu.addNewMessage(NXSystemMessages.uplinkInsertInProg);

    /**
     * AOC ACT F-PLN UPLINK
     */
    mcdu.tryUpdateFromTo(fromTo, async (result: any) => {
        if (result) {
            // FIXME: Fix this
            // CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
            // CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);

            await mcdu.tryUpdateAltDestination(alternateIcao);

            setTimeout(async () => {
                await uplinkRoute(mcdu as any);
                mcdu.addNewMessage(NXSystemMessages.aocActFplnUplink);
            }, mcdu.getDelayRouteChange());

            if (mcdu.page.Current === mcdu.page.InitPageA) {
                // FIXME: Fix this
                // CDUInitPage.ShowPage1(mcdu);
            }
        }
    });
    mcdu.updateFlightNo(fltNbr, (result: any) => {
        if (result) {
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                // FIXME: Fix this
                // CDUInitPage.ShowPage1(mcdu);
            }
        }
    });

    /**
     * INIT PAGE DATA UPLINK
    */
    setTimeout(() => {
        mcdu.setCruiseFlightLevelAndTemperature(cruiseAltitude);
        mcdu.tryUpdateCostIndex(costIndex);
        mcdu.tryUpdateTropo(avgTropopause);
        if (mcdu.page.Current === mcdu.page.InitPageA) {
            // FIXME: Fix this
            // CDUInitPage.ShowPage1(mcdu);
        }
    }, mcdu.getDelayHigh());
};

export const addWaypointAsync = (
    fix: { pos_lat: any; pos_long: any; },
    mcdu: {
        flightPlanManager: {
            getWaypointsCount: () => number;
            addWaypoint: (arg0: any, arg1: number, arg2: () => void) => void;
        };
        insertWaypointsAlongAirway: (arg0: any, arg1: number, arg2: any, arg3: (result: any) => void) => void;
        addNewMessage: (arg0: any) => void;
    },
    routeIdent: any,
    via?: any,
) => {
    const wpIndex = mcdu.flightPlanManager.getWaypointsCount() - 1;
    if (via) {
        return new Promise((res) => {
            mcdu.insertWaypointsAlongAirway(routeIdent, wpIndex, via, (result: any) => {
                if (result) {
                    console.log(`Inserted waypoint: ${routeIdent} via ${via}`);
                    res(true);
                } else {
                    console.log(`AWY/WPT MISMATCH ${routeIdent} via ${via}`);
                    mcdu.addNewMessage(NXSystemMessages.awyWptMismatch);
                    res(false);
                }
            });
        });
    }
    return new Promise((res) => {
        const coords = {
            lat: fix.pos_lat,
            long: fix.pos_long,
        };
        getWaypointByIdentAndCoords(mcdu as any, routeIdent, coords, (waypoint: { icao: any; }) => {
            if (waypoint) {
                mcdu.flightPlanManager.addWaypoint(waypoint.icao, wpIndex, () => {
                    console.log(`Inserted waypoint: ${routeIdent}`);
                    res(true);
                });
            } else {
                console.log(`NOT IN DATABASE ${routeIdent}`);
                mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                res(false);
            }
        });
    });
};

const uplinkRoute = async (mcdu: { simbrief: { navlog: any; }; }) => {
    const { navlog } = mcdu.simbrief;

    const procedures = new Set(navlog.filter((fix: { is_sid_star: string; }) => fix.is_sid_star === '1').map((fix: { via_airway: any; }) => fix.via_airway));

    for (let i = 0; i < navlog.length; i++) {
        const fix = navlog[i];
        const nextFix = navlog[i + 1];

        if (fix.is_sid_star === '1') {
            continue;
        }
        if (['TOP OF CLIMB', 'TOP OF DESCENT'].includes(fix.name)) {
            continue;
        }

        console.log(`---- ${fix.ident} ----`);

        // Last SID fix - either it's airway is in the list of procedures, or
        // this is the very first fix in the route (to deal with procedures
        // that only have an exit fix, which won't be caught when filtering)
        if (procedures.has(fix.via_airway) || (i === 0)) {
            console.log(`Inserting waypoint last of DEP: ${fix.ident}`);
            await addWaypointAsync(fix, mcdu as any, fix.ident);
            continue;
        } else {
            if (fix.via_airway === 'DCT') {
                console.log(`Inserting waypoint: ${fix.ident}`);
                await addWaypointAsync(fix, mcdu as any, fix.ident);
                continue;
            }
            if (nextFix.via_airway !== fix.via_airway) {
                // last fix of airway
                console.log(`Inserting waypoint: ${fix.ident} via ${fix.via_airway}`);
                await addWaypointAsync(fix, mcdu as any, fix.ident, fix.via_airway);
                continue;
            }
        }
    }
};

/**
 * Convert unsupported coordinate formats in a waypoint ident to supported ones
 * @param {string} ident Waypoint ident
 */
function convertWaypointIdentCoords(ident: string) {
    // SimBrief formats coordinate waypoints differently to MSFS:
    //  - 60N045W = 60* 00'N 045* 00'W
    //  - 3050N12022W = 30* 50'N 120* 22'W
    // We can't represent the second format precisely enough, so leave this
    // case alone so we don't insert inaccurate waypoints, and rearrange the
    // first one into the format MSFS needs (6045N).
    let latDeg: string;
    let latDir: any;
    let lonDeg: string;
    let lonDir: any;

    if (ident.length === 7) {
        latDeg = ident.substring(0, 2);
        latDir = ident.substring(2, 3);
        lonDeg = ident.substring(3, 6);
        lonDir = ident.substring(6, 7);
    } else {
        return ident;
    }

    if (Number.isNaN(parseInt(latDeg)) || Number.isNaN(parseInt(lonDeg))) {
        return ident;
    }

    // ARINC 424 format is either xxyyZ or xxZyy, where xx is 2 digit lat, yy
    // is last 2 digits of lon, and Z is N/E/S/W respectively for NW/NE/SE/SW,
    // and is at the end if lat was less than 100 or in the middle if 100 or
    // greater.
    const largeLon = lonDeg.substring(0, 1) === '1';
    const lonSub = lonDeg.substring(1, 3);
    switch (latDir + lonDir) {
    case 'NW':
        return latDeg + (largeLon ? (`N${lonSub}`) : (`${lonSub}N`));
    case 'NE':
        return latDeg + (largeLon ? (`E${lonSub}`) : (`${lonSub}E`));
    case 'SE':
        return latDeg + (largeLon ? (`S${lonSub}`) : (`${lonSub}S`));
    case 'SW':
        return latDeg + (largeLon ? (`W${lonSub}`) : (`${lonSub}W`));
    default:
        return ident;
    }
}

/**
 * Get the waypoint by ident and coords within the threshold
 * @param {string} ident Waypoint ident
 * @param {object} coords Waypoint coords
 * @param {function} callback Return waypoint
 */
export const getWaypointByIdentAndCoords = (
    mcdu: { dataManager: { GetWaypointsByIdent: (arg0: any) => Promise<any>; }; },
    ident: any,
    coords: { lat: any; long: any; },
    callback: { (waypoint: any): void; (arg0: any): any; },
) => {
    const DISTANCE_THRESHOLD = 1;
    ident = convertWaypointIdentCoords(ident);
    mcdu.dataManager.GetWaypointsByIdent(ident).then((waypoints: string | any[]) => {
        if (!waypoints || waypoints.length === 0) {
            return callback(undefined);
        }

        for (const waypoint of waypoints) {
            const distanceToTarget = Avionics.Utils.computeGreatCircleDistance(coords, waypoint.infos.coordinates);
            if (distanceToTarget < DISTANCE_THRESHOLD) {
                return callback(waypoint);
            }
        }

        return callback(undefined);
    });
};
