class A320_Neo_CDU_AirwaysFromWaypointPage {
    // TODO may need to store some of the state on an instance... probably shouldn't actually be synced?
    static ShowPage(fmc, mcdu, waypoint, offset = 0, pendingAirway) {
        mcdu.setCurrentPage(() => {
            A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(fmc, mcdu, waypoint, offset, pendingAirway);
        });

        const rows = [["----"], [""], [""], [""], [""]];
        const subRows = [["VIA", ""], [""], [""], [""], [""]];
        const allRows = A320_Neo_CDU_AirwaysFromWaypointPage._GetAllRows(fmc, waypoint);
        const page = (2 + (Math.floor(offset / 4)));
        const pageCount = (Math.floor(allRows.length / 4) + 2);
        let rowBottomLine = ["<RETURN"];
        if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            rowBottomLine = ["{ERASE[color]amber", "INSERT*[color]amber"];
            mcdu.onRightInput[5] = async () => {
                fmc.insertTemporaryFlightPlan(() => {
                    fmc.copyAirwaySelections();
                    fmc.updateConstraints();
                    CDUFlightPlanPage.ShowPage(fmc, mcdu, 0);
                    mcdu.requestOffsideUpdate();
                });
            };
        }
        mcdu.onLeftInput[5] = async () => {
            fmc.eraseTemporaryFlightPlan(() => {
                CDUFlightPlanPage.ShowPage(fmc, mcdu, 0);
                mcdu.requestOffsideUpdate();
            });
        };
        allRows.forEach((r, idx) => {
            if (r[0] != "" && r[1] != "") {
                subRows[idx] = ["\xa0VIA", "TO\xa0"];
            }
        });
        let showInput = false;
        const departureWaypoints = fmc.flightPlanManager.getDepartureWaypoints();
        const routeWaypoints = fmc.flightPlanManager.getEnRouteWaypoints();
        for (let i = 0; i < rows.length; i++) {
            if (allRows[i + offset]) {
                rows[i] = allRows[i + offset];
            } else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    subRows[i] = ["\xa0VIA", ""];
                    rows[i] = ["[\xa0\xa0\xa0][color]cyan", ""];
                    mcdu.onRightInput[i] = async (value) => {
                        if (value.length > 0) {
                            fmc.insertWaypoint(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, () => {
                                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(fmc, mcdu, waypoint, offset);
                            });
                        }
                    };
                    mcdu.onLeftInput[i] = async (value) => {
                        if (value.length > 0) {
                            fmc.ensureCurrentFlightPlanIsTemporary(async () => {
                                const airway = await this._getAirway(mcdu, value);
                                if (airway) {
                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(fmc, mcdu, waypoint, offset, airway);
                                } else {
                                    mcdu.addNewMessage(NXSystemMessages.awyWptMismatch);
                                }
                                mcdu.requestOffsideUpdate();
                            });
                        }
                    };
                } else if (pendingAirway) {
                    subRows[i] = ["\xa0VIA", "TO\xa0"];
                    rows[i] = [`${pendingAirway.name}[color]cyan`, "[\xa0\xa0\xa0][color]cyan"];
                    mcdu.onRightInput[i] = (value) => {
                        if (value.length > 0) {
                            fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                fmc.insertWaypointsAlongAirway(value, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                    if (result) {
                                        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(fmc, mcdu, waypoint, offset);
                                    } else {
                                        mcdu.addNewMessage(NXSystemMessages.awyWptMismatch);
                                    }
                                });
                                mcdu.requestOffsideUpdate();
                            });
                        }
                    };
                    if (i + 1 < rows.length) {
                        rows[i + 1] = ["[\xa0\xa0\xa0][color]cyan", ""];
                        subRows[i + 1] = ["\xa0VIA", ""];
                        mcdu.onLeftInput[i + 1] = async (value) => {
                            if (value.length > 0) {
                                const toWp = await this._getFirstIntersection(fmc.flightPlanManager, value, pendingAirway.icaos);
                                if (toWp) {
                                    fmc.ensureCurrentFlightPlanIsTemporary(() => {
                                        fmc.insertWaypointsAlongAirway(toWp, fmc.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, async (result) => {
                                            if (result) {
                                                const airway = await this._getAirway(fmc, value);
                                                if (airway) {
                                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(fmc, mcdu, waypoint, offset, airway);
                                                } else {
                                                    mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                                }
                                            } else {
                                                mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                            }
                                        });
                                        mcdu.requestOffsideUpdate();
                                    });
                                } else {
                                    mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
                                }
                            } else {
                                mcdu.addNewMessage(NXSystemMessages.noIntersectionFound);
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
    static _GetAllRows(fmc, currentWP) {
        const allRows = [];
        const flightPlan = fmc.flightPlanManager;
        if (flightPlan) {
            const routeWaypoints = flightPlan.getEnRouteWaypoints();
            let indexOfWP = 0;
            routeWaypoints.forEach((wyp, idx) => {
                if (wyp.ident === currentWP.ident) {
                    indexOfWP = idx;
                }
            });
            let inx = indexOfWP === -1 ? 1 : indexOfWP + 1;
            inx = fmc.flightPlanManager.getDepartureWaypoints().length ? inx - 1 : inx;
            const lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
            for (let i = inx; i < routeWaypoints.length; i++) {
                const wp = routeWaypoints[i];
                if (wp) {
                    let color = 'green';
                    if (fmc.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
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

    static async _getAirway(fmc, value) {
        const lastWaypoint = fmc.flightPlanManager.getWaypoints()[fmc.flightPlanManager.getEnRouteWaypointsLastIndex()];
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
