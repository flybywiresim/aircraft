class CDUVerticalRevisionPage {
    static ShowPage(mcdu, waypoint) {
        const waypointInfo = waypoint.infos;
        if (waypointInfo instanceof WayPointInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.VerticalRevisionPage;
            let waypointIdent = "---";
            if (waypoint) {
                waypointIdent = waypoint.ident;
            }
            let coordinates = "---";
            if (waypointInfo.coordinates) {
                coordinates = waypointInfo.coordinates.toDegreeString();
            }
            const efob = "---.-";
            const extra = "---.-";
            const climbSpeedLimit = "250";
            const climbAltLimit = "FL100";
            let speedConstraint = 0;
            if (waypoint.speedConstraint > 10) {
                speedConstraint = waypoint.speedConstraint.toFixed(0);
            }
            let altitudeConstraint = 0;
            if (waypoint.legAltitudeDescription !== 0) {
                if (waypoint.legAltitudeDescription === 1) {
                    altitudeConstraint = waypoint.legAltitude1.toFixed(0);
                }
                if (waypoint.legAltitudeDescription === 2) {
                    altitudeConstraint = "+" + waypoint.legAltitude1.toFixed(0);
                }
                if (waypoint.legAltitudeDescription === 3) {
                    altitudeConstraint = "-" + waypoint.legAltitude1.toFixed(0);
                } else if (waypoint.legAltitudeDescription === 4) {
                    altitudeConstraint = ((waypoint.legAltitude1 + waypoint.legAltitude2) * 0.5).toFixed(0);
                }
            }
            if (mcdu.transitionAltitude >= 100 && altitudeConstraint > mcdu.transitionAltitude) {
                altitudeConstraint = "FL" + (altitudeConstraint / 100).toFixed(0);
            }
            mcdu.setTemplate([
                ["VERT REV AT " + waypointIdent],
                [" EFOB=" + efob, "EXTRA=" + extra],
                [""],
                [" CLB SPD LIM", ""],
                [climbSpeedLimit + "/" + climbAltLimit + "[color]magenta", "RTA>"],
                [" SPD CSTR", "ALT CSTR "],
                [speedConstraint ? speedConstraint + "[color]magenta" : "*[\xa0\xa0\xa0][color]blue", altitudeConstraint != 0 ? altitudeConstraint + "[color]magenta" : "[\xa0\xa0\xa0\xa0]*[color]blue"],
                ["", ""],
                ["", ""],
                [""],
                ["<WIND", "STEP ALTS>"],
                [""],
                ["<RETURN"]
            ]);
            mcdu.onLeftInput[0] = () => {}; // EFOB
            mcdu.onRightInput[0] = () => {}; // EXTRA
            mcdu.onLeftInput[1] = () => {}; // CLB SPD LIM
            mcdu.onRightInput[1] = () => {}; // RTA
            mcdu.onLeftInput[2] = async () => {
                const value = parseInt(mcdu.inOut);
                if (isFinite(value)) {
                    if (value >= 0) {
                        // NYI
                    }
                }
                mcdu.clearUserInput();
                mcdu.showErrorMessage("NOT YET IMPLEMENTED");
                setTimeout(() => {
                    mcdu.showErrorMessage("");
                }, 1000);
            }; // SPD CSTR
            mcdu.onRightInput[2] = () => {
                let value = mcdu.inOut;
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.removeWaypoint(fpIndex, () => {
                        CDUFlightPlanPage.ShowPage(mcdu, offset);
                    });
                }
                value = parseInt(value);
                if (isFinite(value)) {
                    if (value >= 0) {
                        mcdu.clearUserInput();
                        mcdu.flightPlanManager.setWaypointAltitude((value < 1000 ? value * 100 : value) / 3.28084, mcdu.flightPlanManager.indexOfWaypoint(waypoint), () => {
                            this.ShowPage(mcdu, waypoint);
                        });
                    }
                } else {
                    mcdu.showErrorMessage("INVALID ENTRY");
                }
            }; // ALT CSTR
            mcdu.onLeftInput[4] = () => {}; // WIND
            mcdu.onRightInput[4] = () => {}; // STEP ALTS
            mcdu.onLeftInput[5] = () => {
                CDUFlightPlanPage.ShowPage(mcdu);
            };
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_VerticalRevisionPage.js.map