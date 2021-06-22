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

            rows[rowIndex] = row;

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
                destDistCell = fpm.getDestination().liveDistanceTo.toFixed(0);
                destEFOBCell = (NXUnits.kgToUser(mcdu.getDestEFOB(isFlying))).toFixed(1);
                if (isFlying) {
                    destTimeCell = FMCMainDisplay.secondsToUTC(fpm.getDestination().liveUTCTo);
                } else {
                    destTimeCell = FMCMainDisplay.secondsTohhmm(fpm.getDestination().liveETATo);
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
        const routeLastWaypointIndex = fpm.getWaypointsCount() - 2 - fpm.getArrivalWaypointsCount();
        let first = 0;
        if (fpm.isActiveApproach()) {
            first = fpm.getWaypointsCount() - 1;
        } else {
            first = Math.max(0, fpm.getActiveWaypointIndex() - 1);
        }
        if (mcdu.currentFlightPhase <= FmgcFlightPhases.TAKEOFF) {
            first = 0;
        }
        for (let i = first; i < fpm.getWaypointsCount(); i++) {
            const prev = waypointsWithDiscontinuities[waypointsWithDiscontinuities.length - 1];
            const wp = fpm.getWaypoint(i);
            if (!prev || (prev.wp && prev.wp.ident != wp.ident)) {
                waypointsWithDiscontinuities.push({ wp: fpm.getWaypoint(i), fpIndex: i });
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

        let iWaypoint = offset;
        let lastAltitudeConstraint = "";
        let lastSpeedConstraint = "";
        const activeIdent = fpm.getActiveWaypointIdent();
        const activeIndex = waypointsWithDiscontinuities.findIndex(w => {
            return w.wp && w.wp.ident === activeIdent;
        });

        let discontinuityCount = 0;
        for (let i = 0; i < (rowsCount > waypointsWithDiscontinuities.length ? waypointsWithDiscontinuities.length + 1 : rowsCount); i++) {
            const fixRow = i + discontinuityCount;
            let color = "green";
            if (fpm.getCurrentFlightPlanIndex() === 1) {
                color = "yellow";
            }
            if (waypointsWithDiscontinuities.length > 0) {
                iWaypoint = iWaypoint % (waypointsWithDiscontinuities.length + 1);
            }
            const index = iWaypoint;
            iWaypoint++;

            if (index === waypointsWithDiscontinuities.length - 1) {
                // Is last waypoint

                let destTimeCell = "----";
                let destDistCell = "---";
                let apprElev = "-----";
                let apprColor = "white";
                if (approachRunway) {
                    apprColor = color;
                }
                apprElev = apprElev.padStart(6,"\xa0");

                if (fpm.getDestination()) {
                    destDistCell = fpm.getDestination().liveDistanceTo.toFixed(0);
                    if (isFlying) {
                        destTimeCell = FMCMainDisplay.secondsToUTC(fpm.getDestination().liveUTCTo);
                    } else {
                        destTimeCell = FMCMainDisplay.secondsTohhmm(fpm.getDestination().liveETATo);
                    }
                }

                printRow([]);
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
            } else if (index === waypointsWithDiscontinuities.length) {
                const rowNumber = index - offset;

                // Is past the last waypoint

                if (rowNumber < (rowsCount - 1)) {
                    printRow(Markers.END_OF_FPLN, true); // if last point then print the FPLN end
                }

                if (rowNumber < (rowsCount)) {
                    printRow(Markers.NO_ALTN_FPLN, true); // TODO make this actually check for an alternate F-PLN
                }
            } else if (index < waypointsWithDiscontinuities.length - 1) {
                // Is any other waypoint

                let prevWaypoint;
                let waypoint;
                let fpIndex = 0;
                if (waypointsWithDiscontinuities[index]) {
                    waypoint = waypointsWithDiscontinuities[index].wp;
                    if (waypointsWithDiscontinuities[index - 1]) {
                        prevWaypoint = waypointsWithDiscontinuities[index - 1].wp;
                    }
                    fpIndex = waypointsWithDiscontinuities[index].fpIndex;
                }
                if (!waypoint) {
                    console.error("Should not reach.");
                } else {
                    let timeCell = "----";
                    if (isFlying) {
                        if (isFinite(waypoint.liveUTCTo) || isFinite(fpm._waypointReachedAt)) {
                            timeCell = FMCMainDisplay.secondsToUTC((index >= activeIndex || waypoint.ident === "(DECEL)" ? waypoint.liveUTCTo : fpm._waypointReachedAt)) + "[s-text]";
                        }
                    } else {
                        if (isFinite(waypoint.liveETATo)) {
                            timeCell = FMCMainDisplay.secondsTohhmm(index >= activeIndex || waypoint.ident === "(DECEL)" ? waypoint.liveETATo : 0) + "[s-text]";
                        }
                    }
                    if (fpIndex > fpm.getDepartureWaypointsCount()) {
                        if (fpIndex < fpm.getWaypointsCount() - fpm.getArrivalWaypointsCount()) {
                            if (waypoint.infos.airwayIdentInFP === "") {
                                const prevWaypointWithDiscontinuity = waypointsWithDiscontinuities[index - 1];
                                if (prevWaypointWithDiscontinuity) {
                                    prevWaypoint = prevWaypointWithDiscontinuity.wp;
                                }
                            }
                        }
                    }

                    const maxLineCount = rowsCount - discontinuityCount;

                    if (i < maxLineCount) { // enough space left before DEST line
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

                        const ppos = {
                            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
                            long: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree longitude'),
                        };

                        const stats = fpm.getCurrentFlightPlan().computeActiveWaypointStatistics(ppos);

                        const distance = stats.distanceFromPpos;
                        let dstnc;
                        if (i === 1) {
                            dstnc = distance.toFixed(0).toString() + "NM";
                        } else {
                            dstnc = distance.toFixed(0).toString() + "\xa0\xa0";
                        }
                        for (let z = 0; z < 9 - dstnc.length; z++) {
                            dstnc = dstnc + "\xa0";
                        }
                        dstnc = dstnc + "[color]" + color;
                        if (index === 0 && offset == 0) {
                            showFrom = true;
                        }

                        // Setup fix header

                        let fixAnnotation;
                        if (index === 0 && offset === 0) {
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

                        if (i > 0) {
                            printRow(renderFixHeader(index, i, fixAnnotation, activeIndex, dstnc, isFlying));
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
                        const isDepartureWayPoint = routeFirstWaypointIndex > 1 && fpm.getDepartureWaypoints().indexOf(waypointsWithDiscontinuities[index]) !== -1;

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
                        } else if ((index === routeFirstWaypointIndex - 1) || (index === routeLastWaypointIndex + 1)) {
                            altitudeConstraint = "FL" + mcdu.cruiseFlightLevel.toString().padStart(3,"0"); ;
                        //waypoint is in between on the route
                        } else if (index <= routeLastWaypointIndex && index >= routeFirstWaypointIndex) {
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
                                    CDULateralRevisionPage.ShowPage(mcdu, waypoint, fpIndex);
                                }
                            } else if (value === FMCMainDisplay.clrValue) {
                                mcdu.removeWaypoint(fpIndex, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            } else if (value.length > 0) {
                                mcdu.insertWaypoint(value, fpIndex, () => {
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

                            addLsk(0, (value) => {
                                if (value === FMCMainDisplay.clrValue) {
                                    if (waypoint.discontinuityCanBeCleared) {
                                        mcdu.clearDiscontinuity(index, () => {
                                            CDUFlightPlanPage.ShowPage(mcdu, offset);
                                        }, true);
                                    }
                                    return;
                                }

                                mcdu.insertWaypoint(value, index + 1, () => {
                                    CDUFlightPlanPage.ShowPage(mcdu, offset);
                                }, true);
                            });

                            discontinuityCount++;
                        }
                    } else {
                        let destTimeCell = "----";
                        let destDistCell = "---";
                        if (fpm.getDestination()) {
                            destDistCell = fpm.getDestination().infos.totalDistInFP.toFixed(0);
                            if (isFlying) {
                                destTimeCell = FMCMainDisplay.secondsToUTC(fpm.getDestination().estimatedTimeOfArrivalFP);
                            } else {
                                destTimeCell = FMCMainDisplay.secondsTohhmm(fpm.getDestination().cumulativeEstimatedTimeEnRouteFP);
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
        const wpCount = fpm.getWaypointsCount();
        if (wpCount > 0) {
            while (mcdu.currentFlightPlanWaypointIndex < 0) {
                mcdu.currentFlightPlanWaypointIndex += wpCount;
            }
            while (mcdu.currentFlightPlanWaypointIndex >= wpCount) {
                mcdu.currentFlightPlanWaypointIndex -= wpCount;
            }
        }

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

function renderFixHeader(index, i, fixAnnotation, activeIndex, dstnc, isFlying) {
    return [
        `{sp}${fixAnnotation}`,
        ((index >= activeIndex) && i !== 0 ? dstnc : i === 0 ? "SPD/ALT\xa0\xa0\xa0" : ""),
        i === 0 ? (isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}") : ""
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
