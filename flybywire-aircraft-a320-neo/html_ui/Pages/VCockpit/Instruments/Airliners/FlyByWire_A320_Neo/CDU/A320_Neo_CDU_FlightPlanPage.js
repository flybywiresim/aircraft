class CDUFlightPlanPage {
    static ShowPage(fmc, mcdu, offset = 0) {
        fmc.flightPlanManager.updateWaypointDistances(false /* approach */);
        fmc.flightPlanManager.updateWaypointDistances(true /* approach */);
        mcdu.setCurrentPage(() => {
            CDUFlightPlanPage.ShowPage(fmc, mcdu, offset);
        }, 'FMGC');
        mcdu.returnPageCallback = () => {
            CDUFlightPlanPage.ShowPage(fmc, mcdu, offset);
        };

        // scrolls PLAN mode waypoints on ND
        // TODO tear out in CFPM/new ND
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", fmc.currentFlightPlanWaypointIndex);

        const flightPhase = SimVar.GetSimVarValue("L:A32NX_FWC_FLIGHT_PHASE", "Enum");
        const isFlying = flightPhase >= 5 && flightPhase <= 7;
        let originIdentCell = "----";
        let runway = null;
        let showFrom = false;
        let showTMPY = false;
        if (fmc.flightPlanManager.getOrigin()) {
            originIdentCell = fmc.flightPlanManager.getOrigin().ident;
            runway = fmc.flightPlanManager.getDepartureRunway();
            if (runway) {
                originIdentCell += Avionics.Utils.formatRunway(runway.designation);
            }
        }
        const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        let originTimeCell = "----";
        if (fmc.flightPlanManager.getOrigin()) {
            if (isFlying) {
                originTimeCell = FMCMainDisplay.secondsToUTC(fmc.flightPlanManager._waypointReachedAt);
            } else {
                originTimeCell = "0000";
                fmc.flightPlanManager._waypointReachedAt = utcTime;
            }
        }
        let destCell = "----";
        let approachRunway = null;
        if (fmc.flightPlanManager.getDestination()) {
            destCell = fmc.flightPlanManager.getDestination().ident;
            approachRunway = fmc.flightPlanManager.getApproachRunway();
            if (approachRunway) {
                destCell += Avionics.Utils.formatRunway(approachRunway.designation);
            }
        }
        let rows = [[""], [""], [""], [""], [""], [""], [""], [""], [""], [""], [""], [""],];
        let rowsCount = 5;
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            rowsCount = 5;
            rows[10] = [" ", " "];
            rows[11] = ["{ERASE[color]amber", "INSERT*[color]amber"];
            showTMPY = true;
            mcdu.onLeftInput[5] = async () => {
                fmc.eraseTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(fmc, mcdu, 0);
                    mcdu.requestOffsideUpdate();
                });
            };
            mcdu.onRightInput[5] = async () => {
                fmc.insertTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(fmc, mcdu, 0);
                    mcdu.requestOffsideUpdate();
                });
            };
        } else {
            let destTimeCell = "----";
            let destDistCell = "---";
            let destEFOBCell = "---";
            if (fmc.flightPlanManager.getDestination()) {
                destDistCell = fmc.flightPlanManager.getDestination().liveDistanceTo.toFixed(0);
                destEFOBCell = NXUnits.kgToUser(fmc.getDestEFOB(isFlying)).toFixed(1);
                if (isFlying) {
                    destTimeCell = FMCMainDisplay.secondsToUTC(fmc.flightPlanManager.getDestination().liveUTCTo);
                } else {
                    destTimeCell = FMCMainDisplay.secondsTohhmm(fmc.flightPlanManager.getDestination().liveETATo);
                }
            }
            if (!CDUInitPage.fuelPredConditionsMet(fmc)) {
                destEFOBCell = "---";
            }
            rows[10] = ["\xa0DEST", "DIST EFOB", isFlying ? "UTC{sp}" : "TIME{sp}{sp}" ];//set last row
            rows[11] = [destCell, destDistCell + " " + destEFOBCell, destTimeCell + "{sp}{sp}"];
            mcdu.leftInputDelay[5] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[5] = () => {
                if (fmc.dirTosInProcess > 0) {
                    mcdu.addNewMessage(NXSystemMessages.dirToInProcess);
                } else {
                    CDULateralRevisionPage.ShowPage(fmc, mcdu, fmc.flightPlanManager.getDestination(), fmc.flightPlanManager.getWaypointsCount() - 1);
                }
            };
        }
        const waypointsWithDiscontinuities = [];
        const routeFirstWaypointIndex = 1 + fmc.flightPlanManager.getDepartureWaypointsCount();
        const routeLastWaypointIndex = fmc.flightPlanManager.getWaypointsCount() - 2 - fmc.flightPlanManager.getArrivalWaypointsCount();
        let first = 0;
        if (fmc.flightPlanManager.isActiveApproach()) {
            first = fmc.flightPlanManager.getWaypointsCount() - 1;
        } else {
            first = Math.max(0, fmc.flightPlanManager.getActiveWaypointIndex() - 1);
        }
        if (fmc.currentFlightPhase <= FmgcFlightPhases.TAKEOFF) {
            first = 0;
        }
        for (let i = first; i < fmc.flightPlanManager.getWaypointsCount(); i++) {
            const prev = waypointsWithDiscontinuities[waypointsWithDiscontinuities.length - 1];
            const wp = fmc.flightPlanManager.getWaypoint(i);
            if (!prev || (prev.wp && prev.wp.ident != wp.ident)) {
                waypointsWithDiscontinuities.push({ wp: fmc.flightPlanManager.getWaypoint(i), fpIndex: i });
            }
        }
        const approachWaypoints = fmc.flightPlanManager.getApproachWaypoints();
        const destination = waypointsWithDiscontinuities.pop();
        for (let i = 0; i < approachWaypoints.length; i++) {
            const prev = waypointsWithDiscontinuities[waypointsWithDiscontinuities.length - 1];
            const wp = approachWaypoints[i];
            if (!prev || (prev.wp && prev.wp.ident != wp.ident)) {
                waypointsWithDiscontinuities.push({
                    wp: wp,
                    fpIndex: -42
                });
            }
        }
        if (destination) {
            waypointsWithDiscontinuities.push(destination);
        }
        if (fmc.flightPlanManager.decelWaypoint) {
            const idx = waypointsWithDiscontinuities.length > 1 ?
                waypointsWithDiscontinuities.findIndex((e) => e.wp.cumulativeDistanceInFP > fmc.flightPlanManager.decelWaypoint.cumulativeDistanceInFP) : 0;
            if (idx >= 0 && idx < waypointsWithDiscontinuities.length) {
                waypointsWithDiscontinuities.splice(idx, 0, {
                    wp: fmc.flightPlanManager.decelWaypoint,
                    fpIndex: -42
                });
            }
        }
        if (waypointsWithDiscontinuities.length === 0) {
            rowsCount = 0;
            originIdentCell = "";
            rows = [
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
        } else {
            if (offset === 0) {
                showFrom = true;
            }
            rows[0] = ["", "SPD/ALT\xa0\xa0\xa0", isFlying ? "UTC{sp}" : "TIME{sp}{sp}"];
        }
        let iWaypoint = offset;
        let lastAltitudeConstraint = "";
        let lastSpeedConstraint = "";
        const activeIdent = fmc.flightPlanManager.getActiveWaypointIdent();
        const activeIndex = waypointsWithDiscontinuities.findIndex(w => {
            return w.wp && w.wp.ident === activeIdent;
        });
        for (let i = 0; i < (rowsCount > waypointsWithDiscontinuities.length ? waypointsWithDiscontinuities.length + 1 : rowsCount); i++) {
            let color = "green";
            if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                color = "yellow";
            }
            if (waypointsWithDiscontinuities.length > 0) {
                iWaypoint = iWaypoint % (waypointsWithDiscontinuities.length + 1);
            }
            const index = iWaypoint;
            iWaypoint++;
            let depAltColor = "white";
            let depAlt = "-----";
            if (runway) {
                depAlt = (runway.elevation * 3.280).toFixed(0).toString();
                depAltColor = color;
            }
            depAlt = depAlt.padStart(6,"\xa0");
            if (index === 0 && first === 0) {
                rows[2 * i + 1] = [originIdentCell + "[color]" + color, "{white}---{end}{" + depAltColor + "}/" + depAlt + "{end}" + "[s-text]", originTimeCell + "{sp}{sp}[color]" + color + "[s-text]"];
                mcdu.leftInputDelay[i] = () => {
                    return mcdu.getDelaySwitchPage();
                };
                mcdu.onLeftInput[i] = async (value) => {
                    if (value === "") {
                        CDULateralRevisionPage.ShowPage(fmc, mcdu, fmc.flightPlanManager.getOrigin(), 0);
                    }
                };
            } else if (index === waypointsWithDiscontinuities.length - 1) {
                let destTimeCell = "----";
                let destDistCell = "---";
                let apprElev = "-----";
                let apprColor = "white";
                if (approachRunway) {
                    apprColor = color;
                }
                apprElev = apprElev.padStart(6,"\xa0");
                if (fmc.flightPlanManager.getDestination()) {
                    destDistCell = fmc.flightPlanManager.getDestination().liveDistanceTo.toFixed(0);
                    if (isFlying) {
                        destTimeCell = FMCMainDisplay.secondsToUTC(fmc.flightPlanManager.getDestination().liveUTCTo);
                    } else {
                        destTimeCell = FMCMainDisplay.secondsTohhmm(fmc.flightPlanManager.getDestination().liveETATo);
                    }
                    mcdu.leftInputDelay[i] = () => {
                        return mcdu.getDelaySwitchPage();
                    };
                    mcdu.onLeftInput[i] = (value) => {
                        if (value === "") {
                            CDULateralRevisionPage.ShowPage(fmc, mcdu, fmc.flightPlanManager.getDestination(), fmc.flightPlanManager.getWaypointsCount() - 1);
                        } else if (value === FMCMainDisplay.clrValue) {
                        } else if (value.length > 0) {
                            fmc.insertWaypoint(mcdu, value, fmc.flightPlanManager.getWaypointsCount() - 1, () => {
                                mcdu.requestUpdate();
                            });
                        }
                    };
                }
                rows[2 * i + 1] = [destCell + "[color]" + color, "{white}---{end}{" + apprColor + "}/" + apprElev + "{end}" + "[s-text]", destTimeCell + "{sp}{sp}[color]" + color + "[s-text]"];
            } else if (index === waypointsWithDiscontinuities.length) {
                rows[2 * i + 1] = ["------END OF F-PLN-------"]; // if last point then print the FPLN end
            } else if (index < waypointsWithDiscontinuities.length - 1) {
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
                        if (isFinite(waypoint.liveUTCTo) || isFinite(fmc.flightPlanManager._waypointReachedAt)) {
                            timeCell = FMCMainDisplay.secondsToUTC((index >= activeIndex || waypoint.ident === "(DECEL)" ? waypoint.liveUTCTo : fmc.flightPlanManager._waypointReachedAt)) + "[s-text]";
                        }
                    } else {
                        if (isFinite(waypoint.liveETATo)) {
                            timeCell = FMCMainDisplay.secondsTohhmm(index >= activeIndex || waypoint.ident === "(DECEL)" ? waypoint.liveETATo : 0) + "[s-text]";
                        }
                    }
                    if (fpIndex > fmc.flightPlanManager.getDepartureWaypointsCount()) {
                        if (fpIndex < fmc.flightPlanManager.getWaypointsCount() - fmc.flightPlanManager.getArrivalWaypointsCount()) {
                            if (waypoint.infos.airwayIdentInFP === "") {
                                const prevWaypointWithDiscontinuity = waypointsWithDiscontinuities[index - 1];
                                if (prevWaypointWithDiscontinuity) {
                                    prevWaypoint = prevWaypointWithDiscontinuity.wp;
                                }
                            }
                        }
                    }
                    if (i < rowsCount) { // enough space left before DEST line
                        let color = "green";
                        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                            color = "yellow";
                        } else if (waypoint === fmc.flightPlanManager.getActiveWaypoint()) {
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
                        const distance = (waypoint === fmc.flightPlanManager.getActiveWaypoint() ? waypoint.liveDistanceTo : waypoint.distanceInFP);
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
                        rows[2 * i] = [airwayName, ((index >= activeIndex || waypoint.ident === "(DECEL)") && i != 0 ? dstnc : i === 0 ? "SPD/ALT\xa0\xa0\xa0" : ""), i === 0 ? (isFlying ? "\xa0UTC{sp}" : "TIME{sp}{sp}") : ""];
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
                        const isDepartureWayPoint = routeFirstWaypointIndex > 1 && fmc.flightPlanManager.getDepartureWaypoints().indexOf(waypointsWithDiscontinuities[index]) !== -1;

                        if (fmc.transitionAltitude >= 100 && waypoint.legAltitude1 > fmc.transitionAltitude) {
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
                            altitudeConstraint = "FL" + fmc.cruiseFlightLevel.toString().padStart(3,"0"); ;
                        //waypoint is in between on the route
                        } else if (index <= routeLastWaypointIndex && index >= routeFirstWaypointIndex) {
                            altitudeConstraint = "FL" + fmc.cruiseFlightLevel.toString().padStart(3,"0"); ;

                        }
                        if (altitudeConstraint === lastAltitudeConstraint) {
                            altitudeConstraint = "\xa0\xa0\"\xa0\xa0";
                        } else {
                            lastAltitudeConstraint = altitudeConstraint;
                        }
                        if (fpIndex !== -42) {
                            mcdu.leftInputDelay[i] = (value) => {
                                if (value === "") {
                                    if (waypoint) {
                                        return mcdu.getDelaySwitchPage();
                                    }
                                }
                                return mcdu.getDelayBasic();
                            };
                            mcdu.onLeftInput[i] = async (value) => {
                                if (value === "") {
                                    if (waypoint) {
                                        CDULateralRevisionPage.ShowPage(fmc, mcdu, waypoint, fpIndex);
                                    }
                                } else if (value === FMCMainDisplay.clrValue) {
                                    fmc.removeWaypoint(fpIndex, () => {
                                        mcdu.requestUpdate();
                                    });
                                } else if (value.length > 0) {
                                    fmc.insertWaypoint(mcdu, value, fpIndex, () => {
                                        mcdu.requestUpdate();
                                    });
                                }
                            };
                            mcdu.rightInputDelay[i] = () => {
                                return mcdu.getDelaySwitchPage();
                            };
                            mcdu.onRightInput[i] = async () => {
                                if (fmc.dirTosInProcess > 0) {
                                    mcdu.addNewMessage(NXSystemMessages.dirToInProcess);
                                } else if (waypoint) {
                                    CDUVerticalRevisionPage.ShowPage(fmc, mcdu, waypoint);
                                }
                            };
                        }

                        if (fmc.activeHold && fmc.activeHold.has(waypoint.ident)) {
                            const holdRows = [
                                [waypoint.ident + "[color]" + color, speedConstraint + "/" + altitudeConstraint + "[s-text][color]" + color, timeCell + "{sp}{sp}[color]" + color],
                                ["" , "IMM[color]cyan" , "HOLD"],
                                ["HOLD " + fmc.activeHold.get(waypoint.ident).turn + "[color]" + color, "EXIT*[color]cyan", "SPD " + fmc.activeHold.get(waypoint.ident).speed],
                                ["C" + fmc.activeHold.get(waypoint.ident).course.toFixed(0) + "°"],
                                [waypoint.ident + "[color]" + color, speedConstraint + "/" + altitudeConstraint + "[s-text][color]" + color, timeCell + "{sp}{sp}[color]" + color]
                            ];

                            mcdu.rightInputDelay[i + 1] = () => {
                                return mcdu.getDelaySwitchPage();
                            };
                            // place the button input on the HOLD line to clear the hold
                            mcdu.onRightInput[i + 1] = async () => {
                                // TODO remove any active waypoints and route to active waypoint
                                fmc.activeHold = null;
                                mcdu.requestUpdate();
                            };

                            for (let j = 0; i < rowsCount; i++) {
                                rows[2 * i + 1] = holdRows[j++];
                                if (i == rowsCount - 1 || j >= holdRows.length) {
                                    break;
                                }

                                rows[2 * i + 2] = holdRows[j++];
                            }
                        } else {
                            let spdColor = color;
                            let altColor = color;
                            if (speedConstraint === "---") {
                                spdColor = "white";
                            }
                            if (altitudeConstraint === "-----") {
                                altColor = "white";
                            }
                            rows[2 * i + 1] = [waypoint.ident + "[color]" + color,
                                "{" + spdColor + "}" + speedConstraint + "{end}" + "{" + altColor + "}/" + altPrefix + altitudeConstraint + "{end}[s-text]",
                                timeCell + "{sp}{sp}[color]" + color];
                        }
                    } else {
                        let destTimeCell = "----";
                        let destDistCell = "---";
                        if (fmc.flightPlanManager.getDestination()) {
                            destDistCell = fmc.flightPlanManager.getDestination().infos.totalDistInFP.toFixed(0);
                            if (isFlying) {
                                destTimeCell = FMCMainDisplay.secondsToUTC(fmc.flightPlanManager.getDestination().estimatedTimeOfArrivalFP);
                            } else {
                                destTimeCell = FMCMainDisplay.secondsTohhmm(fmc.flightPlanManager.getDestination().cumulativeEstimatedTimeEnRouteFP);
                            }
                        }
                        mcdu.leftInputDelay[i] = () => {
                            return mcdu.getDelaySwitchPage();
                        };
                        mcdu.onLeftInput[i] = () => {
                            CDULateralRevisionPage.ShowPage(fmc, mcdu, fmc.flightPlanManager.getDestination(), fmc.flightPlanManager.getWaypointsCount() - 1);
                        };
                    }
                }
            }
        }
        fmc.currentFlightPlanWaypointIndex = offset + first;
        const wpCount = fmc.flightPlanManager.getWaypointsCount() + approachWaypoints.length;
        if (wpCount > 0) {
            while (fmc.currentFlightPlanWaypointIndex < 0) {
                fmc.currentFlightPlanWaypointIndex += wpCount;
            }
            while (fmc.currentFlightPlanWaypointIndex >= wpCount) {
                fmc.currentFlightPlanWaypointIndex -= wpCount;
            }
        }
        mcdu.setTemplate([
            [`{left}{small}{sp}${showFrom ? "FROM" : "{sp}{sp}{sp}{sp}"}{end}{yellow}{sp}${showTMPY ? "TMPY" : ""}{end}{end}{right}{small}${fmc.flightNumber || ''}{sp}{sp}{sp}{end}{end}`],
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
                CDUFlightPlanPage.ShowPage(fmc, mcdu, offset);
            };
            mcdu.onUp = () => {
                if (offset < waypointsWithDiscontinuities.length) { // if page not on bottom
                    offset++;
                } else { // else go on top
                    offset = 0;
                }
                CDUFlightPlanPage.ShowPage(fmc, mcdu, offset);
            };
        }
        mcdu.setArrows(allowScroll, allowScroll, true, true);
    }
}
