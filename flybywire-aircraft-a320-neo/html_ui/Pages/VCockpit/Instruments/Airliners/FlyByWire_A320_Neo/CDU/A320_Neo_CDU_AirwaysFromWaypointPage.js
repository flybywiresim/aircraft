class A320_Neo_CDU_AirwaysFromWaypointPage {
    static ShowPage(mcdu, waypoint, offset = 0, pendingAirway) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.AirwaysFromWaypointPage;
        const rows = [["----"], [""], [""], [""], [""]];
        const subRows = [["VIA", ""], [""], [""], [""], [""]];
        const allRows = A320_Neo_CDU_AirwaysFromWaypointPage._GetAllRows(mcdu,waypoint);
        const page = (2 + (Math.floor(offset / 4)));
        const pageCount = (Math.floor(allRows.length / 4) + 2);
        let rowBottomLine = ["<RETURN"];
        if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            rowBottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];
            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.copyAirwaySelections();
                    mcdu.updateConstraints();
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            };
        }
        mcdu.onLeftInput[5] = async () => {
            mcdu.eraseTemporaryFlightPlan(() => {
                CDUFlightPlanPage.ShowPage(mcdu, 0);
            });
        };
        allRows.forEach((r, idx) => {
            if (r[0] != "" && r[1] != "") {
                subRows[idx] = ["\xa0VIA", "TO\xa0"];
            }
        });
        let showInput = false;
        const departureWaypoints = mcdu.flightPlanManager.getDepartureWaypoints();
        const routeWaypoints = mcdu.flightPlanManager.getEnRouteWaypoints();
        for (let i = 0; i < rows.length; i++) {
            if (allRows[i + offset]) {
                rows[i] = allRows[i + offset];
            } else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    subRows[i] = ["\xa0VIA", ""];
                    rows[i] = ["[\xa0\xa0\xa0][color]cyan", ""];
                    mcdu.onRightInput[i] = async (value, scratchpadCallback) => {
                        if (value.length > 0) {
                            mcdu.insertWaypoint(value, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, (success) => {
                                if (!success) {
                                    scratchpadCallback(value);
                                }
                                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset);
                            });
                        }
                    };
                    mcdu.onLeftInput[i] = async (value, scratchpadCallback) => {
                        if (value.length > 0) {
                            mcdu.ensureCurrentFlightPlanIsTemporary(async () => {
                                const airway = await this._getAirway(mcdu, value);
                                if (airway) {
                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset, airway);
                                } else {
                                    mcdu.addNewMessage(NXSystemMessages.awyWptMismatch);
                                    scratchpadCallback(value);
                                }
                            });
                        }
                    };
                } else if (pendingAirway) {
                    subRows[i] = ["\xa0VIA", "TO\xa0"];
                    rows[i] = [`${pendingAirway.name}[color]cyan`, "[\xa0\xa0\xa0][color]cyan"];
                    mcdu.onRightInput[i] = (value, scratchpadCallback) => {
                        if (value.length > 0) {
                            mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                                mcdu.insertWaypointsAlongAirway(value, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                    if (result) {
                                        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset);
                                    } else {
                                        mcdu.addNewMessage(NXSystemMessages.awyWptMismatch);
                                        scratchpadCallback(value);
                                    }
                                });
                            });
                        }
                    };
                    if (i + 1 < rows.length) {
                        rows[i + 1] = ["[\xa0\xa0\xa0][color]cyan", ""];
                        subRows[i + 1] = ["\xa0VIA", ""];
                        mcdu.onLeftInput[i + 1] = async (value, scratchpadCallback) => {
                            if (value.length > 0) {
                                const toWp = await this._getFirstIntersection(mcdu.flightPlanManager, value, pendingAirway.icaos);
                                if (toWp) {
                                    mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                                        mcdu.insertWaypointsAlongAirway(toWp, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, async (result) => {
                                            if (result) {
                                                const airway = await this._getAirway(mcdu, value);
                                                if (airway) {
                                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset, airway);
                                                } else {
                                                    mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                                    scratchpadCallback(value);
                                                }
                                            } else {
                                                mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                                scratchpadCallback(value);
                                            }
                                        });
                                    });
                                } else {
                                    mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                    scratchpadCallback(value);
                                }
                            } else {
                                mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                scratchpadCallback(value);
                            }
                        };
                    }
                }
            }
        }
        mcdu.setTemplate([
            ["AIRWAYS {small}FROM {end}{green}" + waypoint.ident + "{end}"],
            subRows[0],
            rows[0],
            subRows[1],
            rows[1],
            subRows[2],
            rows[2],
            subRows[3],
            rows[3],
            subRows[4],
            rows[4],
            [""],
            rowBottomLine
        ]);
    }
    static _GetAllRows(mcdu, currentWP) {
        const allRows = [];
        const flightPlan = mcdu.flightPlanManager;
        if (flightPlan) {
            const routeWaypoints = flightPlan.getEnRouteWaypoints();
            let indexOfWP = 0;
            routeWaypoints.forEach((wyp, idx) => {
                if (wyp.ident === currentWP.ident) {
                    indexOfWP = idx;
                }
            });
            let inx = indexOfWP === -1 ? 1 : indexOfWP + 1;
            inx = mcdu.flightPlanManager.getDepartureWaypoints().length ? inx - 1 : inx;
            const lastWaypoint = mcdu.flightPlanManager.getWaypoints()[mcdu.flightPlanManager.getEnRouteWaypointsLastIndex()];
            for (let i = inx; i < routeWaypoints.length; i++) {
                const wp = routeWaypoints[i];
                if (wp) {
                    let color = 'green';
                    if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
                        color = 'cyan';
                    }
                    if (wp.infos.airwayIn === undefined) {
                        // allRows.push(["DIRECT", wp.ident]);
                    } else {
                        if (wp.infos.airwayIn !== wp.infos.airwayOut) {
                            allRows.push([`${wp.infos.airwayIn}[color]${color}`, `${wp.ident}[color]${color}`]);
                        }
                    }
                }
            }
        }
        return allRows;
    }

    static async _getAirway(mcdu, value) {
        const lastWaypoint = mcdu.flightPlanManager.getWaypoints()[mcdu.flightPlanManager.getEnRouteWaypointsLastIndex()];
        await lastWaypoint.infos.UpdateAirway(value);
        if (lastWaypoint.infos instanceof IntersectionInfo || lastWaypoint.infos instanceof VORInfo || lastWaypoint.infos instanceof NDBInfo) {
            return lastWaypoint.infos.airways.find(a => {
                return a.name === value;
            });
        }
    }

    /**
     * Distance is measured in number of fixes, not a real distance unit.
     * Searching around current fixes index.
     */
    static async _getFirstIntersection(fpm, value, icaos) {
        const ident = fpm.getWaypoints()[fpm.getEnRouteWaypointsLastIndex()].ident;
        const identIdx = icaos.findIndex(x => x.substring(4).trim() === ident);
        for (let i = 0; i < icaos.length - identIdx; i++) {
            let res = await this._getRoute(fpm, value, icaos[identIdx + i]);
            if (res) {
                return icaos[identIdx + i].substring(4).trim();
            }
            if (identIdx - i < 0 || i === 0) {
                continue;
            }
            res = await this._getRoute(fpm, value, icaos[identIdx - i]);
            if (res) {
                return icaos[identIdx - i].substring(4).trim();
            }
        }
    }

    static async _getRoute(fpm, value, ident) {
        return (await fpm.instrument.facilityLoader.getIntersectionData(ident)).routes.find(a => {
            return a.name === value;
        });
    }
}
