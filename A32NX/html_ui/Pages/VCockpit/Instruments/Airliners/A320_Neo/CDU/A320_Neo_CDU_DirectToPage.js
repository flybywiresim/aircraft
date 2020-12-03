class CDUDirectToPage {
    static ShowPage(mcdu, directWaypoint, wptsListIndex = 0) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.DirectToPage;
        mcdu.activeSystem = 'FMGC';
        let directWaypointCell = " ";
        if (directWaypoint) {
            directWaypointCell = directWaypoint.ident;
        } else if (mcdu.flightPlanManager.getDirectToTarget()) {
            directWaypointCell = mcdu.flightPlanManager.getDirectToTarget().ident;
        }
        const waypointsCell = ["", "", "", "", ""];
        let iMax = 5;
        let eraseLabel = "";
        if (directWaypoint) {
            iMax--;
            eraseLabel = "DIR TO[color]amber";
            waypointsCell[4] = "{ERASE[color]amber";
            mcdu.onLeftInput[5] = () => {
                SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 0);
                CDUDirectToPage.ShowPage(mcdu);
            };
        }
        mcdu.onLeftInput[0] = (value) => {
            mcdu.getOrSelectWaypointByIdent(value, (w) => {
                if (w) {
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 1);
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_0", "number", SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"));
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_0", "number", SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_1", "number", w.infos.coordinates.lat);
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_1", "number", w.infos.coordinates.long);
                    CDUDirectToPage.ShowPage(mcdu, w, wptsListIndex);
                }
            });
        };
        let i = 0;
        wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanManager.getActiveWaypointIndex());
        const totalWaypointsCount = mcdu.flightPlanManager.getWaypointsCount() + mcdu.flightPlanManager.getArrivalWaypointsCount() + mcdu.flightPlanManager.getApproachWaypointsCount();
        while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && i < iMax) {
            const waypoint = mcdu.flightPlanManager.getWaypoint(i + wptsListIndex, NaN, true);
            if (waypoint) {
                waypointsCell[i] = "{" + waypoint.ident + "[color]cyan";
                if (waypointsCell[i]) {
                    mcdu.onLeftInput[i + 1] = () => {
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 1);
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_0", "number", SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"));
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_0", "number", SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_1", "number", waypoint.infos.coordinates.lat);
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_1", "number", waypoint.infos.coordinates.long);
                        CDUDirectToPage.ShowPage(mcdu, waypoint, wptsListIndex);
                    };
                }
            } else {
                waypointsCell[i] = "----";
            }
            i++;
        }
        if (i < iMax) {
            waypointsCell[i] = "--END--";
        }
        let insertLabel = "";
        let insertLine = "";
        if (directWaypoint) {
            insertLabel = "TMPY[color]amber";
            insertLine = "DIRECT*[color]amber";
            mcdu.onRightInput[5] = () => {
                mcdu.activateDirectToWaypoint(directWaypoint, () => {
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 0);
                    CDUFlightPlanPage.ShowPage(mcdu);
                });
            };
        }
        mcdu.setTemplate([
            ["DIR TO"],
            ["WAYPOINT", "DIST", "UTC"],
            ["[" + directWaypointCell + "][color]cyan", "---", "----"],
            ["F-PLN WPTS"],
            [waypointsCell[0], "DIRECT TO[color]cyan"],
            ["", "WITH"],
            [waypointsCell[1], "ABEAM PTS[color]cyan"],
            ["", "RADIAL IN"],
            [waypointsCell[2], "[ ]°[color]cyan"],
            ["", "RADIAL OUT"],
            [waypointsCell[3], "[ ]°[color]cyan"],
            [eraseLabel, insertLabel],
            [waypointsCell[4], insertLine]
        ]);
        mcdu.onUp = () => {
            wptsListIndex++;
            wptsListIndex = Math.min(wptsListIndex, totalWaypointsCount - 5);
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
        };
        mcdu.onDown = () => {
            wptsListIndex--;
            wptsListIndex = Math.max(wptsListIndex, 0);
            CDUDirectToPage.ShowPage(mcdu, directWaypoint, wptsListIndex);
        };
    }
}
