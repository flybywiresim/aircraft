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
            mcdu.setTemplate([
                ["LAT REV FROM " + waypointIdent],
                ["", "", coordinates + "[color]green"],
                ["", "FIX INFO>"],
                ["", "LL WING/INCR/NO"],
                ["[][color]blue", "[ ]°/[ ]°/[][color]blue"],
                ["", "NEXT WPT"],
                ["<HOLD", "[ ][color]blue"],
                ["ENABLE[color]blue", "NEW DEST"],
                ["←ALTN[color]blue", "[ ][color]blue"],
                [""],
                ["", "AIRWAYS>"],
                [""],
                ["<RETURN"]
            ]);
            mcdu.onRightInput[4] = () => { A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint); };
            mcdu.onLeftInput[5] = () => { CDUFlightPlanPage.ShowPage(mcdu); };
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_VerticalRevisionPage.js.map