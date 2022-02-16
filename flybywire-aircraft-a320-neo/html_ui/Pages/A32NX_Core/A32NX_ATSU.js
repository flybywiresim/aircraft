function translateAtsuMessageType(type) {
    switch (type) {
        case Atsu.AtsuMessageType.Freetext:
            return "FREETEXT";
        case Atsu.AtsuMessageType.PDC:
            return "PDC";
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
            mcdu.simbrief["callsign"] = data.atc.callsign;
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
        callsign
    } = mcdu.simbrief;

    const fromTo = `${originIcao}/${destinationIcao}`;

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

/**
 * Validate a given VHF frequency that it fits to the 8.33 kHz-spacing
 * @param {string} value Frequency candidate
 * @returns null or a NXSystemMessages-entry in case of a failure
 */
const validateVhfFrequency = (value) => {
    // valid frequency range: 118.000 - 136.975
    if (!/^1[1-3][0-9].[0-9]{2}[0|5]$/.test(value)) {
        return NXSystemMessages.formatError;
    }

    const elements = value.split(".");
    const before = parseInt(elements[0]);
    if (before < 118 || before > 136) {
        return NXSystemMessages.entryOutOfRange;
    }

    // valid 8.33 kHz spacings
    const frequencySpacingOther = [ "00", "05", "10", "15", "25", "30", "35", "40", "50", "55", "60", "65", "75", "80", "85", "90" ];
    const frequencySpacingEnd = [ "00", "05", "10", "15", "25", "30", "35", "40", "50", "55", "60", "65", "75" ];

    // validate the correct frequency fraction
    const twoDigitFraction = elements[1].substring(1, elements[1].length);
    if (before === 136) {
        if (frequencySpacingEnd.findIndex((entry) => entry === twoDigitFraction) === -1) {
            return NXSystemMessages.entryOutOfRange;
        }
    } else {
        if (frequencySpacingOther.findIndex((entry) => entry === twoDigitFraction) === -1) {
            return NXSystemMessages.entryOutOfRange;
        }
    }

    return null;
};

/**
 * Validates a value that it is compatible with the FCOM format for altitudes and flight levels
 * @param {string} value The entered scratchpad altitude
 * @returns null or a NXSystemMessage-entry in case of a failure
 */
const validateScratchpadAltitude = (value) => {
    if (/^((FL)*[0-9]{1,3})$/.test(value)) {
        let flightlevel = "";

        if (value.startsWith("FL")) {
            flightlevel = value.substring(2, value.length);
        } else {
            flightlevel = value;
        }

        // contains not only digits
        if (/(?!^\d+$)^.+$/.test(flightlevel)) {
            return NXSystemMessages.formatError;
        }
        flightlevel = parseInt(flightlevel);

        if (flightlevel >= 30 && flightlevel <= 410) {
            return null;
        }
        return NXSystemMessages.entryOutOfRange;
    } else if (/^([0-9]{1,3}(FT|M)|[0-9]{1,5}M|[0-9]{4,5})$/.test(value)) {
        const feet = value[value.length - 1] !== "M";

        let altitude = value.replace("FT", "").replace("M", "");

        // contains not only digits
        if (/(?!^\d+$)^.+$/.test(altitude)) {
            return NXSystemMessages.formatError;
        }
        altitude = parseInt(altitude);

        if (feet) {
            if (altitude >= 0 && altitude <= 25000) {
                return null;
            }
            return NXSystemMessages.entryOutOfRange;
        }

        if (altitude >= 0 && altitude <= 12500) {
            return null;
        }
        return NXSystemMessages.entryOutOfRange;
    }

    return NXSystemMessages.formatError;
};

/**
 * Validates a value that it is compatible with the FCOM format for lateral offsets
 * @param {string} value The entered scratchpad offset
 * @returns null or a NXSystemMessage-entry in case of a failure
 */
const validateScratchpadOffset = (offset) => {
    let nmUnit = true;
    let distance = 0;

    if (/^[LR][0-9]{1,3}(NM|KM)$/.test(offset) || /^[LR][0-9]{1,3}$/.test(offset)) {
        // format: DNNNKM, DNNNNM, DNNN
        distance = parseInt(offset.substring(1, 4));
        nmUnit = !offset.endsWith("KM");
    } else if (/^[0-9]{1,3}(NM|KM)[LR]$/.test(offset) || /^[0-9]{1,3}[LR]$/.test(offset)) {
        // format: NNNKMD, NNNNMD, NNND
        distance = parseInt(offset.substring(0, 3));
        nmUnit = !(offset.endsWith("KML") || offset.endsWith("KMR"));
    } else {
        return NXSystemMessages.formatError;
    }

    // validate the ranges
    if (nmUnit) {
        if (distance >= 1 && distance <= 128) {
            return null;
        }
    } else {
        if (distance >= 1 && distance <= 256) {
            return null;
        }
    }

    return NXSystemMessages.entryOutOfRange;
};

/**
 * Validates a value that it is compatible with the FCOM format for speeds
 * @param {string} value The entered scratchpad speed
 * @returns null or a NXSystemMessage-entry in case of a failure
 */
const validateScratchpadSpeed = (value) => {
    if (/^((M*)\.[0-9]{1,2})$/.test(value)) {
        // MACH number

        let mach = value.split(".")[1];
        // contains not only digits
        if (/(?!^\d+$)^.+$/.test(mach)) {
            return NXSystemMessages.formatError;
        }
        mach = parseInt(mach);

        if (mach >= 61 && mach <= 92) {
            return null;
        }
        return NXSystemMessages.entryOutOfRange;
    } else if (/^([0-9]{1,3}(KT)*)$/.test(value)) {
        // knots

        let knots = value.replace("KT", "");
        // contains not only digits
        if (/(?!^\d+$)^.+$/.test(knots)) {
            return NXSystemMessages.formatError;
        }
        knots = parseInt(knots);

        if (knots >= 70 && knots <= 350) {
            return null;
        }
        return NXSystemMessages.entryOutOfRange;
    }

    return NXSystemMessages.formatError;
};

/**
 * Classifies a possible waypoint type of the scratchpad
 * Types:
 *   -  0 = lat-lon coordinate
 *   -  1 = time
 *   -  2 = place
 *   - -1 = unknonw
 * @param {FMCMainDisplay} mcdu The current MCDU instance
 * @param {string} waypoint The entered waypoint
 * @param {boolean} allowTime Indicates if time entries are allowed
 * @returns A tuple with the type and null or a NXSystemMessage-entry in case of a failure
 */
const classifyScratchpadWaypointType = async (mcdu, waypoint, allowTime) => {
    if (mcdu.isLatLonFormat(waypoint)) {
        return [0, null];
    }

    // time formatted
    if (allowTime && /^([0-2][0-4][0-5][0-9]Z?)$/.test(waypoint)) {
        return [1, null];
    }

    // place formatted
    if (/^[A-Z0-9]{2,7}/.test(waypoint)) {
        return mcdu.dataManager.GetWaypointsByIdent.bind(mcdu.dataManager)(waypoint).then((waypoints) => {
            if (waypoints.length !== 0) {
                return [2, null];
            } else {
                return [-1, NXSystemMessages.notInDatabase];
            }
        });
    }

    return [-1, NXSystemMessages.formatError];
};

/**
 * Validates that two speed entries describe the same (knots or mach)
 * @param {string} lower Lower speed value
 * @param {string} higher Higher speed value
 * @returns True if both are same type else false
 */
const sameSpeedType = (lower, higher) => {
    if (lower[0] === "M" && higher[0] === "M") {
        return true;
    }
    if (lower[0] === "M" || higher[0] === "M") {
        return false;
    }
    return true;
};

/**
 * Validats that lower is smaller than higher
 * @param {string} lower Lower speed value
 * @param {string} higher Higher speed value
 * @returns True if lower is smaller than higher, else false
 */
const validSpeedRange = (lower, higher) => {
    if (lower[0] === "M") {
        return parseInt(lower.substring(2, lower.length)) < parseInt(higher.substring(2, higher.length));
    }
    return parseInt(lower) < parseInt(higher);
};

/**
 * Validates that a scratchpad entry follows the FCOM definition for speed ranges
 * @param {string} Given speed range candidate
 * @returns null or a NXSystemMessage-entry in case of a failure
 */
const validateScratchpadSpeedRanges = (value) => {
    const entries = value.split("/");
    if (entries.length !== 2) {
        this.addNewMessage(NXSystemMessages.formatError);
    } else if (this.validateSpeed(entries[0]) || this.validateSpeed(entries[1])) {
        let error = this.validateSpeed(entries[0]);
        if (error) {
            this.addNewMessage(error);
        } else {
            error = this.validateSpeed(entries[1]);
            this.addNewMessage(error);
        }
    } else {
        const lower = this.formatSpeed(entries[0]);
        const higher = this.formatSpeed(entries[1]);

        if (!this.sameSpeedType(lower, higher)) {
            this.addNewMessage(NXSystemMessages.formatError);
        } else if (!this.compareSpeeds(lower, higher)) {
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
        } else {
            return [lower, higher];
        }
    }

    return [];
};

/**
 * Formats a scratchpad to a standard altitude string
 * @param {string} value The entered valid altitude
 * @returns Formatted string or empty string in case of a failure
 */
const formatScratchpadAltitude = (value) => {
    if (/^((FL)*[0-9]{1,3})$/.test(value)) {
        if (value.startsWith("FL")) {
            return value;
        } else {
            return `FL${value}`;
        }
    } else if (/^([0-9]{1,3}(FT|M)|[0-9]{1,5}M|[0-9]{4,5})$/.test(value)) {
        const feet = value[value.length - 1] !== "M";

        let altitude = value.replace("FT", "").replace("M", "");
        if (!feet) {
            altitude = `${altitude}M`;
        }

        return altitude;
    }

    return "";
};

/**
 * Formats a scratchpad entry to the standard speed description
 * @param {string} value Valid speed entry
 * @returns The formatted speed string
 */
const formatScratchpadSpeed = (value) => {
    if (value[0] === "M") {
        return value;
    } else if (value[0] === ".") {
        return `M${value}`;
    }
    return value.replace("KT", "");
};

/**
 * Converts an FCOM valid encoded offset string to a list of offset entries
 * @param {string} offset Valid encoded offset
 * @returns The decoded offset entries
 */
const decodeOffsetString = (offset) => {
    let nmUnit = true;
    let left = false;
    let distance;

    if (/^[LR][0-9]{1,3}(NM|KM)$/.test(offset) || /^[LR][0-9]{1,3}$/.test(offset)) {
        // format: DNNNKM, DNNNNM, DNNN

        // contains not only numbers
        distance = offset.replace(/NM|KM/, "").replace(/L|R/, "");
        if (/(?!^\d+$)^.+$/.test(distance)) {
            return '';
        }

        distance = parseInt(distance);
        nmUnit = !offset.endsWith("KM");
        left = offset[0] === 'L';
    } else if (/[0-9]{1,3}(NM|KM)[LR]/.test(offset) || /[0-9]{1,3}[LR]/.test(offset)) {
        // format: NNNKMD, NNNNMD, NNND

        // contains not only numbers
        distance = offset.replace(/NM|KM/, "").replace(/L|R/, "");
        if (/(?!^\d+$)^.+$/.test(distance)) {
            return '';
        }

        distance = parseInt(distance);
        nmUnit = !(offset.endsWith("KML") || offset.endsWith("KMR"));
        left = offset[offset.length - 1] === 'L';
    }

    return [ left ? "L" : 'R', distance.toString(), nmUnit ? "NM" : "KM" ];
};

/**
 * Formats a valid scratchpad offset to a normalized offset entry
 * @param {string} value The scratchpad entry
 * @returns The normalized offset entry
 */
const formatScratchpadOffset = (value) => {
    const entries = decodeOffsetString(offset);
    return `${entries[0]}${entries[1]}${entries[2]}`;
};

/**
 * Expands a lateral offset encoded string into an expanded version
 * @param {string} offset The valid offset value
 * @returns The expanded lateral offset
 */
const expandLateralOffset = (offset) => {
    const entries = decodeOffsetString(offset);
    return `${entries[1]} ${entries[2]} ${entries[0] === "L" ? "LEFT" : "RIGHT"}`;
};
