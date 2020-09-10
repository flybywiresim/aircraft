class CDUVerticalRevisionPage {
    static ShowPage(mcdu, waypoint) {
        let waypointInfo = waypoint.infos;
        if (waypointInfo instanceof WayPointInfo) {
            mcdu.clearDisplay();
            let waypointIdent = "---";
            if (waypoint) {
                waypointIdent = waypoint.ident;
            }
            let coordinates = "---";
            if (waypointInfo.coordinates) {
                coordinates = waypointInfo.coordinates.toDegreeString();
            }
            let efob = "---.-";
            let extra = "---.-";
            let climbSpeedLimit = "250";
            let climbAltLimit = "FL100";
            let speedConstraint = "*[   ]";
            if (waypoint.speedConstraint > 10)
                speedConstraint = waypoint.speedConstraint.toFixed(0);
            let altitudeConstraint = "[   ]*";
            if (waypoint.legAltitudeDescription !== 0) {
                if (waypoint.legAltitudeDescription === 1) {
                    altitudeConstraint = waypoint.legAltitude1.toFixed(0);
                }
                if (waypoint.legAltitudeDescription === 2) {
                    altitudeConstraint = "+" + waypoint.legAltitude1.toFixed(0);
                }
                if (waypoint.legAltitudeDescription === 3) {
                    altitudeConstraint = "-" + waypoint.legAltitude1.toFixed(0);
                }
                else if (waypoint.legAltitudeDescription === 4) {
                    altitudeConstraint = ((waypoint.legAltitude1 + waypoint.legAltitude2) * 0.5).toFixed(0);
                }
            }
            mcdu.onRightInput[5] = async () => {
                let value = mcdu.inOut;
                if (value.length >= 0) {
                    mcdu.clearUserInput();
                    mcdu.insertWaypoint(value, mcdu.flightPlanManager.getEnRouteWaypointsLastIndex() + 1, () => {
                        A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint, offset);
                    });
                }
            };
            mcdu.setTemplate([
                ["VERT REV AT " + waypointIdent],
                [" EFOB=" + efob,  "EXTRA=" + extra],
                [""],
                [" CLB SPD LIM", ""],
                [climbSpeedLimit + "/" + climbAltLimit + "[color]blue", "RTA>"],
                [" SPD CSTR", "ALT CSTR "],
                [speedConstraint + "[color]blue", altitudeConstraint + "[color]blue"],
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
                let value = parseInt(mcdu.inOut);
                if (isFinite(value)) {
                    if (value >= 0) {
                        // NYI
                    }
                }
                mcdu.clearUserInput();
                mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            }; // SPD CSTR
            mcdu.onRightInput[2] = async () => {
                let value = parseInt(mcdu.inOut);
                if (isFinite(value)) {
                    if (value >= 0) {
                        // NYI
                    }
                }
                mcdu.clearUserInput();
                mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            }; // ALT CSTR
            mcdu.onLeftInput[4] = () => {}; // WIND
            mcdu.onRightInput[4] = () => {}; // STEP ALTS 
            mcdu.onLeftInput[5] = () => { CDUFlightPlanPage.ShowPage(mcdu); };
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_VerticalRevisionPage.js.map