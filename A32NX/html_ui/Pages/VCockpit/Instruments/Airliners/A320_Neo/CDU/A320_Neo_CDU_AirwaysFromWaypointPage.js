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
            rowBottomLine = ["{ERASE[color]red", "INSERT*[color]red"];
            mcdu.onRightInput[5] = async () => {
                mcdu.insertTemporaryFlightPlan(() => {
                    mcdu.copyAirwaySelections();
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
                subRows[idx] = ["VIA", "TO"];
            }
        });
        mcdu._titleElement.innerHTML = `<span><span>AIRWAYS</span> <span class='s-text'>FROM </span><span class='green'>${waypoint.ident}</span></span>`;
        let showInput = false;
        const departureWaypoints = mcdu.flightPlanManager.getDepartureWaypoints();
        const routeWaypoints = mcdu.flightPlanManager.getEnRouteWaypoints();
        for (let i = 0; i < rows.length; i++) {
            if (allRows[i + offset]) {
                rows[i] = allRows[i + offset];
            } else if (!showInput) {
                showInput = true;
                if (!pendingAirway) {
                    subRows[i] = ["VIA", ""];
                    rows[i] = ["[ ][color]blue", ""];
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
                            mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                                const lastWaypoint = mcdu.flightPlanManager.getWaypoints()[mcdu.flightPlanManager.getEnRouteWaypointsLastIndex()];
                                if (lastWaypoint.infos instanceof IntersectionInfo || lastWaypoint.infos instanceof VORInfo || lastWaypoint.infos instanceof NDBInfo) {
                                    const airway = lastWaypoint.infos.airways.find(a => {
                                        return a.name === value;
                                    });
                                    if (airway) {
                                        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset, airway);
                                    } else {
                                        mcdu.showErrorMessage("AWY/WPT MISMATCH");
                                    }
                                }
                            });
                        }
                    };
                } else if (pendingAirway) {
                    subRows[i] = ["VIA", "TO"];
                    rows[i] = [`${pendingAirway.name}[color]blue`, "[ ][color]blue"];
                    mcdu.onRightInput[i] = () => {
                        const value = mcdu.inOut;
                        if (value.length > 0) {
                            mcdu.clearUserInput();
                            mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                                mcdu.insertWaypointsAlongAirway(value, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, pendingAirway.name, (result) => {
                                    if (result) {
                                        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset);
                                    } else {
                                        mcdu.showErrorMessage("AWY/WPT MISMATCH");
                                    }
                                });
                            });
                        }
                    };
                }
            }
        }
        mcdu.setTemplate([
            undefined,
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
                        color = 'blue';
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
}
//# sourceMappingURL=A320_Neo_CDU_AirwaysFromWaypointPage.js.map