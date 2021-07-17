const MAX_FIX_ROW = 5;

const Markers = {
    FPLN_DISCONTINUITY: ["---F-PLN DISCONTINUITY--"],
    END_OF_FPLN:        ["------END OF F-PLN------"],
    NO_ALTN_FPLN:       ["-----NO ALTN F-PLN------"],
    END_OF_ALTN_FPLN:   ["---END OF ALT F-PLN----"],
    TOO_STEEP_PATH:     ["-----TOO STEEP PATH-----"]
};

class CDUFlightPlanPage {

    static ShowPage(mcdu, offset = 0) {

        // INIT
        function addLskAt(index, delay, callback) {
            mcdu.leftInputDelay[index] = (typeof delay === 'function') ? delay : () => delay;
            mcdu.onLeftInput[index] = callback;
        }

        function addRskAt(index, delay, callback) {
            mcdu.rightInputDelay[index] = (typeof delay === 'function') ? delay : () => delay;
            mcdu.onRightInput[index] = callback;
        }

        //mcdu.flightPlanManager.updateWaypointDistances(false /* approach */);
        //mcdu.flightPlanManager.updateWaypointDistances(true /* approach */);
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.FlightPlanPage;
        mcdu.returnPageCallback = () => {
            CDUFlightPlanPage.ShowPage(mcdu, offset);
        };
        mcdu.activeSystem = 'FMGC';
        CDUFlightPlanPage._timer = 0;
        const fpm = mcdu.flightPlanManager;
        const renderedWaypointIndex = fpm.getActiveWaypointIndex();
        mcdu.pageUpdate = () => {
            CDUFlightPlanPage._timer++;
            if (CDUFlightPlanPage._timer >= 100 || fpm.getActiveWaypointIndex() !== renderedWaypointIndex) {
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            }
        };
        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isFlying = flightPhase >= 5 && flightPhase <= 7;

        let showFrom = false;
        let showTMPY = false;
        const ppos = {
            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
            long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
        };
        const stats = fpm.getCurrentFlightPlan().computeWaypointStatistics(ppos);

        // TODO: Move from flightplanpage
        const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        if (fpm.getOrigin()) {
            if (!isFlying) {
                fpm._waypointReachedAt = utcTime;
            }
        }

        const waypointsAndMarkers = [];
        const activeFirst = Math.max(0, fpm.getActiveWaypointIndex() - 1);

        // If we're still on the ground, force the active leg to be the first one even if we're close enough that the
        // FPM is trying to advance to the next one.
        const first = (mcdu.currentFlightPhase <= FmgcFlightPhases.TAKEOFF) ? 0 : activeFirst;

        // Primary F-PLAN
        for (let i = first; i < fpm.getWaypointsCount(); i++) {
            const wp = fpm.getWaypoint(i);
            waypointsAndMarkers.push({ wp: fpm.getWaypoint(i), fpIndex: i});

            if (wp.endsInDiscontinuity) {
                waypointsAndMarkers.push({ marker: Markers.FPLN_DISCONTINUITY, clr: wp.discontinuityCanBeCleared, fpIndex: i});
            }
            if (i === fpm.getWaypointsCount() - 1) {
                waypointsAndMarkers.push({ marker: Markers.END_OF_FPLN, clr: false, fpIndex: i});
                // TODO: Rewrite once alt fpln exists
                waypointsAndMarkers.push({ marker: Markers.NO_ALTN_FPLN, clr: false, fpIndex: i});
            }
        }
        // TODO: Alt F-PLAN

        // Render F-PLAN Display

        // fprow:   1      | 2     | 3 4   | 5 6   | 7 8   | 9 10  | 11 12   |
        // display: SPD/ALT| R0    | R1    | R2    | R3    | R4    | DEST    | SCRATCHPAD
        // functions:      | F[0]  | F[1]  | F[2]  | F[3]  | F[4]  | F[5]    |
        let rowsCount = 5;

        if (waypointsAndMarkers.length === 0) {
            rowsCount = 0;
            mcdu.setTemplate([
                [`{left}{small}{sp}${showFrom ? "FROM" : "{sp}{sp}{sp}{sp}"}{end}{yellow}{sp}${showTMPY ? "TMPY" : ""}{end}{end}{right}{small}${SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")}{sp}{sp}{sp}{end}{end}`],
                ...emptyFplnPage()
            ]);
            return;
        } else if (waypointsAndMarkers.length >= 5) {
            rowsCount = 5;
        } else {
            rowsCount = waypointsAndMarkers.length;
        }

        // Only examine first 5 (or less) waypoints/markers
        const scrollWindow = [];
        for (let rowI = 0, winI = offset; rowI < rowsCount; rowI++, winI++) {
            winI = winI % (waypointsAndMarkers.length);

            if (waypointsAndMarkers[winI].wp) {
                // Waypoint

                if (waypointsAndMarkers[winI].fpIndex === 0 && offset == 0) {
                    showFrom = true;
                }

                const wpPrev = fpm.getWaypoint(waypointsAndMarkers[winI].fpIndex - 1);
                const activeIndex = fpm.getActiveWaypointIndex();
                const wpActive = (waypointsAndMarkers[winI].fpIndex >= activeIndex);
                let ident = waypointsAndMarkers[winI].wp.ident;

                // Time
                let time;
                let timeCell = "----";
                if (isFlying) {
                    if (waypointsAndMarkers[winI].wp === fpm.getDestination() || isFinite(waypointsAndMarkers[winI].wp.liveUTCTo) || isFinite(waypointsAndMarkers[winI].wp.waypointReachedAt)) {
                        time = (waypointsAndMarkers[winI].wp === fpm.getDestination() || wpActive || waypointsAndMarkers[winI].wp.ident === "(DECEL)") ? stats.get(waypointsAndMarkers[winI].fpIndex).etaFromPpos : waypointsAndMarkers[winI].wp.waypointReachedAt;
                        timeCell = FMCMainDisplay.secondsToUTC(time) + "[s-text]";
                    }
                } else {
                    if (waypointsAndMarkers[winI].wp === fpm.getDestination() || isFinite(waypointsAndMarkers[winI].wp.liveETATo)) {
                        time = (waypointsAndMarkers[winI].wp === fpm.getDestination() || wpActive || waypointsAndMarkers[winI].wp.ident === "(DECEL)") ? stats.get(waypointsAndMarkers[winI].fpIndex).timeFromPpos : 0;
                        timeCell = FMCMainDisplay.secondsTohhmm(time) + "[s-text]";
                    }
                }

                // Color

                let color = "green";
                if (fpm.getCurrentFlightPlanIndex() === 1) {
                    color = "yellow";
                } else if (waypointsAndMarkers[winI].wp === fpm.getActiveWaypoint() && waypointsAndMarkers[winI].wp !== fpm.getDestination()) {
                    color = "white";
                }

                // Airway

                let airwayName = "";
                if (wpPrev && waypointsAndMarkers[winI].wp) {
                    let airway = undefined;
                    if (wpPrev.infos.airwayOut && wpPrev.infos.airwayOut === waypointsAndMarkers[winI].wp.infos.airwayIn) {
                        airway = {name: wpPrev.infos.airwayOut };
                    } else if (waypointsAndMarkers[winI].wp.infos.airwayIn && wpPrev.infos.airwayOut === undefined) {
                        airway = {name: waypointsAndMarkers[winI].wp.infos.airwayIn };
                    }
                    if (airway) {
                        airwayName = "\xa0" + airway.name;
                    }
                }

                // For Fix Header

                let fixAnnotation;
                if (fpm.getDepartureProcIndex() !== -1 && fpm.getDepartureWaypoints().some(fix => fix === waypointsAndMarkers[winI].wp)) {
                    const departure = fpm.getDeparture();
                    fixAnnotation = departure ? departure.name : undefined;
                } else if (fpm.getArrivalProcIndex() !== -1 && fpm.getArrivalWaypoints().some(fix => fix === waypointsAndMarkers[winI].wp)) {
                    const arrival = fpm.getArrival();
                    fixAnnotation = arrival ? arrival.name : undefined;
                } else {
                    fixAnnotation = airwayName;
                }

                // Distance
                let distance = "";

                // Active waypoint is live distance, others are distances in the flight plan
                // TODO: actually use the correct prediction
                if (waypointsAndMarkers[winI].wp !== fpm.getDestination()) {
                    if (waypointsAndMarkers[winI].wp === fpm.getActiveWaypoint()) {
                        distance = stats.get(waypointsAndMarkers[winI].fpIndex).distanceFromPpos.toFixed(0);
                    } else {
                        distance = stats.get(waypointsAndMarkers[winI].fpIndex).distanceInFP.toFixed(0);
                    }
                    if (distance > 9999) {
                        distance = 9999;
                    }
                    distance = distance.toString();
                }

                let speedConstraint = "---";
                if (waypointsAndMarkers[winI].wp.speedConstraint > 10) {
                    speedConstraint = "{magenta}*{end}" + waypointsAndMarkers[winI].wp.speedConstraint.toFixed(0);
                }

                let altColor = color;
                let spdColor = color;
                let timeColor = color;

                // Altitude

                let altitudeConstraint = "-----";
                let altPrefix = "\xa0";

                if (waypointsAndMarkers[winI].wp === fpm.getDestination()) {
                    // Only for destination waypoint, show runway elevation.
                    altColor = "white";
                    spdColor = "white";
                    let approachRunway = null;
                    approachRunway = fpm.getApproachRunway();
                    if (approachRunway) {
                        ident += Avionics.Utils.formatRunway(approachRunway.designation);
                    }
                    if (approachRunway) {
                        altitudeConstraint = (approachRunway.elevation * 3.280).toFixed(0).toString();
                        altColor = color;
                    }
                    altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");

                } else {

                    const firstRouteIndex = 1 + fpm.getDepartureWaypointsCount();
                    const lastRouteIndex = fpm.getLastIndexBeforeApproach();
                    const departureWp = firstRouteIndex > 1 && fpm.getDepartureWaypoints().indexOf(waypointsAndMarkers[winI].wp) !== -1;

                    if (mcdu.transitionAltitude >= 100 && waypointsAndMarkers[winI].wp.legAltitude1 > mcdu.transitionAltitude) {
                        altitudeConstraint = (waypointsAndMarkers[winI].wp.legAltitude1 / 100).toFixed(0).toString();
                        altitudeConstraint = "FL" + altitudeConstraint.padStart(3,"0");
                    } else {
                        altitudeConstraint = waypointsAndMarkers[winI].wp.legAltitude1.toFixed(0).toString().padStart(5,"\xa0");
                    }
                    if (waypointsAndMarkers[winI].wp.legAltitudeDescription !== 0 && waypointsAndMarkers[winI].wp.ident !== "(DECEL)") {
                        altPrefix = "{magenta}*{end}";
                        if (waypointsAndMarkers[winI].wp.legAltitudeDescription === 4) {
                            altitudeConstraint = ((waypointsAndMarkers[winI].wp.legAltitude1 + waypointsAndMarkers[winI].wp.legAltitude2) * 0.5).toFixed(0).toString();
                            altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                        }
                        // TODO remove this and replace with proper altitude constraint implementation
                        // Predict altitude for STAR when constraints are missing
                        /*
                    } else if (departureWp) {
                        altitudeConstraint = Math.floor(waypointsAndMarkers[winI].wp.cumulativeDistanceInFP * 0.14 * 6076.118 / 10).toString();
                        altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                        // Waypoint is the first or the last of the actual route
                        */
                    } else if ((waypointsAndMarkers[winI].fpIndex === firstRouteIndex - 1) || (waypointsAndMarkers[winI].fpIndex === lastRouteIndex + 1)) {
                        if (Object.is(NaN, mcdu.cruiseFlightLevel)) {
                            altitudeConstraint = "-----\xa0";
                            altPrefix = "";
                        } else {
                            altitudeConstraint = "FL" + mcdu.cruiseFlightLevel.toString().padStart(3,"0");
                        }

                        // Waypoint is in between on the route
                    } else if (waypointsAndMarkers[winI].fpIndex <= lastRouteIndex && waypointsAndMarkers[winI].fpIndex >= firstRouteIndex) {
                        if (Object.is(NaN, mcdu.cruiseFlightLevel)) {
                            altitudeConstraint = "-----\xa0";
                            altPrefix = "";
                        } else {
                            altitudeConstraint = "FL" + mcdu.cruiseFlightLevel.toString().padStart(3,"0");
                        }
                    }
                }

                if (speedConstraint === "---") {
                    spdColor = "white";
                }

                if (altitudeConstraint === "-----\xa0") {
                    altColor = "white";
                }

                if (waypointsAndMarkers[winI].wp === fpm.getDestination()) {
                    timeColor = color;
                } else {
                    timeColor = "white";
                }

                scrollWindow[rowI] = {
                    fpIndex: waypointsAndMarkers[winI].fpIndex,
                    active: wpActive,
                    ident: ident,
                    color: color,
                    distance: distance,
                    spdColor: spdColor,
                    speedConstraint: speedConstraint,
                    altColor: altColor,
                    altitudeConstraint: { alt: altitudeConstraint, altPrefix: altPrefix },
                    timeCell: timeCell,
                    timeColor: timeColor,
                    fixAnnotation: fixAnnotation
                };

                if (waypointsAndMarkers[winI].wp !== fpm.getDestination()) {
                    addLskAt(rowI, (value) => {
                        if (value === "") {
                            if (waypointsAndMarkers[winI].wp) {
                                return mcdu.getDelaySwitchPage();
                            }
                        }
                        return mcdu.getDelayBasic();
                    },
                    (value) => {
                        if (value === "") {
                            if (waypointsAndMarkers[winI].wp) {
                                CDULateralRevisionPage.ShowPage(mcdu, waypointsAndMarkers[winI].wp, waypointsAndMarkers[winI].fpIndex);
                            }
                        } else if (value === FMCMainDisplay.clrValue) {
                            mcdu.removeWaypoint(waypointsAndMarkers[winI].fpIndex, () => {
                                CDUFlightPlanPage.ShowPage(mcdu, offset);
                            }, true);
                        } else if (value.length > 0) {
                            mcdu.insertWaypoint(value, waypointsAndMarkers[winI].fpIndex, () => {
                                CDUFlightPlanPage.ShowPage(mcdu, offset);
                            }, true);
                        }
                    });
                } else {
                    addLskAt(rowI, () => mcdu.getDelaySwitchPage(),
                        (value) => {
                            if (value === "") {
                                CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), waypointsAndMarkers[winI].fpIndex);
                            } else if (value.length > 0) {
                                mcdu.insertWaypoint(value, waypointsAndMarkers[winI].fpIndex, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            }
                        });
                }

                addRskAt(rowI, () => mcdu.getDelaySwitchPage(),
                    async (_value) => {
                        if (waypointsAndMarkers[winI].wp) {
                            CDUVerticalRevisionPage.ShowPage(mcdu, waypointsAndMarkers[winI].wp);
                        }
                    });

            } else if (waypointsAndMarkers[winI].marker) {

                // Marker
                scrollWindow[rowI] = waypointsAndMarkers[winI];
                addLskAt(rowI, 0, (value) => {
                    if (value === FMCMainDisplay.clrValue) {
                        if (waypointsAndMarkers[winI].clr) {
                            mcdu.clearDiscontinuity(waypointsAndMarkers[winI].fpIndex, () => {
                                CDUFlightPlanPage.ShowPage(mcdu, offset);
                            }, true);
                        }
                        return;
                    }

                    mcdu.insertWaypoint(value, waypointsAndMarkers[winI].fpIndex + 1, () => {
                        CDUFlightPlanPage.ShowPage(mcdu, offset);
                    }, true);
                });
            }
        }

        // Pass current waypoint data to ND
        if (scrollWindow[0]) {
            mcdu.currentFlightPlanWaypointIndex = scrollWindow[0].fpIndex;
            SimVar.SetSimVarValue("L:A32NX_SELECTED_WAYPOINT", "number", scrollWindow[0].fpIndex);
        } else {
            mcdu.currentFlightPlanWaypointIndex = first + offset;
            SimVar.SetSimVarValue("L:A32NX_SELECTED_WAYPOINT", "number", first + offset);
        }

        // Render scrolling data to text >> add ditto marks

        let nmCount = 0;
        const scrollText = [];
        for (let rowI = 0; rowI < scrollWindow.length; rowI++) {
            const currRow = scrollWindow[rowI];

            if (rowI > 0 && currRow && !currRow.marker) {
                let dstnc = currRow.distance;
                if (nmCount === 0 && currRow.distance) {
                    dstnc += "NM";
                    nmCount++;
                } else {
                    dstnc += "\xa0\xa0";
                }
                for (let z = 0; z < 9 - dstnc.length; z++) {
                    dstnc = dstnc + "\xa0";
                }
                dstnc = dstnc + "[color]" + currRow.color;
                currRow.distance = dstnc;
            }

            const prevRow = scrollWindow[rowI - 1];
            if (currRow && !currRow.marker && prevRow) {
                if (!prevRow.marker) {
                    if (currRow.speedConstraint !== "---" && currRow.speedConstraint === prevRow.speedConstraint) {
                        currRow.speedConstraint.ditto = true;
                    }

                    if (currRow.altitudeConstraint.alt === prevRow.altitudeConstraint.alt && currRow.altitudeConstraint.altPrefix === "\xa0") {
                        currRow.altitudeConstraint.ditto = true;
                    }
                } else if (prevRow.marker) {
                    if (currRow.distance.includes("NM")) {
                        nmCount--;
                    };
                    currRow.distance = "";
                    currRow.fixAnnotation = "";

                    if (rowI - 2 >= 0 && scrollWindow[rowI - 2] && !scrollWindow[rowI - 2].marker
                        && currRow.altitudeConstraint.alt === scrollWindow[rowI - 2].altitudeConstraint.alt && currRow.altitudeConstraint.altPrefix === "\xa0") {
                        currRow.altitudeConstraint.ditto = true;
                    }
                }
            }

            if (!currRow.marker) {
                scrollText[(rowI * 2) - 1] = renderFixHeader(currRow);
                scrollText[(rowI * 2)] = renderFixContent(currRow);
            } else {
                scrollText[(rowI * 2) - 1] = [];
                scrollText[(rowI * 2)] = currRow.marker;
            }
        }

        // Destination (R6)

        const destText = [];
        if (fpm.isCurrentFlightPlanTemporary()) {
            destText[0] = [" ", " "];
            destText[1] = ["{ERASE[color]amber", "INSERT*[color]amber"];

            showTMPY = true;

            addLskAt(5, 0, async () => {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            });
            addRskAt(5, 0, async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            });
        } else {
            let destCell = "----";
            let approachRunway = null;
            if (fpm.getDestination()) {
                destCell = fpm.getDestination().ident;
                approachRunway = fpm.getApproachRunway();
                if (approachRunway) {
                    destCell += Avionics.Utils.formatRunway(approachRunway.designation);
                }
            }
            let destTimeCell = "----";
            let destDistCell = "---";
            let destEFOBCell = "---";

            if (fpm.getDestination()) {
                const destStats = stats.get(fpm.getCurrentFlightPlan().waypoints.length - 1);
                destDistCell = destStats.distanceFromPpos.toFixed(0);
                destEFOBCell = (NXUnits.kgToUser(mcdu.getDestEFOB(isFlying))).toFixed(1);
                if (isFlying) {
                    destTimeCell = FMCMainDisplay.secondsToUTC(destStats.etaFromPpos);
                } else {
                    destTimeCell = FMCMainDisplay.secondsTohhmm(destStats.timeFromPpos);
                }
            }
            if (!CDUInitPage.fuelPredConditionsMet(mcdu)) {
                destEFOBCell = "---";
            }

            destText[0] = ["\xa0DEST", "DIST EFOB", isFlying ? "UTC{sp}" : "TIME{sp}{sp}"];
            destText[1] = [destCell, destDistCell + " " + destEFOBCell, destTimeCell + "{sp}{sp}"];

            addLskAt(5, () => mcdu.getDelaySwitchPage(),
                () => {
                    CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), fpm.getWaypointsCount() - 1);
                });
        }

        mcdu.setTemplate([
            [`{left}{small}{sp}${showFrom ? "FROM" : "{sp}{sp}{sp}{sp}"}{end}{yellow}{sp}${showTMPY ? "TMPY" : ""}{end}{end}{right}{small}${SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")}{sp}{sp}{sp}{end}{end}`],
            ["", "SPD/ALT\xa0\xa0\xa0", isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}"],
            ...scrollText,
            ...destText
        ]);

        const allowScroll = waypointsAndMarkers.length > 4;
        if (allowScroll) {//scroll only if there are more than 5 points
            mcdu.onDown = () => {//on page down decrement the page offset.
                if (offset > 0) { // if page not on top
                    offset--;
                } else { // else go to the bottom
                    offset = waypointsAndMarkers.length - 1;
                }
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            };
            mcdu.onUp = () => {
                if (offset < waypointsAndMarkers.length - 1) { // if page not on bottom
                    offset++;
                } else { // else go on top
                    offset = 0;
                }
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            };
        }
        mcdu.setArrows(allowScroll, allowScroll, true, true);
    }
}

CDUFlightPlanPage._timer = 0;

function renderFixTableHeader(isFlying) {
    return [
        `{sp}\xa0FROM`,
        "SPD/ALT\xa0\xa0\xa0",
        isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}"
    ];
}

function renderFixHeader(rowObj) {
    return [
        `{sp}${!rowObj.fixAnnotation.noRender ? rowObj.fixAnnotation : ""}`,
        ((rowObj.active && !rowObj.distance.noRender) ? rowObj.distance : ""),
        ""
    ];
}

function renderFixContent(rowObj) {

    return [
        `${rowObj.ident}[color]${rowObj.color}`,
        `{${rowObj.spdColor}}${rowObj.speedConstraint.ditto ? "\xa0\"\xa0" : rowObj.speedConstraint}{end}{${rowObj.altColor}}/${rowObj.altitudeConstraint.ditto ? "\xa0\xa0\"\xa0\xa0" : rowObj.altitudeConstraint.altPrefix + rowObj.altitudeConstraint.alt}{end}[s-text]`,
        `${rowObj.timeCell}{sp}{sp}[color]${rowObj.timeColor}`
    ];
}

function emptyFplnPage() {
    return [
        ["", "SPD/ALT", "TIME{sp}{sp}"],
        ["PPOS[color]green", "---/ -----", "----{sp}{sp}"],
        [""],
        ["---F-PLN DISCONTINUITY---"],
        [""],
        ["------END OF F-PLN-------"],
        [""],
        ["-----NO ALTN F-PLN-------"],
        [""],
        [""],
        ["\xa0DEST", "DIST EFOB", "TIME{sp}{sp}"],
        ["------", "---- ----", "----{sp}{sp}"]
    ];
}
