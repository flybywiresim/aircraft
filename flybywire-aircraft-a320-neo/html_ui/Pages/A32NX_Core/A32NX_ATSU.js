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

const getMETAR = async (icaos, lines, updateView) => {
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
    updateView();
};

const getTAF = async (icaos, lines, updateView) => {
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
 *  Converts lbs to kg
 * @param {string | number} value
 */
const lbsToKg = (value) => {
    return (+value * 0.453592).toString();
};

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu FMCMainDisplay
 * @param {() => void} updateView
 */
const getSimBriefOfp = (mcdu, updateView, callback = () => {}) => {
    const simBriefUserId = NXDataStore.get("CONFIG_SIMBRIEF_USERID", "");

    if (!simBriefUserId) {
        mcdu.addNewMessage(NXFictionalMessages.noSimBriefUser);
        throw new Error("No SimBrief pilot ID provided");
    }

    mcdu.simbrief["sendStatus"] = "REQUESTING";

    updateView();

    return SimBriefApi.getSimBriefOfp(simBriefUserId)
        .then(data => {
            mcdu.simbrief["units"] = data.params.units;
            mcdu.simbrief["route"] = data.general.route;
            mcdu.simbrief["cruiseAltitude"] = data.general.initial_altitude;
            mcdu.simbrief["originIcao"] = data.origin.icao_code;
            mcdu.simbrief["originTransAlt"] = parseInt(data.origin.trans_alt, 10);
            mcdu.simbrief["originTransLevel"] = parseInt(data.origin.trans_level, 10);
            mcdu.simbrief["destinationIcao"] = data.destination.icao_code;
            mcdu.simbrief["destinationTransAlt"] = parseInt(data.destination.trans_alt, 10);
            mcdu.simbrief["destinationTransLevel"] = parseInt(data.destination.trans_level, 10);
            mcdu.simbrief["blockFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.plan_ramp : lbsToKg(data.fuel.plan_ramp);
            mcdu.simbrief["payload"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.payload : lbsToKg(data.weights.payload);
            mcdu.simbrief["estZfw"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.est_zfw : lbsToKg(data.weights.est_zfw);
            mcdu.simbrief["paxCount"] = data.weights.pax_count;
            mcdu.simbrief["paxWeight"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.pax_weight : lbsToKg(data.weights.pax_weight);
            mcdu.simbrief["cargo"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.cargo : lbsToKg(data.weights.cargo);
            mcdu.simbrief["costIndex"] = data.general.costindex;
            mcdu.simbrief["navlog"] = data.navlog.fix;
            mcdu.simbrief["icao_airline"] = typeof data.general.icao_airline === 'string' ? data.general.icao_airline : "";
            mcdu.simbrief["flight_number"] = data.general.flight_number;
            mcdu.simbrief["alternateIcao"] = data.alternate.icao_code;
            mcdu.simbrief["alternateTransAlt"] = parseInt(data.alternate.trans_alt, 10);
            mcdu.simbrief["alternateTransLevel"] = parseInt(data.alternate.trans_level, 10);
            mcdu.simbrief["avgTropopause"] = data.general.avg_tropopause;
            mcdu.simbrief["ete"] = data.times.est_time_enroute;
            mcdu.simbrief["blockTime"] = data.times.est_block;
            mcdu.simbrief["outTime"] = data.times.est_out;
            mcdu.simbrief["onTime"] = data.times.est_on;
            mcdu.simbrief["inTime"] = data.times.est_in;
            mcdu.simbrief["offTime"] = data.times.est_off;
            mcdu.simbrief["taxiFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.taxi : lbsToKg(data.fuel.taxi);
            mcdu.simbrief["tripFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.enroute_burn : lbsToKg(data.fuel.enroute_burn);
            mcdu.simbrief["sendStatus"] = "DONE";

            callback();

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
        originTransAlt,
        destinationIcao,
        destinationTransLevel,
        cruiseAltitude,
        costIndex,
        alternateIcao,
        avgTropopause,
        icao_airline,
        flight_number
    } = mcdu.simbrief;

    const fromTo = `${originIcao}/${destinationIcao}`;
    const fltNbr = `${icao_airline}${flight_number}`;

    mcdu.addNewMessage(NXSystemMessages.uplinkInsertInProg);

    /**
     * AOC ACT F-PLN UPLINK
     */
    mcdu.tryUpdateFromTo(fromTo, async (result) => {
        if (result) {
            CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu);
            CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);

            if (originTransAlt > 0) {
                mcdu.flightPlanManager.setOriginTransitionAltitude(originTransAlt, true);
            }
            if (destinationTransLevel > 0) {
                mcdu.flightPlanManager.setDestinationTransitionLevel(destinationTransLevel / 100, true);
            }

            await mcdu.tryUpdateAltDestination(alternateIcao);

            setTimeout(async () => {
                await uplinkRoute(mcdu);
                mcdu.addNewMessage(NXSystemMessages.aocActFplnUplink);
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
     * INIT PAGE DATA UPLINK
    */
    setTimeout(() => {
        mcdu.setCruiseFlightLevelAndTemperature(cruiseAltitude);
        mcdu.tryUpdateCostIndex(costIndex);
        mcdu.tryUpdateTropo(avgTropopause);
        if (mcdu.page.Current === mcdu.page.InitPageA) {
            CDUInitPage.ShowPage1(mcdu);
        }
    }, mcdu.getDelayHigh());
};

const addWaypointAsync = (fix, mcdu, routeIdent, via) => {
    const wpIndex = mcdu.flightPlanManager.getWaypointsCount() - 1;
    if (via) {
        return new Promise((res, rej) => {
            mcdu.insertWaypointsAlongAirway(routeIdent, wpIndex, via, (result) => {
                if (result) {
                    console.log("Inserted waypoint: " + routeIdent + " via " + via);
                    res(true);
                } else {
                    console.log('AWY/WPT MISMATCH ' + routeIdent + " via " + via);
                    mcdu.addNewMessage(NXSystemMessages.awyWptMismatch);
                    res(false);
                }
            });
        });
    } else {
        return new Promise((res, rej) => {
            const coords = {
                lat: fix.pos_lat,
                long: fix.pos_long
            };
            getWaypointByIdentAndCoords(mcdu, routeIdent, coords, (waypoint) => {
                if (waypoint) {
                    mcdu.flightPlanManager.addWaypoint(waypoint.icao, wpIndex, () => {
                        console.log("Inserted waypoint: " + routeIdent);
                        res(true);
                    }).catch(console.error);
                } else {
                    console.log('NOT IN DATABASE ' + routeIdent);
                    mcdu.addNewMessage(NXSystemMessages.notInDatabase);
                    res(false);
                }
            });
        });
    }
};

const addLatLonWaypoint = async (mcdu, lat, lon) => {
    try {
        const wp = mcdu.dataManager.createLatLonWaypoint(new LatLongAlt(lat, lon), true);
        await mcdu.flightPlanManager.addUserWaypoint(wp);
    } catch (err) {
        if (err instanceof McduMessage) {
            mcdu.addNewMessage(err);
        } else {
            console.error(err);
        }
    }
};

const uplinkRoute = async (mcdu) => {
    const {navlog} = mcdu.simbrief;

    const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));

    for (let i = 0; i < navlog.length; i++) {
        const fix = navlog[i];
        const nextFix = navlog[i + 1];

        if (fix.is_sid_star === '1') {
            continue;
        }
        if (["TOP OF CLIMB", "TOP OF DESCENT"].includes(fix.name)) {
            continue;
        }

        console.log('---- ' + fix.ident + ' ----');

        if (fix.type === 'ltlg') {
            console.log(`Inserting lat/lon waypoint ${fix.pos_lat}/${fix.pos_long}`);
            await addLatLonWaypoint(mcdu, parseFloat(fix.pos_lat), parseFloat(fix.pos_long));
            continue;
        }

        // Last SID fix - either it's airway is in the list of procedures, or
        // this is the very first fix in the route (to deal with procedures
        // that only have an exit fix, which won't be caught when filtering)
        if (procedures.has(fix.via_airway) || (i == 0)) {
            console.log("Inserting waypoint last of DEP: " + fix.ident);
            await addWaypointAsync(fix, mcdu, fix.ident);
            continue;
        } else {
            if (fix.via_airway === 'DCT') {
                console.log("Inserting waypoint: " + fix.ident);
                await addWaypointAsync(fix, mcdu, fix.ident);
                continue;
            }
            if (nextFix.via_airway !== fix.via_airway) {
                // last fix of airway
                console.log("Inserting waypoint: " + fix.ident + " via " + fix.via_airway);
                await addWaypointAsync(fix, mcdu, fix.ident, fix.via_airway);
                continue;
            }
        }
    }
};

/**
 * Get the waypoint by ident and coords within the threshold
 * @param {string} ident Waypoint ident
 * @param {object} coords Waypoint coords
 * @param {function} callback Return waypoint
 */
function getWaypointByIdentAndCoords(mcdu, ident, coords, callback) {
    const DISTANCE_THRESHOLD = 1;
    mcdu.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
        if (!waypoints || waypoints.length === 0) {
            return callback(undefined);
        }

        for (waypoint of waypoints) {
            const distanceToTarget = Avionics.Utils.computeGreatCircleDistance(coords, waypoint.infos.coordinates);
            if (distanceToTarget < DISTANCE_THRESHOLD) {
                return callback(waypoint);
            }
        }

        return callback(undefined);
    }).catch(console.error);
}
