const MAX_FIX_ROW = 5;

const Markers = {
    FPLN_DISCONTINUITY: ["---F-PLN DISCONTINUITY--"],
    END_OF_FPLN: ["------END OF F-PLN-------"],
    NO_ALTN_FPLN: ["-----NO ALTN F-PLN-------"],
};

class CDUFlightPlanPage {
    static ShowPage(mcdu, offset = 0) {

        //mcdu.flightPlanManager.updateWaypointDistances(false /* approach */);
        //mcdu.flightPlanManager.updateWaypointDistances(true /* approach */);
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.FlightPlanPage;
        mcdu.returnPageCallback = () => {
            CDUFlightPlanPage.ShowPage(mcdu, offset);
        };
        mcdu.activeSystem = 'FMGC';
        CDUFlightPlanPage._timer = 0;
        const renderedWaypointIndex = mcdu.flightPlanManager.getActiveWaypointIndex();
        mcdu.pageUpdate = () => {
            CDUFlightPlanPage._timer++;
            const waypointIndex = mcdu.flightPlanManager.getActiveWaypointIndex();
            if (CDUFlightPlanPage._timer >= 100 || waypointIndex !== renderedWaypointIndex) {
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            }
        };
        mcdu.pageRedrawCallback = () => CDUFlightPlanPage.ShowPage(mcdu, offset);
        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isFlying = flightPhase >= 5 && flightPhase <= 7;
        let runway = null;
        let showFrom = false;
        let showTMPY = false;
        let stats = null;

        const fpm = mcdu.flightPlanManager;

        if (fpm.getOrigin()) {
            runway = fpm.getDepartureRunway();
        }

        const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        if (fpm.getOrigin()) {
            if (!isFlying) {
                fpm._waypointReachedAt = utcTime;
            }
        }

        let destCell = "----";
        let approachRunway = null;
        if (fpm.getDestination()) {
            destCell = fpm.getDestination().ident;
            const ppos = {
                lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
                long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
            };
            stats = fpm.getCurrentFlightPlan().computeWaypointStatistics(ppos);
            approachRunway = fpm.getApproachRunway();
            if (approachRunway) {
                destCell += Avionics.Utils.formatRunway(approachRunway.designation);
            }
        }
        let rows = [[""], [""], [""], [""], [""], [""], [""], [""], [""], [""], [""], [""],];
        let rowsCount = 5;

        function printRowAt(index, row) {
            rows[index] = row;
        }

        let rowIndex = 0;
        function printRow(row, nextLarge = false) {
            if (nextLarge && rowIndex % 2 === 0) {
                rowIndex++;
            }

            if (rowIndex < 10) {
                rows[rowIndex] = row;
            }

            rowIndex++;
        }

        function addLsk(delay, callback) {
            if (rowIndex % 2 === 0) {
                mcdu.leftInputDelay[(rowIndex / 2) - 1] = (typeof delay === 'function') ? delay : () => delay;
                mcdu.onLeftInput[rowIndex / 2 - 1] = callback;
            } else {
                console.error('[MCDU F-PLN] Tried to add an LSK when the last printed row did not have an LSK next to it. Only add LSKs on rows with even numbers.');
            }
        }

        function addLskAt(index, delay, callback) {
            mcdu.leftInputDelay[index] = (typeof delay === 'function') ? delay : () => delay;
            mcdu.onLeftInput[index] = callback;
        }

        function addRsk(delay, callback) {
            if (rowIndex % 2 === 0) {
                mcdu.rightInputDelay[(rowIndex / 2) - 1] = (typeof delay === 'function') ? delay : () => delay;
                mcdu.onRightInput[(rowIndex / 2 - 1)] = callback;
            } else {
                console.error('[MCDU F-PLN] Tried to add an RSK when the last printed row did not have an LSK next to it. Only add LSKs on rows with even numbers.');
            }
        }

        function addRskAt(index, delay, callback) {
            mcdu.rightInputDelay = (typeof delay === 'function') ? delay() : () => delay;
            mcdu.onRightInput[index] = callback;
        }

        if (fpm.isCurrentFlightPlanTemporary()) {
            rowsCount = 5;

            printRowAt(10, [" ", " "]);
            printRowAt(11, ["{ERASE[color]amber", "INSERT*[color]amber"]);

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

            printRowAt(10, ["\xa0DEST", "DIST EFOB", isFlying ? "UTC{sp}" : "TIME{sp}{sp}"]);
            printRowAt(11, [destCell, destDistCell + " " + destEFOBCell, destTimeCell + "{sp}{sp}"]);

            addLskAt(5, () => mcdu.getDelaySwitchPage(), () => {
                CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), fpm.getWaypointsCount() - 1);
            });
        }
        const waypointsWithDiscontinuities = [];
        const routeFirstWaypointIndex = 1 + fpm.getDepartureWaypointsCount();
        const routeLastWaypointIndex = fpm.getLastIndexBeforeApproach();
        const realFirst = Math.max(0, fpm.getActiveWaypointIndex() - 1);

        // If we're still on the ground, force the active leg to be the first one even if we're close enough that the
        // FPM is trying to advance to the next one.
        const first = (mcdu.currentFlightPhase <= FmgcFlightPhases.TAKEOFF) ? 0 : realFirst;

        for (let i = first; i < fpm.getWaypointsCount(); i++) {
            const prev = waypointsWithDiscontinuities[waypointsWithDiscontinuities.length - 1];
            const wp = fpm.getWaypoint(i);
            if (!prev || (prev.wp && prev.wp.ident != wp.ident)) {
                waypointsWithDiscontinuities.push({ wp: fpm.getWaypoint(i) });
            }
        }
        const destination = waypointsWithDiscontinuities.pop();
        if (destination) {
            waypointsWithDiscontinuities.push(destination);
        }

        if (waypointsWithDiscontinuities.length === 0) {
            rowsCount = 0;
            rows = emptyFplnPage();
        } else {
            if (offset === 0) {
                showFrom = true;
            }
            printRow(["", "SPD/ALT\xa0\xa0\xa0", isFlying ? "UTC{sp}" : "TIME{sp}{sp}"]);
        }

        let wpIndex = offset;
        let lastAltitudeConstraint = "";
        let lastSpeedConstraint = "";
        const activeIdent = fpm.getActiveWaypointIdent();
        const activeIndex = waypointsWithDiscontinuities.findIndex(w => {
            return w.wp && w.wp.ident === activeIdent;
        });

        let discontinuityCount = 0;

        for (let bigRowIndex = 0; bigRowIndex < (waypointsWithDiscontinuities.length < rowsCount ? waypointsWithDiscontinuities.length + 1 : rowsCount); wpIndex++, bigRowIndex++) {
            let color = "green";
            if (fpm.getCurrentFlightPlanIndex() === 1) {
                color = "yellow";
            }
            const fixRow = bigRowIndex + discontinuityCount;
            if (waypointsWithDiscontinuities.length > 0) {
                wpIndex = wpIndex % (waypointsWithDiscontinuities.length + 1);
            }
            /**
             * @var stats contains only the waypoints which are in the active flightplan
             * The page displays the waypoint before the active one for which we don't have statistics.
             * The index must be incremented therefore
             *  */
            const statIndex = wpIndex;

            if (wpIndex === waypointsWithDiscontinuities.length - 1) {
                // Is last waypoint

                let destTimeCell = "----";
                const destDistCell = "---";
                let apprElev = "-----";
                let apprColor = "white";
                if (approachRunway) {
                    apprColor = color;
                }
                apprElev = apprElev.padStart(6,"\xa0");

                if (fpm.getDestination()) {
                    const destStats = stats.get(fpm.getCurrentFlightPlan().waypoints.length - 1);
                    if (isFlying) {
                        destTimeCell = FMCMainDisplay.secondsToUTC(destStats.etaFromPpos);
                    } else {
                        destTimeCell = FMCMainDisplay.secondsTohhmm(destStats.timeFromPpos);
                    }
                }

                if (bigRowIndex !== 0) {
                    printRow([]);
                }
                printRow([destCell + "[color]" + color, "{white}---{end}{" + apprColor + "}/" + apprElev + "{end}" + "[s-text]", destTimeCell + "{sp}{sp}[color]" + color + "[s-text]"]);

                addLsk(() => mcdu.getDelaySwitchPage(), (value) => {
                    if (value === "") {
                        CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), fpm.getWaypointsCount() - 1);
                    } else if (value.length > 0) {
                        mcdu.insertWaypoint(value, fpm.getWaypointsCount() - 1, () => {
                            CDUFlightPlanPage.ShowPage(mcdu, offset);
                        }, true);
                    }
                });
            } else if (wpIndex === waypointsWithDiscontinuities.length) {
                const rowNumber = wpIndex - offset;

                // Is past the last waypoint

                if (rowNumber < (rowsCount - 1)) {
                    printRow(Markers.END_OF_FPLN, true); // if last point then print the FPLN end
                }

                if (rowNumber < (rowsCount)) {
                    printRow(Markers.NO_ALTN_FPLN, true); // TODO make this actually check for an alternate F-PLN
                }
            } else if (wpIndex < waypointsWithDiscontinuities.length - 1) {
                // Is any other waypoint

                let prevWaypoint;
                let waypoint;
                if (waypointsWithDiscontinuities[wpIndex]) {
                    waypoint = waypointsWithDiscontinuities[wpIndex].wp;
                    if (waypointsWithDiscontinuities[wpIndex - 1]) {
                        prevWaypoint = waypointsWithDiscontinuities[wpIndex - 1].wp;
                    }
                }
                if (!waypoint) {
                    console.error("Should not reach.");
                } else {
                    let timeCell = "----";
                    if (isFlying) {
                        if (isFinite(waypoint.liveUTCTo) || isFinite(waypoint.waypointReachedAt)) {
                            timeCell = FMCMainDisplay.secondsToUTC((wpIndex >= activeIndex || waypoint.ident === "(DECEL)" ? stats.get(statIndex).etaFromPpos : waypoint.waypointReachedAt)) + "[s-text]";
                        }
                    } else {
                        if (isFinite(waypoint.liveETATo)) {
                            timeCell = FMCMainDisplay.secondsTohhmm(wpIndex >= activeIndex || waypoint.ident === "(DECEL)" ? stats.get(statIndex).timeFromPpos : 0) + "[s-text]";
                        }
                    }

                    if (wpIndex < fpm.getLastIndexBeforeApproach()) {
                        if (waypoint.infos.airwayIdentInFP === "") {
                            const prevWaypointWithDiscontinuity = waypointsWithDiscontinuities[wpIndex - 1];
                            if (prevWaypointWithDiscontinuity) {
                                prevWaypoint = prevWaypointWithDiscontinuity.wp;
                            }
                        }

                    }

                    const maxLineCount = rowsCount - discontinuityCount;

                    if (bigRowIndex < maxLineCount) { // enough space left before DEST line
                        let color = "green";
                        if (fpm.getCurrentFlightPlanIndex() === 1) {
                            color = "yellow";
                        } else if (waypoint === fpm.getActiveWaypoint()) {
                            color = "white";
                        }
                        let airwayName = "";
                        if (prevWaypoint && waypoint) {
                            let airway = undefined;
                            if (prevWaypoint.infos.airwayOut && prevWaypoint.infos.airwayOut === waypoint.infos.airwayIn) {
                                airway = {name: prevWaypoint.infos.airwayOut };
                            } else if (waypoint.infos.airwayIn && prevWaypoint.infos.airwayOut === undefined) {
                                airway = {name: waypoint.infos.airwayIn };
                            } else {
                                // vanilla Behavior that should not be working this way. (base don pilot feedback)
                                // airway = IntersectionInfo.GetCommonAirway(prevWaypoint, waypoint);
                            }
                            if (airway) {
                                airwayName = "\xa0" + airway.name;
                            }
                        }

                        // TODO actually use the correct prediction
                        const currentWaypointStatistics = stats.get(statIndex);
                        let distance;
                        let dstnc;
                        // active waypoint is live distance, others are distances in the flight plan
                        if (wpIndex === first) {
                            distance = currentWaypointStatistics.distanceFromPpos;
                        } else {
                            distance = currentWaypointStatistics.distanceInFP;
                        }
                        if (bigRowIndex === 1) {
                            dstnc = distance.toFixed(0).toString() + "NM";
                        } else {
                            dstnc = distance.toFixed(0).toString() + "\xa0\xa0";
                        }
                        for (let z = 0; z < 9 - dstnc.length; z++) {
                            dstnc = dstnc + "\xa0";
                        }
                        dstnc = dstnc + "[color]" + color;
                        if (wpIndex === 0 && offset == 0) {
                            showFrom = true;
                        }

                        // Setup fix header

                        let fixAnnotation;
                        if (wpIndex === 0 && offset === 0) {
                            fixAnnotation = "\xa0FROM";
                        } else if (fpm.getDepartureProcIndex() !== -1 && fpm.getDepartureWaypoints().some(fix => fix === waypoint)) {
                            const departure = fpm.getDeparture();
                            fixAnnotation = departure ? departure.name : undefined;
                        } else if (fpm.getArrivalProcIndex() !== -1 && fpm.getArrivalWaypoints().some(fix => fix === waypoint)) {
                            const arrival = fpm.getArrival();
                            fixAnnotation = arrival ? arrival.name : undefined;
                        } else {
                            fixAnnotation = airwayName;
                        }

                        // Render fix header

                        if (bigRowIndex > 0) {
                            printRow(renderFixHeader(wpIndex, bigRowIndex, fixAnnotation, activeIndex, dstnc, isFlying));
                        }

                        // Setup fix content

                        let speedConstraint = "---";
                        if (waypoint.speedConstraint > 10) {
                            speedConstraint = "{magenta}*{end}" + waypoint.speedConstraint.toFixed(0);
                            if (speedConstraint === lastSpeedConstraint) {
                                speedConstraint = "\xa0\"\xa0";
                            } else {
                                lastSpeedConstraint = speedConstraint;
                            }
                        }

                        let altitudeConstraint = "-----";
                        let altPrefix = "\xa0";
                        const isDepartureWayPoint = routeFirstWaypointIndex > 1 && fpm.getDepartureWaypoints().indexOf(waypointsWithDiscontinuities[wpIndex]) !== -1;

                        if (mcdu.transitionAltitude >= 100 && waypoint.legAltitude1 > mcdu.transitionAltitude) {
                            altitudeConstraint = (waypoint.legAltitude1 / 100).toFixed(0).toString();
                            altitudeConstraint = "FL" + altitudeConstraint.padStart(3,"0");
                        } else {
                            altitudeConstraint = waypoint.legAltitude1.toFixed(0).toString().padStart(5,"\xa0");
                        }
                        if (waypoint.legAltitudeDescription !== 0 && waypoint.ident !== "(DECEL)") {
                            altPrefix = "{magenta}*{end}";
                            if (waypoint.legAltitudeDescription === 4) {
                                altitudeConstraint = ((waypoint.legAltitude1 + waypoint.legAltitude2) * 0.5).toFixed(0).toString();
                                altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                            }
                        //predict altitude for STAR when constraints are missing
                        } else if (isDepartureWayPoint) {
                            altitudeConstraint = Math.floor(waypoint.cumulativeDistanceInFP * 0.14 * 6076.118 / 10);
                            altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                        //waypoint is the first or the last of the actual route
                        } else if ((wpIndex === routeFirstWaypointIndex - 1) || (wpIndex === routeLastWaypointIndex + 1)) {
                            altitudeConstraint = "FL" + mcdu.cruiseFlightLevel.toString().padStart(3,"0"); ;
                        //waypoint is in between on the route
                        } else if (wpIndex <= routeLastWaypointIndex && wpIndex >= routeFirstWaypointIndex) {
                            altitudeConstraint = "FL" + mcdu.cruiseFlightLevel.toString().padStart(3,"0"); ;

                        }
                        if (altitudeConstraint === lastAltitudeConstraint) {
                            altitudeConstraint = "\xa0\xa0\"\xa0\xa0";
                        } else {
                            lastAltitudeConstraint = altitudeConstraint;
                        }

                        let spdColor = color;
                        let altColor = color;

                        if (speedConstraint === "---") {
                            spdColor = "white";
                        }
                        if (altitudeConstraint === "-----") {
                            altColor = "white";
                        }

                        // Render fix content
                        printRow(renderFixContent(waypoint.ident, color, spdColor, speedConstraint, altColor, altPrefix, altitudeConstraint, timeCell));

                        // Setup fix LSK and RSk
                        const wpIndexOffset = wpIndex + first;

                        addLsk((value) => {
                            if (value === "") {
                                if (waypoint) {
                                    return mcdu.getDelaySwitchPage();
                                }
                            }
                            return mcdu.getDelayBasic();
                        }, (value) => {
                            if (value === "") {
                                if (waypoint) {
                                    CDULateralRevisionPage.ShowPage(mcdu, waypoint, wpIndex);
                                }
                            } else if (value === FMCMainDisplay.clrValue) {
                                mcdu.removeWaypoint(wpIndexOffset, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            } else if (value.length > 0) {
                                mcdu.insertWaypoint(value, wpIndexOffset, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            }
                        });

                        addRsk(() => mcdu.getDelaySwitchPage(), async (_value) => {
                            if (waypoint) {
                                CDUVerticalRevisionPage.ShowPage(mcdu, waypoint);
                            }
                        });

                        // Render fix discontinuity

                        if (waypoint.endsInDiscontinuity) {
                            printRow([""]);
                            printRow(Markers.FPLN_DISCONTINUITY);

                            // waypointsWithDiscontinuities will contain the list of waypoints the FPM has, except when
                            // the aircraft is still pre-takeoff - in which case the list is forced to start from the
                            // origin (to avoid sequencing to the next leg if we're particularly close to the end of
                            // the initial leg), meaning we need to offset the waypoint index we give to the FPM by the
                            // equivalent amount to select the correct waypoint.
                            const fpmIndex = wpIndex - (realFirst - first);

                            addLsk(0, (value) => {
                                if (value === FMCMainDisplay.clrValue) {
                                    if (waypoint.discontinuityCanBeCleared) {
                                        mcdu.clearDiscontinuity(fpmIndex, () => {
                                            CDUFlightPlanPage.ShowPage(mcdu, offset);
                                        }, true);
                                    }
                                    return;
                                }

                                mcdu.insertWaypoint(value, fpmIndex + 1, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            });

                            discontinuityCount++;
                        }
                    } else {
                        let destTimeCell = "----";
                        let destDistCell = "---";
                        if (fpm.getDestination()) {
                            const destStats = stats.get(fpm.getCurrentFlightPlan().waypoints.length - 1);

                            destDistCell = fpm.getDestination().infos.totalDistInFP.toFixed(0);
                            if (isFlying) {
                                destTimeCell = FMCMainDisplay.secondsToUTC(destStats.etaFromPpos);
                            } else {
                                destTimeCell = FMCMainDisplay.secondsTohhmm(destStats.timeFromPpos);
                            }
                        }

                        // Only set LSK if ERASE doesn't need to be displayed OR this is not the last fix row
                        if (fixRow !== MAX_FIX_ROW || !fpm.isCurrentFlightPlanTemporary()) {
                            // mcdu.leftInputDelay[fixRow] = () => mcdu.getDelaySwitchPage();
                            //
                            // mcdu.onLeftInput[fixRow] = () => {
                            //     CDULateralRevisionPage.ShowPage(mcdu, fpm.getDestination(), fpm.getWaypointsCount() - 1);
                            // };
                        }
                    }
                }
            }
        }
        mcdu.currentFlightPlanWaypointIndex = offset + first;
        SimVar.SetSimVarValue("L:A32NX_SELECTED_WAYPOINT", "number", offset + first);

        // Remove excess lines
        while (rows.length >= 13) {
            rows.pop();
        }

        mcdu.setTemplate([
            [`{left}{small}{sp}${showFrom ? "FROM" : "{sp}{sp}{sp}{sp}"}{end}{yellow}{sp}${showTMPY ? "TMPY" : ""}{end}{end}{right}{small}${SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")}{sp}{sp}{sp}{end}{end}`],
            ...rows
        ]);

        const allowScroll = waypointsWithDiscontinuities.length > 4;
        if (allowScroll) {//scroll only if there are more than 5 points
            mcdu.onDown = () => {//on page down decrement the page offset.
                if (offset > 0) { // if page not on top
                    offset--;
                } else { // else go to the bottom
                    offset = waypointsWithDiscontinuities.length;
                }
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            };
            mcdu.onUp = () => {
                if (offset < waypointsWithDiscontinuities.length) { // if page not on bottom
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

function renderFixHeader(wpIndex, bigRowIndex, fixAnnotation, activeIndex, dstnc, isFlying) {
    return [
        `{sp}${fixAnnotation}`,
        ((wpIndex >= activeIndex) && bigRowIndex !== 0 ? dstnc : bigRowIndex === 0 ? "SPD/ALT\xa0\xa0\xa0" : ""),
        bigRowIndex === 0 ? (isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}") : ""
    ];
}

function renderFixContent(ident, color, spdColor, speedConstraint, altColor, altPrefix, altitudeConstraint, timeCell) {
    return [
        `${ident}[color]${color}`,
        `{${spdColor}}${speedConstraint}{end}{${altColor}}/${altPrefix}${altitudeConstraint}{end}[s-text]`,
        `${timeCell}{sp}{sp}[color]white`
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
