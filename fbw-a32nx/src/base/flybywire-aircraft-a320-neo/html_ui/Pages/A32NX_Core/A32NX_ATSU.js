// Copyright (c) 2021-2023 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

function translateAtsuMessageType(type) {
    switch (type) {
        case AtsuCommon.AtsuMessageType.Freetext:
            return "FREETEXT";
        case AtsuCommon.AtsuMessageType.METAR:
            return "METAR";
        case AtsuCommon.AtsuMessageType.TAF:
            return "TAF";
        case AtsuCommon.AtsuMessageType.ATIS:
            return "ATIS";
        default:
            return "UNKNOWN";
    }
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

/**
 *  Converts lbs to kg
 * @param {string | number} value
 */
const lbsToKg = (value) => {
    return (+value * 0.4535934).toString();
};

/**
 * Fetch SimBrief OFP data and store on FMCMainDisplay object
 * @param {FMCMainDisplay} mcdu FMCMainDisplay
 * @param {() => void} updateView
 * @return {Promise.<ISimbriefData>}
 */
const getSimBriefOfp = (mcdu, updateView, callback = () => {}) => {
    const navigraphUsername = NXDataStore.get("NAVIGRAPH_USERNAME", "");
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
        mcdu.setScratchpadMessage(NXFictionalMessages.noNavigraphUser);
        throw new Error("No Navigraph username provided");
    }

    mcdu.simbrief["sendStatus"] = "REQUESTING";

    updateView();

    return Fmgc.SimBriefUplinkAdapter.downloadOfpForUserID(navigraphUsername, overrideSimBriefUserID)
        .then(data => {
            mcdu.simbrief["units"] = data.units;
            mcdu.simbrief["route"] = data.route;
            mcdu.simbrief["cruiseAltitude"] = data.cruiseAltitude;
            mcdu.simbrief["originIcao"] = data.origin.icao;
            mcdu.simbrief["originTransAlt"] = parseInt(data.origin.transAlt, 10);
            mcdu.simbrief["originTransLevel"] = parseInt(data.origin.transLevel, 10);
            mcdu.simbrief["destinationIcao"] = data.destination.icao;
            mcdu.simbrief["destinationTransAlt"] = parseInt(data.destination.transAlt, 10);
            mcdu.simbrief["destinationTransLevel"] = parseInt(data.destination.transLevel, 10);
            mcdu.simbrief["blockFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.planRamp : lbsToKg(data.fuel.planRamp);
            mcdu.simbrief["payload"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.payload : lbsToKg(data.weights.payload);
            mcdu.simbrief["estZfw"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.estZeroFuelWeight : lbsToKg(data.weights.estZeroFuelWeight);
            mcdu.simbrief["paxCount"] = data.weights.passengerCount;
            mcdu.simbrief["bagCount"] = data.weights.bagCount;
            mcdu.simbrief["paxWeight"] = data.weights.passengerWeight;
            mcdu.simbrief["bagWeight"] = data.weights.bagWeight;
            mcdu.simbrief["freight"] = data.weights.freight;
            mcdu.simbrief["cargo"] = data.weights.cargo;
            mcdu.simbrief["costIndex"] = data.general.costindex;
            mcdu.simbrief["navlog"] = data.navlog.fix;
            mcdu.simbrief["callsign"] = data.atc.callsign;
            let alternate = data.alternate;
            if (Array.isArray(data.alternate)) {
                alternate = data.alternate[0];
            }
            mcdu.simbrief["alternateIcao"] = alternate.icao_code;
            mcdu.simbrief["alternateTransAlt"] = parseInt(alternate.transAlt, 10);
            mcdu.simbrief["alternateTransLevel"] = parseInt(alternate.transLevel, 10);
            mcdu.simbrief["alternateAvgWindDir"] = parseInt(alternate.averageWindDirection, 10);
            mcdu.simbrief["alternateAvgWindSpd"] = parseInt(alternate.averageWindSpeed, 10);
            mcdu.simbrief["avgTropopause"] = data.averageTropopause;
            mcdu.simbrief["ete"] = data.times.estTimeEnroute;
            mcdu.simbrief["blockTime"] = data.times.estBlock;
            mcdu.simbrief["outTime"] = data.times.estOut;
            mcdu.simbrief["onTime"] = data.times.estOn;
            mcdu.simbrief["inTime"] = data.times.estIn;
            mcdu.simbrief["offTime"] = data.times.estOff;
            mcdu.simbrief["taxiFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.taxi : lbsToKg(data.fuel.taxi);
            mcdu.simbrief["tripFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.enrouteBurn : lbsToKg(data.fuel.enrouteBurn);
            mcdu.simbrief["sendStatus"] = "DONE";

            callback();

            updateView();

            return data;
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
        callsign
    } = mcdu.simbrief;

    mcdu.addMessageToQueue(NXSystemMessages.uplinkInsertInProg);

    /**
     * AOC ACT F-PLN UPLINK
     */
    mcdu.setFromTo(originIcao, destinationIcao).then(async (result) => {
        if (result) {
            if (originTransAlt > 0) {
                mcdu.flightPlanService.active.performanceData.databaseTransitionAltitude.set(originTransAlt);
            }
            if (destinationTransLevel > 0) {
                mcdu.flightPlanService.active.performanceData.databaseTransitionLevel.set(destinationTransLevel / 100);
            }

            await mcdu.tryUpdateAltDestination(alternateIcao);

            setTimeout(async () => {
                await uplinkRoute(mcdu);
                mcdu.addMessageToQueue(NXSystemMessages.aocActFplnUplink);
            }, mcdu.getDelayRouteChange());

            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }
    }).catch((e) => {
        if (e instanceof McduMessage) {
            mcdu.setScratchpadMessage(e);
        } else {
            console.warn(e);
        }
    });
    mcdu.updateFlightNo(callsign, (result) => {
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
            mcdu.insertWaypointsAlongAirway(routeIdent, wpIndex, via).then((result) => {
                if (result >= 0) {
                    console.log("Inserted waypoint: " + routeIdent + " via " + via);
                    res(true);
                } else {
                    console.log('AWY/WPT MISMATCH ' + routeIdent + " via " + via);
                    mcdu.setScratchpadMessage(NXSystemMessages.awyWptMismatch);
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
                    mcdu.setScratchpadMessage(NXSystemMessages.notInDatabase);
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
            mcdu.setScratchpadMessage(err);
        } else {
            console.error(err);
        }
    }
};

/**
 * Inserts the located company route's origin, destination and if provided alternate.
 * @param {FMCMainDisplay} mcdu
 */
const insertCoRoute = async (mcdu) => {
    const {
        originIcao,
        destinationIcao,
        alternateIcao,
    } = mcdu.coRoute;

    const fromTo = `${originIcao}/${destinationIcao}`;

    mcdu.setFromTo(originIcao, destinationIcao).then(async (result) => {
        if (result) {
            if (alternateIcao) {
                await mcdu.tryUpdateAltDestination(alternateIcao);
            }

            await uplinkRoute(mcdu, true);
            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
        }
    }).catch((e) => {
        if (e instanceof McduMessage) {
            mcdu.setScratchpadMessage(e);
        } else {
            console.warn(e);
        }
    });
};

const uplinkRoute = async (mcdu, coroute = false) => {
    const {navlog} = coroute ? mcdu.coRoute : mcdu.simbrief;

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
            if (fix.via_airway === 'DCT' || fix.via_airway.match(/^NAT[A-Z]$/)) {
                if (fix.type === 'apt' && nextFix === undefined) {
                    break;
                }
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
