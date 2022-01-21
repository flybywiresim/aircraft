function translateAtsuMessageType(type) {
    switch (type) {
        case Atsu.AtsuMessageType.Freetext:
            return "FREETEXT";
        case Atsu.AtsuMessageType.METAR:
            return "METAR";
        case Atsu.AtsuMessageType.TAF:
            return "TAF";
        case Atsu.AtsuMessageType.ATIS:
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
 */
const getSimBriefOfp = (mcdu, updateView, callback = () => {}) => {
    const simBriefUserId = NXDataStore.get("CONFIG_SIMBRIEF_USERID", "");

    if (!simBriefUserId) {
        mcdu.setScratchpadMessage(NXFictionalMessages.noSimBriefUser);
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
            mcdu.simbrief["originRwy"] = data.origin.plan_rwy;
            mcdu.simbrief["originTransAlt"] = parseInt(data.origin.trans_alt, 10);
            mcdu.simbrief["originTransLevel"] = parseInt(data.origin.trans_level, 10);
            mcdu.simbrief["destinationIcao"] = data.destination.icao_code;
            mcdu.simbrief["destinationRwy"] = data.destination.plan_rwy;
            mcdu.simbrief["destinationTransAlt"] = parseInt(data.destination.trans_alt, 10);
            mcdu.simbrief["destinationTransLevel"] = parseInt(data.destination.trans_level, 10);
            mcdu.simbrief["blockFuel"] = mcdu.simbrief["units"] === 'kgs' ? data.fuel.plan_ramp : lbsToKg(data.fuel.plan_ramp);
            mcdu.simbrief["payload"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.payload : lbsToKg(data.weights.payload);
            mcdu.simbrief["estZfw"] = mcdu.simbrief["units"] === 'kgs' ? data.weights.est_zfw : lbsToKg(data.weights.est_zfw);
            mcdu.simbrief["paxCount"] = data.weights.pax_count_actual;
            mcdu.simbrief["bagCount"] = data.weights.bag_count_actual;
            mcdu.simbrief["paxWeight"] = data.weights.pax_weight;
            mcdu.simbrief["bagWeight"] = data.weights.bag_weight;
            mcdu.simbrief["freight"] = data.weights.freight_added;
            mcdu.simbrief["cargo"] = data.weights.cargo;
            mcdu.simbrief["costIndex"] = data.general.costindex;
            mcdu.simbrief["navlog"] = data.navlog.fix;
            mcdu.simbrief["callsign"] = data.atc.callsign;
            mcdu.simbrief["alternateIcao"] = data.alternate.icao_code;
            mcdu.simbrief["alternateTransAlt"] = parseInt(data.alternate.trans_alt, 10);
            mcdu.simbrief["alternateTransLevel"] = parseInt(data.alternate.trans_level, 10);
            mcdu.simbrief["alternateAvgWindDir"] = parseInt(data.alternate.avg_wind_dir, 10);
            mcdu.simbrief["alternateAvgWindSpd"] = parseInt(data.alternate.avg_wind_spd, 10);
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
        originTransAlt,
        destinationIcao,
        destinationTransLevel,
        cruiseAltitude,
        costIndex,
        alternateIcao,
        avgTropopause,
        callsign
    } = mcdu.simbrief;

    const fromTo = `${originIcao}/${destinationIcao}`;

    mcdu.setScratchpadMessage(NXSystemMessages.uplinkInsertInProg);

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
                mcdu.setScratchpadMessage(NXSystemMessages.aocActFplnUplink);
            }, mcdu.getDelayRouteChange());

            if (mcdu.page.Current === mcdu.page.InitPageA) {
                CDUInitPage.ShowPage1(mcdu);
            }
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

const AddSTAR = (RWEnd, fix, mcdu) => {
    const STARs = [];
    let STARName = "";
    let APPName = "";
    let TRANSAPPName = "";
    let TRANSSTARName = "";

    const fixx = fix;
    let rwy = "";
    let shortRwy = "";

    let i = -1, j = -1, j1 = -1, r2 = -1, t = -1, t2 = -1, gr = -1;
    let FindStar = false;
    let FindAppr = false;
    let FindTransAppr = false;
    let FindTransStar = false;

    const destinationAirport = mcdu.flightPlanManager.getDestination();
    const destinationAirportInfo = destinationAirport.infos;

    const destinationRunways = destinationAirportInfo.oneWayRunways;

    for (let i = 0; i < destinationRunways.length; i++) {
        rwy = destinationRunways[i].designation;
        const re1 = /[1-9]+[0]?[A-Z]?/;
        shortRwy = rwy.match(re1)[0];
        //shortRwy = rwy;
        const re = /[0-9]+/;
        const rwyDig = rwy.match(re);
        /*if (rwyDig < 2) {

            rwy = "0" + rwy;
        }*/
        if (mcdu.simbrief.destinationRwy === rwy) {
            gr = i;
            break;
        }
    }
    //Not found rwy in navdata
    if (gr < 0) {
        return STARs;
    }

    for (let j = 0; j < destinationAirportInfo.approaches.length; j++) {
        destinationAirportInfo.approaches[j].index = j;
    }

    for (j = 0; j < destinationAirportInfo.approaches.length; j++) {
        const approach = destinationAirportInfo.approaches[j];
        const runwayTransition = approach.runway;
        if (shortRwy === runwayTransition) {
            if (approach.finalLegs[0].fixIcao.substr(7, 12).trim() === fixx) {
                t = -1;
                FindAppr = true;
                break;
            } else {
                for (t = 0; t < approach.transitions.length; t++) {
                    const enRouteTransitionAppr = approach.transitions[t];
                    if (enRouteTransitionAppr.legs[0].fixIcao.substr(7, 12).trim() === fixx) {
                        FindAppr = true;
                        FindTransAppr = true;
                        if (FindAppr) {
                            APPName = destinationAirportInfo.approaches[j].name;
                            if (FindTransAppr) {
                                TRANSAPPName = destinationAirportInfo.approaches[j].transitions[t].name;
                            }
                            STARName = APPName;

                            STARs.push({r: gr, t: t, t2: t2, tr: r2, i: i, j: destinationAirportInfo.approaches[j].index, STARName: STARName, APPName: APPName, TRANSSTARName: TRANSSTARName, TRANSAPPName: TRANSAPPName, RWName: RWEnd});
                            FindAppr = false;
                            FindTransAppr = false;
                        }
                    }
                }
            }
        }
    }

    for (i = 0; i < destinationAirportInfo.arrivals.length; i++) {
        const arrival = destinationAirportInfo.arrivals[i];
        for (r2 = 0; r2 < arrival.runwayTransitions.length; r2++) {
            const runwayTransition = arrival.runwayTransitions[r2];
            if (shortRwy.indexOf(runwayTransition.name.slice(2,runwayTransition.name.length)) !== -1) {
                if (runwayTransition.legs[0].fixIcao.substr(7, 12).trim() === fixx) {
                    t2 = -1;
                    for (j = 0; j < destinationAirportInfo.approaches.length; j++) {
                        const approach = destinationAirportInfo.approaches[j];
                        if (shortRwy === approach.runway) {
                            if (approach.finalLegs[0].fixIcao.substr(7, 12).trim() ===
                                runwayTransition.legs[runwayTransition.legs.length - 1].fixIcao.substr(7, 12).trim()) {
                                t = -1;
                                FindAppr = true;
                                FindStar = true;
                                if (FindAppr) {
                                    STARName = destinationAirportInfo.arrivals[i].name;
                                    APPName = destinationAirportInfo.approaches[j].name;
                                    if (FindTransAppr) {
                                        TRANSAPPName = destinationAirportInfo.approaches[j].transitions[t].name;
                                    }
                                    STARs.push({r: gr, t: t, t2: t2, tr: r2, i: i, j: destinationAirportInfo.approaches[j].index, STARName: STARName, APPName: APPName, TRANSSTARName: TRANSSTARName, TRANSAPPName: TRANSAPPName, RWName: RWEnd});

                                    FindAppr = false;
                                    FindStar = false;
                                    FindTransAppr = false;
                                }
                            } else {
                                for (t = 0; t < approach.transitions.length; t++) {
                                    const enRouteTransitionAppr = approach.transitions[t];
                                    if (enRouteTransitionAppr.legs[0].fixIcao.substr(7, 12).trim() ==
                                                runwayTransition.legs[runwayTransition.legs.length - 1].fixIcao.substr(7, 12).trim()) {
                                        FindAppr = true;
                                        FindStar = true;
                                        FindTransAppr = true;
                                        if (FindAppr) {
                                            STARName = destinationAirportInfo.arrivals[i].name;
                                            APPName = destinationAirportInfo.approaches[j].name;
                                            if (FindTransAppr) {
                                                TRANSAPPName = destinationAirportInfo.approaches[j].transitions[t].name;
                                            }
                                            STARs.push({r: gr, t: t, t2: t2, tr: r2, i: i, j: destinationAirportInfo.approaches[j].index, STARName: STARName, APPName: APPName, TRANSSTARName: TRANSSTARName, TRANSAPPName: TRANSAPPName, RWName: RWEnd});

                                            FindAppr = false;
                                            FindStar = false;
                                            FindTransAppr = false;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } else {
                    for (t2 = 0; t2 < arrival.enRouteTransitions.length; t2++) {
                        const enRouteTransition = arrival.enRouteTransitions[t2];
                        if (enRouteTransition.legs[0].fixIcao.substr(7, 12).trim() === fixx) {
                            for (j1 = 0; j1 < destinationAirportInfo.approaches.length; j1++) {
                                const approach = destinationAirportInfo.approaches[j1];
                                if (shortRwy === approach.runway) {
                                    if (approach.finalLegs[0].fixIcao.substr(7, 12).trim() ==
                                            runwayTransition.legs[runwayTransition.legs.length - 1].fixIcao.substr(7, 12).trim()) {
                                        t = -1;
                                        FindAppr = true;
                                        FindStar = true;
                                        FindTransStar = true;
                                        j = j1;
                                        if (FindAppr) {

                                            STARName = destinationAirportInfo.arrivals[i].name;
                                            APPName = destinationAirportInfo.approaches[j].name;
                                            if (FindTransAppr) {
                                                TRANSAPPName = destinationAirportInfo.approaches[j].transitions[t].name;
                                            }
                                            if (FindTransStar) {
                                                TRANSSTARName = destinationAirportInfo.arrivals[j].enRouteTransitions[t2].name;
                                            }
                                            STARs.push({r: gr, t: t, t2: t2, tr: r2, i: i, j: destinationAirportInfo.approaches[j].index, STARName: STARName, APPName: APPName, TRANSSTARName: TRANSSTARName, TRANSAPPName: TRANSAPPName, RWName: RWEnd});

                                            FindAppr = false;
                                            FindStar = false;
                                            FindTransAppr = false;
                                            FindTransStar = false;
                                        }
                                    } else {
                                        for (t = 0; t < approach.transitions.length; t++) {
                                            const enRouteTransitionAppr = approach.transitions[t];
                                            if (enRouteTransitionAppr.legs[0].fixIcao.substr(7, 12).trim() ==
                                                    runwayTransition.legs[runwayTransition.legs.length - 1].fixIcao.substr(7, 12).trim()) {
                                                {
                                                    FindAppr = true;
                                                    FindStar = true;
                                                    FindTransStar = true;
                                                    FindTransAppr = true;
                                                    j = j1;
                                                    if (FindAppr) {

                                                        STARName = destinationAirportInfo.arrivals[i].name;
                                                        APPName = destinationAirportInfo.approaches[j].name;
                                                        if (FindTransAppr) {
                                                            TRANSAPPName = destinationAirportInfo.approaches[j].transitions[t].name;
                                                        }
                                                        if (FindTransStar) {
                                                            TRANSSTARName = destinationAirportInfo.arrivals[i].enRouteTransitions[t2].name;
                                                        }
                                                        STARs.push({r: gr, t: t, t2: t2, tr: r2, i: i, j: destinationAirportInfo.approaches[j].index, STARName: STARName, APPName: APPName, TRANSSTARName: TRANSSTARName, TRANSAPPName: TRANSAPPName, RWName: RWEnd});

                                                        FindAppr = false;
                                                        FindStar = false;
                                                        FindTransAppr = false;
                                                        FindTransStar = false;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    return STARs;
};

const AddSID = (RWEnd, fix, mcdu) => {
    const SIDss = [];
    let SIDName = "";
    let TRANSITIONName = "";

    const fixx = fix;
    let rwy = "";
    let shortRwy = "";

    let j, r, t, gr = -1;
    let FindSid = false;
    let FindTrans = false;

    const originAirport = mcdu.flightPlanManager.getOrigin();
    const originAirportInfo = originAirport.infos;

    const originRunways = originAirportInfo.oneWayRunways;

    for (let i = 0; i < originRunways.length; i++) {
        rwy = originRunways[i].designation;
        const re1 = /[1-9]+[0]?[A-Z]?/;
        shortRwy = rwy.match(re1)[0];
        //shortRwy = rwy;
        const re = /[0-9]+/;
        const rwyDig = rwy.match(re);
        /*if (rwyDig < 2) {

            rwy = "0" + rwy;
        }*/
        if (mcdu.simbrief.originRwy === rwy) {
            gr = i;
            break;
        }
    }
    //Not found rwy in navdata
    if (gr < 0) {
        return SIDss;
    }

    for (j = 0; j < originAirportInfo.departures.length; j++) {
        const departure = originAirportInfo.departures[j];
        for (r = 0; r < departure.runwayTransitions.length; r++) {
            const runwayTransition = departure.runwayTransitions[r];
            if (shortRwy.indexOf(runwayTransition.name.slice(2,runwayTransition.name.length)) !== -1) {
                if (departure.commonLegs.length > 0) {
                    if (departure.commonLegs[departure.commonLegs.length - 1].fixIcao.substr(7, 12).trim() === fixx) {
                        t = -1;
                        FindSid = true;
                        break;
                    } else {

                        for (t = 0; t < departure.enRouteTransitions.length; t++) {
                            const enRouteTransition = departure.enRouteTransitions[t];
                            if (enRouteTransition.commonLegs[enRouteTransition.commonLegs.length - 1].fixIcao.substr(7, 12).trim() === fixx) {
                                FindSid = true;
                                FindTrans = true;
                                break;
                            }
                        }

                    }
                } else if (runwayTransition.legs.length > 0) {
                    if (runwayTransition.legs[runwayTransition.legs.length - 1].fixIcao.substr(7, 12).trim() === fixx) {
                        t = -1;
                        FindSid = true;
                        break;
                    } else {

                        for (t = 0; t < departure.enRouteTransitions.length; t++) {
                            const enRouteTransition = departure.enRouteTransitions[t];
                            if (enRouteTransition.commonLegs[enRouteTransition.commonLegs.length - 1].fixIcao.substr(7, 12).trim() === fixx) {
                                FindSid = true;
                                FindTrans = true;
                                break;
                            }
                        }

                    }
                }
            }
        }
        if (FindSid) {
            SIDName = originAirportInfo.departures[j].name;
            if (FindTrans) {
                TRANSITIONName = originAirportInfo.departures[j].enRouteTransitions[t].name;
            }
            SIDss.push({r: gr, t: t, tr: r, j: j, SIDName: SIDName, TRANSITIONName: TRANSITIONName, RWName: RWEnd});
            FindSid = false;
            FindTrans = false;
        }
    }
    return SIDss;
};

const uplinkRoute = async (mcdu) => {
    const fpm = mcdu.flightPlanManager;
    const ass = await SimVar.GetSimVarValue("L:A32NX_AUTO_SID_STAR", "Number");
    const add = await SimVar.GetSimVarValue("L:A32NX_AUTO_DELETE_DISCONTINUITY", "Number");

    const initRunwaySet = 0;
    const initSidSet = 0;
    const initSidTransSet = 0;

    const initApproachSet = 0;
    const initStarSet = 0;
    const initApprTransSet = 0;
    const initStarTransSet = 0;

    let OrigSids = [];
    let OrigStars = [];

    let wp;
    let wps;

    const {navlog} = mcdu.simbrief;

    const procedures = new Set(navlog.filter(fix => fix.is_sid_star === "1").map(fix => fix.via_airway));

    let SimBriefSID = "";
    let FixSID = "";
    let SimBriefSTAR = "";
    let FixSTAR = "";

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
            SimBriefSID = fix.via_airway;
            FixSID = fix.ident;
            continue;
        } else {
            if (procedures.has(nextFix.via_airway)) {
                SimBriefSTAR = nextFix.via_airway;
                FixSTAR = fix.ident;
            }
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
    if (ass === 1) {
        const AppTypes = ["ILS", "GLS", "LOC", "NDB", "VOR", "RNAV"];

        OrigSids = AddSID(mcdu.simbrief.originRwy, FixSID, mcdu);
        let findSID = -1;
        for (let i = 0; i < OrigSids.length; i++) {
            if (OrigSids[i].SIDName === SimBriefSID) {
                findSID = i;
                break;
            }
        }

        OrigStars = AddSTAR(mcdu.simbrief.destinationRwy, FixSTAR, mcdu);
        let findSTAR = -1;
        for (let n = 0; n < AppTypes.length; n++) {
            for (let i = 0; i < OrigStars.length; i++) {
                if (OrigStars[i].STARName === SimBriefSTAR) {
                    const appindex = OrigStars[i].APPName.indexOf(AppTypes[n]);
                    if (appindex >= 0) {
                        findSTAR = i;
                        break;
                    }
                }
            }
            if (findSTAR >= 0) {
                break;
            }
        }

        if (findSTAR < 0) {
            for (let i = 0; i < OrigStars.length; i++) {
                if (OrigStars[i].STARName === SimBriefSTAR) {
                    findSTAR = i;
                    break;
                }
            }
        }
        mcdu.flightPlanManager.pauseSync();
        if (OrigSids.length > 0) {
            // SID
            await mcdu.ensureCurrentFlightPlanIsTemporary(async () => {
                SimVar.SetSimVarValue("L:A32NX_SET_SID", "Number", 1);
            });
            // set departure
            //  rwy index
            await mcdu.flightPlanManager.setDepartureRunwayIndex(OrigSids[findSID].tr)
                .then(() => console.log(`[FP LOAD] Setting Departure Runway ${OrigSids[findSID].tr} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Departure Runway ${OrigSids[findSID].tr} ... FAILED`);
                    console.error(e);
                });
            // proc index
            await mcdu.flightPlanManager.setDepartureProcIndex(OrigSids[findSID].j)
                .then(() => console.log(`[FP LOAD] Setting Departure Procedure  ${OrigSids[findSID].j} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Departure Procedure ${OrigSids[findSID].j} ... FAILED`);
                    console.error(e);
                });
            // origin runway
            if (OrigSids[findSID].tr !== -1) {
                await mcdu.flightPlanManager.setOriginRunwayIndex(OrigSids[findSID].r)
                    .then(() => console.log(`[FP LOAD] Setting Origin  ${OrigSids[findSID].r} ... SUCCESS`))
                    .catch((e) => {
                        console.error(`[FP LOAD] Setting Origin ${OrigSids[findSID].r} ... FAILED`);
                        console.error(e);
                    });
            } else if (OrigSids[findSID].tr !== -1 && OrigSids[findSID].j !== -1) {
                await mcdu.flightPlanManager.setOriginRunwayIndexFromDeparture()
                    .then(() => console.log(`[FP LOAD] Setting Origin using ${OrigSids[findSID].j}/${OrigSids[findSID].tr}... SUCCESS`))
                    .catch((e) => {
                        console.error(`[FP LOAD] Setting Origin using ${OrigSids[findSID].j}/${OrigSids[findSID].tr} ... FAILED`);
                        console.error(e);
                    });
            }
            //  enroutetrans index
            await mcdu.flightPlanManager.setDepartureEnRouteTransitionIndex(OrigSids[findSID].t)
                .then(() => console.log(`[FP LOAD] Setting Departure En Route Transition ${OrigSids[findSID].t} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Departure En Route Transition ${OrigSids[findSID].t} ... FAILED`);
                    console.error(e);
                });
            if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                await mcdu.flightPlanManager.copyCurrentFlightPlanInto(0, () => {
                    mcdu.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
                        SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
                        SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
                        if (mcdu.tempFpPendingAutoTune) {
                            mcdu.clearAutotunedIls();
                            mcdu.tempFpPendingAutoTune = false;
                        }
                        if (add === 1) {
                            let first = 0;
                            let countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                            for (let i = 0; i < countWaypoints; i++) {
                                wp = mcdu.flightPlanManager.getWaypoint(i);
                                if (wp.ident === FixSID) {
                                    if (first === 0) {
                                        first = 1;
                                        continue;
                                    } else if (first === 1) {
                                        mcdu.flightPlanManager.removeWaypoint(i);
                                        countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                        first = -1;
                                    }
                                } else {
                                    first = 0;
                                }
                            }
                            for (let i = 0; i < mcdu.flightPlanManager.getWaypointsCount(); i++) {
                                wp = mcdu.flightPlanManager.getWaypoint(i);
                                if (wp.endsInDiscontinuity) {
                                    mcdu.flightPlanManager.clearDiscontinuity(i);
                                }
                            }
                            SimVar.SetSimVarValue("L:A32NX_SET_CLEAR_DISCONTINUITY", "Number", 1);
                        }
                        CDUFlightPlanPage.ShowPage(mcdu, 0);
                    });
                }).catch(console.error);
            }
        }
        if (OrigStars.length > 0) {
            // STAR
            await mcdu.ensureCurrentFlightPlanIsTemporary(async () => {
                SimVar.SetSimVarValue("L:A32NX_SET_STAR", "Number", 1);
            });
            // set approach
            //  rwy index
            await mcdu.flightPlanManager.setArrivalRunwayIndex(OrigStars[findSTAR].r)
                .then(() => console.log(`[FP LOAD] Setting Arrival Runway ${OrigStars[findSTAR].r} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Arrival Runway ${OrigStars[findSTAR].r} ... FAILED`);
                    console.error(e);
                });
            //  approach index
            await mcdu.flightPlanManager.setApproachIndex(OrigStars[findSTAR].j)
                .then(() => console.log(`[FP LOAD] Setting Approach ${OrigStars[findSTAR].j} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Approach ${OrigStars[findSTAR].j} ... FAILED`);
                    console.error(e);
                });
            //  approachtrans index
            await mcdu.flightPlanManager.setApproachTransitionIndex(OrigStars[findSTAR].t)
                .then(() => console.log(`[FP LOAD] Setting Approach Transition ${OrigStars[findSTAR].t} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Approach Transition ${OrigStars[findSTAR].t} ... FAILED`);
                    console.error(e);
                });

            // set arrival
            //  arrivalproc index
            await mcdu.flightPlanManager.setArrivalProcIndex(OrigStars[findSTAR].i)
                .then(() => console.log(`[FP LOAD] Setting Arrival Procedure ${OrigStars[findSTAR].i} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Arrival Procedure ${OrigStars[findSTAR].i} ... FAILED`);
                    console.error(e);
                });
            //  arrivaltrans index
            await mcdu.flightPlanManager.setArrivalEnRouteTransitionIndex(OrigStars[findSTAR].t2)
                .then(() => console.log(`[FP LOAD] Setting En Route Transition ${OrigStars[findSTAR].t2} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting En Route Transition ${OrigStars[findSTAR].t2} ... FAILED`);
                    console.error(e);
                });

            await mcdu.flightPlanManager.setDestinationRunwayIndexFromApproach()
                .then(() => console.log(`[FP LOAD] Setting Destination Runway using ${OrigStars[findSTAR].j} ... SUCCESS`))
                .catch((e) => {
                    console.error(`[FP LOAD] Setting Destination Runway using ${OrigStars[findSTAR].j} ... FAILED`);
                    console.error(e);
                });

            SimVar.SetSimVarValue("L:A32NX_SET_STAR_TRANS_DESTINATION", "Number", 3);

            mcdu.updateConstraints();
            mcdu.onToRwyChanged();
            CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu, true, true);
            CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);
            if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                await mcdu.flightPlanManager.copyCurrentFlightPlanInto(0, () => {
                    mcdu.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
                        SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
                        SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
                        if (mcdu.tempFpPendingAutoTune) {
                            mcdu.clearAutotunedIls();
                            mcdu.tempFpPendingAutoTune = false;
                        }
                        if (add === 1) {
                            let first = 0;
                            let countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                            for (let i = 0; i < countWaypoints; i++) {
                                wp = mcdu.flightPlanManager.getWaypoint(i);
                                if (wp.ident === FixSID) {
                                    if (first === 0) {
                                        first = 1;
                                        continue;
                                    } else if (first === 1) {
                                        mcdu.flightPlanManager.removeWaypoint(i);
                                        countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                        first = -1;
                                    }
                                } else if (wp.ident === "MANUAL") {
                                    mcdu.flightPlanManager.removeWaypoint(i);
                                    countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                    first = 0;
                                } else {
                                    first = 0;
                                }
                            }
                            for (let i = 0; i < mcdu.flightPlanManager.getWaypointsCount(); i++) {
                                wp = mcdu.flightPlanManager.getWaypoint(i);
                                if (wp.endsInDiscontinuity) {
                                    mcdu.flightPlanManager.clearDiscontinuity(i);
                                }
                            }
                            SimVar.SetSimVarValue("L:A32NX_SET_CLEAR_DISCONTINUITY", "Number", 1);
                        }
                        CDUFlightPlanPage.ShowPage(mcdu, 0);
                    });
                }).catch(console.error);
            }
        }
        mcdu.flightPlanManager.resumeSync();

        // Potential CTD source?
        Coherent.call('SET_ACTIVE_WAYPOINT_INDEX', 0)
            .catch((e) => console.error('[FP LOAD] Error when setting Active WP'));
        Coherent.call('RECOMPUTE_ACTIVE_WAYPOINT_INDEX')
            .catch((e) => console.error('[FP LOAD] Error when recomputing Active WP'));
        /*if (OrigSids.length > 0) {

            await mcdu.ensureCurrentFlightPlanIsTemporary(async () => {
                initRunwaySet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_RUNWAY_ORIGIN", "Number", 1);
            });

            if (initRunwaySet == 1) {
                mcdu.tempFpPendingAutoTune = true;
                await mcdu.flightPlanManager.setDepartureProcIndex(-1, async () => {
                    await mcdu.flightPlanManager.setOriginRunwayIndex(OrigSids[findSID].r, async () => {
                        initRunwaySet = 1;
                        SimVar.SetSimVarValue("L:A32NX_SET_RUNWAY_ORIGIN", "Number", 1);
                    }).catch(console.error);
                }).catch(console.error);

                mcdu.tempFpPendingAutoTune = true;
                if (!mcdu.flightPlanManager.getOrigin()) {
                    mcdu.addNewMessage(NXFictionalMessages.noOriginSet);
                    initRunwaySet = -1;
                    SimVar.SetSimVarValue("L:A32NX_SET_RUNWAY_ORIGIN", "Number", -1);
                } else {
                    await mcdu.flightPlanManager.setDepartureRunwayIndex(OrigSids[findSID].tr, async () => {
                        initRunwaySet = 2;
                        SimVar.SetSimVarValue("L:A32NX_SET_RUNWAY_ORIGIN", "Number", 2);
                    }).catch(console.error);
                }
            }
            let departureRunwayIndex = -1;
            if (initRunwaySet == 2) {
                const currentRunway = mcdu.flightPlanManager.getOriginRunway();
                initSidSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_SID_ORIGIN", "Number", 1);
                await mcdu.flightPlanManager.setDepartureProcIndex(OrigSids[findSID].j, async () => {
                    if (currentRunway) {
                        SimVar.SetSimVarValue("L:A32NX_DEPARTURE_ELEVATION", "feet", A32NX_Util.meterToFeet(currentRunway.elevation));
                        const departure = mcdu.flightPlanManager.getDeparture();
                        departureRunwayIndex = await departure.runwayTransitions.findIndex(async t => {
                            if (t.name.indexOf(currentRunway.designation) !== -1) {
                                initSidSet = 2;
                                SimVar.SetSimVarValue("L:A32NX_SET_SID_ORIGIN", "Number", 2);
                            } else {
                                initSidSet = -1;
                                SimVar.SetSimVarValue("L:A32NX_SET_SID_ORIGIN", "Number", -1);
                            }
                        });
                    }
                    initSidSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_SID_ORIGIN", "Number", 2);
                }).catch(console.error);
            }

            if (departureRunwayIndex >= -1) {
                await mcdu.flightPlanManager.setDepartureRunwayIndex(departureRunwayIndex, async () => {
                    initSidSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_SID_ORIGIN", "Number", 2);
                }).catch(console.error);
            }

            if (initSidSet == 2) {
                initSidTransSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_TRANSITION_ORIGIN", "Number", 1);
                await mcdu.flightPlanManager.setDepartureEnRouteTransitionIndex(OrigSids[findSID].t, async () => {
                    initSidTransSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_TRANSITION_ORIGIN", "Number", 2);
                });

                if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    await mcdu.flightPlanManager.copyCurrentFlightPlanInto(0, () => {
                        mcdu.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
                            SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
                            SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
                            if (mcdu.tempFpPendingAutoTune) {
                                mcdu.clearAutotunedIls();
                                mcdu.tempFpPendingAutoTune = false;
                            }
                            if (add === 1) {
                                let first = 0;
                                let countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                for (let i = 0; i < countWaypoints; i++) {
                                    wp = mcdu.flightPlanManager.getWaypoint(i);
                                    if (wp.ident === FixSID) {
                                        if (first === 0) {
                                            first = 1;
                                            continue;
                                        } else if (first === 1) {
                                            mcdu.flightPlanManager.removeWaypoint(i);
                                            countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                            first = -1;
                                        }
                                    } else {
                                        first = 0;
                                    }
                                }
                                for (let i = 0; i < mcdu.flightPlanManager.getWaypointsCount(); i++) {
                                    wp = mcdu.flightPlanManager.getWaypoint(i);
                                    if (wp.endsInDiscontinuity) {
                                        mcdu.flightPlanManager.clearDiscontinuity(i);
                                    }
                                }
                                SimVar.SetSimVarValue("L:A32NX_SET_CLEAR_DISCONTINUITY", "Number", 1);
                            }
                            CDUFlightPlanPage.ShowPage(mcdu, 0);
                        });
                    }).catch(console.error);
                }
            }
        }*/

        // STAR
        /*if (OrigStars.length > 0) {
            await mcdu.ensureCurrentFlightPlanIsTemporary(async () => {
                initApproachSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_APPROACH_DESTINATION", "Number", 1);
            });

            if (initApproachSet == 1) {
                await mcdu.flightPlanManager.setApproachIndex(OrigStars[findSTAR].j, async () => {
                    const approach = mcdu.flightPlanManager.getApproach();
                    if (approach) {
                        const runway = mcdu.flightPlanManager.getDestinationRunway();
                        if (runway) {
                            SimVar.SetSimVarValue("L:A32NX_PRESS_AUTO_LANDING_ELEVATION", "feet", A32NX_Util.meterToFeet(runway.elevation));
                        }
                    }
                    mcdu.tempFpPendingAutoTune = true;
                    initApproachSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_APPROACH_DESTINATION", "Number", 2);
                }).catch(console.error);
            }

            if (initApproachSet == 2) {
                await mcdu.flightPlanManager.setDestinationRunwayIndexFromApproach();
                initStarSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 1);
                initStarTransSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_TRANS_DESTINATION", "Number", 1);

                //await mcdu.flightPlanManager.setArrivalEnRouteTransitionIndex(OrigStars[findSTAR].t2, async () => {
                await mcdu.flightPlanManager.setArrivalProcIndex(OrigStars[findSTAR].i, async () => {
                    initStarSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 2);
                }).catch(console.error);
                //initStarTransSet = 2;
                //SimVar.SetSimVarValue("L:A32NX_SET_STAR_TRANS_DESTINATION", "Number", 2);
                //}).catch(console.error);
            }

            if (initApproachSet == 2) {
                initApprTransSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_APPR_TRANS_DESTINATION", "Number", 1);
                initStarSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 1);
                const arrivalIndex = mcdu.flightPlanManager.getArrivalProcIndex();
                await mcdu.flightPlanManager.setApproachTransitionIndex(OrigStars[findSTAR].t, async () => {
                    initApprTransSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_APPR_TRANS_DESTINATION", "Number", 2);
                }).catch(console.error);
                if (initApprTransSet === 2) {
                    await mcdu.flightPlanManager.setArrivalProcIndex(arrivalIndex, async () => {
                        initStarSet = 2;
                        SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 2);
                    }).catch(console.error);
                }
            }

            if (initStarSet == 2) {
                initStarSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 1);
                initStarTransSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_TRANS_DESTINATION", "Number", 1);
                await mcdu.flightPlanManager.setArrivalEnRouteTransitionIndex(OrigStars[findSTAR].t2, async () => {
                    initStarTransSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_STAR_TRANS_DESTINATION", "Number", 2);
                }).catch(console.error);
                if (initStarTransSet === 2) {
                    await mcdu.flightPlanManager.setArrivalProcIndex(OrigStars[findSTAR].i, async () => {
                        initStarSet = 2;
                        SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 2);
                    }).catch(console.error);
                }
            }

            if (initStarSet != 2) {
                initStarSet = 1;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 1);
                await mcdu.flightPlanManager.setArrivalProcIndex(OrigStars[findSTAR].i, async () => {
                    initStarSet = 2;
                    SimVar.SetSimVarValue("L:A32NX_SET_STAR_DESTINATION", "Number", 2);
                }).catch(console.error);
            }

            if (initStarSet == 2 && initApproachSet == 2) {
                initStarTransSet = 3;
                SimVar.SetSimVarValue("L:A32NX_SET_STAR_TRANS_DESTINATION", "Number", 3);

                mcdu.updateConstraints();
                mcdu.onToRwyChanged();
                CDUPerformancePage.UpdateThrRedAccFromOrigin(mcdu, true, true);
                CDUPerformancePage.UpdateEngOutAccFromOrigin(mcdu);
                if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                    await mcdu.flightPlanManager.copyCurrentFlightPlanInto(0, () => {
                        mcdu.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
                            SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
                            SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
                            if (mcdu.tempFpPendingAutoTune) {
                                mcdu.clearAutotunedIls();
                                mcdu.tempFpPendingAutoTune = false;
                            }
                            if (add === 1) {
                                let first = 0;
                                let countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                for (let i = 0; i < countWaypoints; i++) {
                                    wp = mcdu.flightPlanManager.getWaypoint(i);
                                    if (wp.ident === FixSID) {
                                        if (first === 0) {
                                            first = 1;
                                            continue;
                                        } else if (first === 1) {
                                            mcdu.flightPlanManager.removeWaypoint(i);
                                            countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                            first = -1;
                                        }
                                    } else if (wp.ident === "MANUAL") {
                                        mcdu.flightPlanManager.removeWaypoint(i);
                                        countWaypoints = mcdu.flightPlanManager.getWaypointsCount();
                                        first = 0;
                                    } else {
                                        first = 0;
                                    }
                                }
                                for (let i = 0; i < mcdu.flightPlanManager.getWaypointsCount(); i++) {
                                    wp = mcdu.flightPlanManager.getWaypoint(i);
                                    if (wp.endsInDiscontinuity) {
                                        mcdu.flightPlanManager.clearDiscontinuity(i);
                                    }
                                }
                                SimVar.SetSimVarValue("L:A32NX_SET_CLEAR_DISCONTINUITY", "Number", 1);
                            }
                            CDUFlightPlanPage.ShowPage(mcdu, 0);
                        });
                    }).catch(console.error);
                }
            }
        }*/
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
