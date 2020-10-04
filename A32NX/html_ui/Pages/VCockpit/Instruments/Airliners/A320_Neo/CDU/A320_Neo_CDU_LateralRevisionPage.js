class CDULateralRevisionPage {
    static ShowPage(mcdu, waypoint, waypointIndexFP) {
        console.log("CDULateralRevisionPage.ShowPage");
        console.log(waypoint);
        mcdu.clearDisplay();
        let waypointIdent = "---";
        if (waypoint) {
            waypointIdent = waypoint.ident;
        }
        let coordinates = "---";
        console.log(waypoint);
        if (waypoint && waypoint.infos && waypoint.infos.coordinates) {
            coordinates = waypoint.infos.coordinates.toDegreeString();
        }
        let departureArrival = "";
        if (waypoint === mcdu.flightPlanManager.getOrigin()) {
            departureArrival = "<DEPARTURE";
            mcdu.onLeftInput[0] = () => {
                CDUAvailableDeparturesPage.ShowPage(mcdu, waypoint);
            };
        }
        else if (waypoint === mcdu.flightPlanManager.getDestination()) {
            departureArrival = "<ARRIVAL";
            mcdu.onLeftInput[0] = () => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, waypoint);
            };
        }
        mcdu.setTemplate([
            ["LAT REV FROM " + waypointIdent],
            ["", "", coordinates + "[color]green"],
            [departureArrival, "FIX INFO>"],
            ["", "LL WING/INCR/NO"],
            ["[][color]blue", "[ ]°/[ ]°/[][color]blue"],
            ["", "NEXT WPT"],
            ["<HOLD[color]blue", "[ ][color]blue"],
            ["ENABLE[color]blue", "NEW DEST"],
            ["←ALTN[color]blue", "[ ][color]blue"],
            [""],
            ["", "AIRWAYS>"],
            [""],
            ["<RETURN"]
        ]);
        mcdu.onRightInput[2] = async () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            mcdu.insertWaypoint(value, waypointIndexFP + 1, (result) => {
                if (result) {
                    CDUFlightPlanPage.ShowPage(mcdu);
                }
            });
        };
        mcdu.onLeftInput[2] = () => { CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP); };
        mcdu.onRightInput[4] = () => { A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint); };
        mcdu.onLeftInput[5] = () => { CDUFlightPlanPage.ShowPage(mcdu); };
    }
}
//# sourceMappingURL=A320_Neo_CDU_LateralRevisionPage.js.map