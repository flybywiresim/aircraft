class A320_Neo_CDU_AirwaysFromWaypointPage {
    static ShowPage(mcdu, waypoint, offset = 0, pendingAirway) {
        mcdu.clearDisplay();
        const rows = [["----"], [""], [""], [""], [""]];
        const allRows = A320_Neo_CDU_AirwaysFromWaypointPage._GetAllRows(mcdu);
        const page = (2 + (Math.floor(offset / 4)));
        const pageCount = (Math.floor(allRows.length / 4) + 2);
        let rowBottomLabel = [""];
        let rowBottomLine = ["<RETURN"];
        if (mcdu.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            rowBottomLabel = ["TMPY[color]red", "TMPY[color]red"];
            rowBottomLine = ["*ERASE[color]red", "INSERT*[color]red"];
            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, 0);
                });
            };
        }
        mcdu.onLeftInput[5] = async () => {
            mcdu.eraseTemporaryFlightPlan(() => {
                CDUFlightPlanPage.ShowPage(mcdu, 0);
            });
        };
        let showInput = false;
        const departureWaypoints = mcdu.flightPlanManager.getDepartureWaypoints();
        const routeWaypoints = mcdu.flightPlanManager.getEnRouteWaypoints();
        offset = routeWaypoints.indexOf(waypoint) >= 0 ? routeWaypoints.indexOf(waypoint) + (departureWaypoints.length ? 1 : 0) + 1 : offset;
        for (let i = 0; i < rows.length; i++) {
            if (allRows[i + offset]) {
                rows[i] = allRows[i + offset];
            } else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    rows[i] = ["[ ][color]blue", "[ ][color]blue"];
                    mcdu.onRightInput[i] = async () => {
                        const value = mcdu.inOut;
                        if (value.length > 0) {
                            mcdu.clearUserInput();
                            mcdu.insertWaypoint(value, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, () => {
                                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset);
                            });
                        }
                    };
                    mcdu.onLeftInput[i] = async () => {
                        const value = mcdu.inOut;
                        if (value.length > 0) {
                            mcdu.clearUserInput();
                            const lastWaypoint = mcdu.flightPlanManager.getWaypoints()[mcdu.flightPlanManager.getEnRouteWaypointsLastIndex()];
                            if (lastWaypoint.infos instanceof IntersectionInfo) {
                                const airway = lastWaypoint.infos.airways.find(a => {
                                    return a.name === value;
                                });
                                if (airway) {
                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset, airway);
                                } else {
                                    mcdu.showErrorMessage("NOT IN DATABASE");
                                }
                            }
                        }
                    };
                } else {
                    rows[i] = [pendingAirway.name, "[ ][color]blue"];
                    mcdu.onRightInput[i] = () => {
                        const value = mcdu.inOut;
                        if (value.length > 0) {
                            mcdu.clearUserInput();
                            mcdu.insertWaypointsAlongAirway(value, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                if (result) {
                                    A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset);
                                }
                            });
                        }
                    };
                    if (rows[i + 1]) {
                        rows[i + 1] = ["-----"];
                    }
                }
            }
        }
        mcdu.setTemplate([
            ["AIRWAYS FROM " + waypoint.ident],
            ["VIA", "TO"],
            rows[0],
            [""],
            rows[1],
            [""],
            rows[2],
            [""],
            rows[3],
            [""],
            rows[4],
            rowBottomLabel,
            rowBottomLine
        ]);
    }
    static _GetAllRows(fmc) {
        const allRows = [];
        const flightPlan = fmc.flightPlanManager;
        if (flightPlan) {
            const departure = flightPlan.getDeparture();
            if (departure) {
                const departureWaypoints = flightPlan.getDepartureWaypoints();
                const lastDepartureWaypoint = departureWaypoints[departureWaypoints.length - 1];
                if (lastDepartureWaypoint) {
                    allRows.push([departure.name, lastDepartureWaypoint.ident]);
                }
            }
            const routeWaypoints = flightPlan.getEnRouteWaypoints();
            for (let i = 0; i < routeWaypoints.length; i++) {
                const prev = routeWaypoints[i - 1];
                const wp = routeWaypoints[i];
                const next = routeWaypoints[i + 1];
                if (wp) {
                    const prevAirway = IntersectionInfo.GetCommonAirway(prev, wp);
                    if (!prevAirway) {
                        allRows.push(["DIRECT", wp.ident]);
                    } else {
                        allRows.push([prevAirway.name, wp.ident]);
                    }
                }
            }
        }
        return allRows;
    }
}
//# sourceMappingURL=A320_Neo_CDU_AirwaysFromWaypointPage.js.map