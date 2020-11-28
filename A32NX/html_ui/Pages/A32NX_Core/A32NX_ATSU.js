const msgSep = "---------------------------[color]white";
const srcMap = {
    "FAA": "faa",
    "IVAO": "ivao",
    "MSFS": "ms",
    "NOAA": "aviationweather",
    "PILOTEDGE": "pilotedge",
    "VATSIM": "vatsim"
};

function wordWrapToStringList(text, maxLength) {
    const result = [];
    let line = [];
    let length = 0;
    text.split(" ").forEach(function (word) {
        if ((length + word.length) >= maxLength) {
            result.push(line.join(" "));
            line = []; length = 0;
        }
        length += word.length + 1;
        line.push(word);
    });
    if (line.length > 0) {
        result.push(line.join(" "));
    }
    return result;
}

function fetchTimeValue() {
    let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
    if (timeValue) {
        const seconds = Number.parseInt(timeValue);
        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
        timeValue = displayTime.toString();
        return timeValue.substring(0, 5);
    }
    return null;
}

const getMETAR = async (icaos, lines, store, updateView) => {
    const storedMetarSrc = NXDataStore.get("CONFIG_METAR_SRC", "MSFS");
    for (const icao of icaos) {
        if (icao !== "") {
            await NXApi.getMetar(icao, srcMap[storedMetarSrc])
                .then((data) => {
                    lines.push(`METAR ${icao}[color]cyan`);
                    const newLines = wordWrapToStringList(data.metar, 25);
                    newLines.forEach(l => lines.push(l.concat("[color]green")));
                    lines.push(msgSep);
                })
                .catch(() => {
                    lines.push(`METAR ${icao}[color]cyan`);
                    lines.push('STATION NOT AVAILABLE[color]amber');
                    lines.push(msgSep);
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getTAF = async (icaos, lines, store, updateView) => {
    const storedTafSrc = NXDataStore.get("CONFIG_TAF_SRC", "NOAA");
    for (const icao of icaos) {
        if (icao !== "") {
            await NXApi.getTaf(icao, srcMap[storedTafSrc])
                .then((data) => {
                    lines.push(`TAF ${icao}[color]cyan`);
                    const newLines = wordWrapToStringList(data.taf, 25);
                    newLines.forEach(l => lines.push(l.concat("[color]green")));
                    lines.push(msgSep);
                })
                .catch(() => {
                    lines.push(`TAF ${icao}[color]cyan`);
                    lines.push('STATION NOT AVAILABLE[color]amber');
                    lines.push(msgSep);
                });
        }
    }
    store["sendStatus"] = "SENT";
    updateView();
};

const getATIS = async (icao, lines, type, store, updateView) => {
    const storedAtisSrc = NXDataStore.get("CONFIG_ATIS_SRC", "FAA");
    if (icao !== "") {
        await NXApi.getAtis(icao, srcMap[storedAtisSrc])
            .then((data) => {
                let atisData;
                switch (type) {
                    case 0:
                        if ("arr" in data) {
                            atisData = data.arr;
                        } else {
                            atisData = data.combined;
                        }
                        break;
                    case 1:
                        if ("dep" in data) {
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
                newLines.forEach(l => lines.push(l.concat("[color]green")));
                lines.push(msgSep);
            })
            .catch(() => {
                lines.push(`ATIS ${icao}[color]cyan`);
                lines.push('D-ATIS NOT AVAILABLE[color]amber');
                lines.push(msgSep);
            });
    }
    store["sendStatus"] = "SENT";
    updateView();
};

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu FMCMainDisplay
 * @param {() => void} updateView
 */
const getSimBriefOfp = (mcdu, updateView) => {
    const simBriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "");

    if (!simBriefUsername) {
        mcdu.showErrorMessage("NO SIMBRIEF USER");
        throw ("No simbrief username provided");
    }

    mcdu.simbrief["sendStatus"] = "REQUESTING";
    updateView();

    return SimBriefApi.getSimBriefOfp(simBriefUsername)
        .then(data => {
            mcdu.simbrief["route"] = data.general.route;
            mcdu.simbrief["cruiseAltitude"] = data.general.initial_altitude;
            mcdu.simbrief["originIcao"] = data.origin.icao_code;
            mcdu.simbrief["destinationIcao"] = data.destination.icao_code;
            mcdu.simbrief["blockFuel"] = data.fuel.plan_ramp;
            mcdu.simbrief["payload"] = data.weights.payload;
            mcdu.simbrief["estZfw"] = data.weights.est_zfw;
            mcdu.simbrief["costIndex"] = data.general.costindex;
            mcdu.simbrief["navlog"] = data.navlog.fix;
            mcdu.simbrief["icao_airline"] = typeof data.general.icao_airline === 'string' ? data.general.icao_airline : "";
            mcdu.simbrief["flight_number"] = data.general.flight_number;
            mcdu.simbrief["alternateIcao"] = data.alternate.icao_code;
            mcdu.simbrief["avgTropopause"] = data.general.avg_tropopause;
            mcdu.simbrief["ete"] = data.times.est_time_enroute;
            mcdu.simbrief["blockTime"] = data.times.est_block;
            mcdu.simbrief["outTime"] = data.times.est_out;
            mcdu.simbrief["onTime"] = data.times.est_on;
            mcdu.simbrief["inTime"] = data.times.est_in;
            mcdu.simbrief["offTime"] = data.times.est_off;
            mcdu.simbrief["taxiFuel"] = data.fuel.taxi;
            mcdu.simbrief["tripFuel"] = data.fuel.enroute_burn;
            mcdu.simbrief["sendStatus"] = "DONE";

            updateView();

            return mcdu.simbrief;
        })
        .catch(_err => {
            console.log(_err.message);

            mcdu.simbrief["sendStatus"] = "READY";
            updateView();
        });
};

/**
 * There are two uplink requests that are made at the same time:
 * - AOC ACT F-PLN
 * - PERF DATA
 */
const insertUplink = (mcdu) => {
    const {
        originIcao,
        destinationIcao,
        cruiseAltitude,
        costIndex,
        alternateIcao,
        avgTropopause,
        icao_airline,
        flight_number
    } = mcdu.simbrief;

    const fromTo = `${originIcao}/${destinationIcao}`;
    const fltNbr = `${icao_airline}${flight_number}`;

    const uplinkInProg = "UPLINK INSERT IN PROG";
    const aocActFplnUplink = "AOC ACT F-PLN UPLINK";
    const perfDataUplink = "PERF DATA UPLINK";

    mcdu.showErrorMessage(uplinkInProg);

    /**
         * AOC ACT F-PLN UPLINK
         * Updates:
         * - From/To
         * - Altn
         * - F-pln
         *
         * TODO:
         * - F-pln (almost done, needs some better error handling)
         */
    mcdu.tryUpdateFromTo(fromTo, async (result) => {
        if (result) {
            CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);

            await mcdu.tryUpdateAltDestination(alternateIcao);

            setTimeout(async () => {
                await uplinkRoute(mcdu);
                mcdu.showErrorMessage(aocActFplnUplink);
            }, mcdu.getDelayRouteChange());

            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }
    });
    mcdu.updateFlightNo(fltNbr, (result) => {
        if (result) {
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }
    });

    /**
         * PERF DATA UPLINK
         * Updates:
         * - CRZ FL
         * - CI
         * - TROPO
         *
         * TODO:
         * - CRZ TEMP
         * - BLOCK
         * - ?
         */
    setTimeout(() => {
        if (mcdu.setCruiseFlightLevelAndTemperature(cruiseAltitude)) {
        }
        if (mcdu.tryUpdateCostIndex(costIndex)) {
        }
        if (mcdu.tryUpdateTropo(avgTropopause)) {
        }
        if (mcdu.page.Current === mcdu.page.InitPageA) {
            CDUInitPage.ShowPage1(mcdu);
        }
    }, mcdu.getDelayHigh());
};

const addWaypointAsync = (mcdu, routeIdent, wpIndex, via) => {
    if (via) {
        return new Promise((res, rej) => {
            mcdu.insertWaypointsAlongAirway(routeIdent, wpIndex, via, (result) => {
                if (result) {
                    console.log("Inserted waypoint: " + routeIdent + " via " + via);
                    res(true);
                } else {
                    console.log('AWY/WPT MISMATCH ' + routeIdent + " via " + via);
                    mcdu.showErrorMessage("AWY/WPT MISMATCH");
                    res(false);
                }
            });
        });
    } else {
        return new Promise((res, rej) => {
            mcdu.getOrSelectWaypointByIdent(routeIdent, (waypoint) => {
                if (waypoint) {
                    mcdu.flightPlanManager.addWaypoint(waypoint.icao, wpIndex, () => {
                        console.log("Inserted waypoint: " + routeIdent);
                        res(true);
                    });
                } else {
                    console.log('NOT IN DATABASE ' + routeIdent);
                    mcdu.showErrorMessage("NOT IN DATABASE");
                    res(false);
                }
            });
        });
    }
};

const uplinkRoute = async (mcdu) => {
    const {navlog, route} = mcdu.simbrief;

    const routeSplit = route.split(' ');
    const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));
    const waypoints = new Set(navlog.filter(fix => fix.type === "wpt").map(fix => fix.ident));

    async function asyncForEach(array, callback) {
        for (let index = 0; index < array.length; index++) {
            await callback(array[index], index, array);
        }
    }

    await asyncForEach(routeSplit, async (routeIdent, i) => {
        console.log('----');
        console.log(routeIdent);
        for (const fix of navlog) {
            if (fix.is_sid_star === "0") {
                if (!procedures.has(routeIdent)) {
                    if (routeIdent.match(/((^[0-9]+[a-z]+)|(^[a-z]+[0-9]+))+[0-9a-z]+$/i) || routeIdent === "DCT") {
                        if (routeIdent === "DCT") {
                            console.log("Direct to waypoint found, skipping");
                            break;
                        } else {
                            const wpIndex = mcdu.flightPlanManager.getWaypointsCount() - 1;
                            console.log("Inserting waypoint: " + routeSplit[i + 1] + " via " + routeIdent + " | " + wpIndex);
                            await addWaypointAsync(mcdu, routeSplit[i + 1], wpIndex, routeIdent);

                            break;
                        }
                    } else {
                        if (waypoints.has(routeIdent)) {
                            const wpIndex = mcdu.flightPlanManager.getWaypointsCount() - 1;
                            console.log("Inserting waypoint: " + routeIdent + " | " + wpIndex);
                            await addWaypointAsync(mcdu, routeIdent, wpIndex);

                            break;
                        }
                    }
                }
            }
        }
    });
};
