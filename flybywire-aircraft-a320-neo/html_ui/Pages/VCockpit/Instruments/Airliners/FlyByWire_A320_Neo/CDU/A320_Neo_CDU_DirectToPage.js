class CDUDirectToPage {
    static ShowPage(fmc, mcdu, directWaypoint, wptsListIndex = 0) {
        mcdu.setCurrentPage(() => {
            CDUDirectToPage.ShowPage(fmc, mcdu, directWaypoint, wptsListIndex);
        }, 'FMGC', () => fmc.dirTosInProcess--);
        fmc.dirTosInProcess++;
        mcdu.returnPageCallback = () => {
            CDUDirectToPage.ShowPage(fmc, mcdu, directWaypoint, wptsListIndex);
        };
        let directWaypointCell = "";
        if (directWaypoint) {
            directWaypointCell = directWaypoint.ident;
        } else if (fmc.flightPlanManager.getDirectToTarget()) {
            directWaypointCell = fmc.flightPlanManager.getDirectToTarget().ident;
        }
        const waypointsCell = ["", "", "", "", ""];
        let iMax = 5;
        let eraseLabel = "";
        if (directWaypoint) {
            iMax--;
            eraseLabel = "\xa0DIR TO[color]amber";
            waypointsCell[4] = "{ERASE[color]amber";
            mcdu.onLeftInput[5] = () => {
                SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 0);
                CDUDirectToPage.ShowPage(fmc, mcdu);
                mcdu.requestOffsideUpdate();
            };
        }
        mcdu.onLeftInput[0] = (value) => {
            fmc.getOrSelectWaypointByIdent(mcdu, value, (w) => {
                if (w) {
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 1);
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_0", "number", SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"));
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_0", "number", SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_1", "number", w.infos.coordinates.lat);
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_1", "number", w.infos.coordinates.long);
                    CDUDirectToPage.ShowPage(fmc, mcdu, w, wptsListIndex);
                    mcdu.requestOffsideUpdate();
                }
            });
        };
        let i = 0;
        wptsListIndex = Math.max(wptsListIndex, fmc.flightPlanManager.getActiveWaypointIndex());
        const totalWaypointsCount = fmc.flightPlanManager.getWaypointsCount() + fmc.flightPlanManager.getArrivalWaypointsCount() + fmc.flightPlanManager.getApproachWaypointsCount();
        while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && i < iMax) {
            const waypoint = fmc.flightPlanManager.getWaypoint(i + wptsListIndex, NaN, true);
            if (waypoint) {
                waypointsCell[i] = "{" + waypoint.ident + "[color]cyan";
                if (waypointsCell[i]) {
                    mcdu.onLeftInput[i + 1] = () => {
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 1);
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_0", "number", SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude"));
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_0", "number", SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude"));
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LAT_1", "number", waypoint.infos.coordinates.lat);
                        SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO_LONG_1", "number", waypoint.infos.coordinates.long);
                        CDUDirectToPage.ShowPage(fmc, mcdu, waypoint, wptsListIndex);
                        mcdu.requestOffsideUpdate();
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
            insertLabel = "\xa0TMPY[color]amber";
            insertLine = "DIRECT*[color]amber";
            mcdu.onRightInput[5] = () => {
                fmc.activateDirectToWaypoint(directWaypoint, () => {
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 0);
                    CDUFlightPlanPage.ShowPage(fmc, mcdu);
                    mcdu.requestOffsideUpdate();
                });
            };
        }
        mcdu.setTemplate([
            ["DIR TO"],
            ["\xa0WAYPOINT", "DIST\xa0", "UTC"],
            ["*[" + (directWaypointCell ? directWaypointCell : "\xa0\xa0\xa0\xa0\xa0") + "][color]cyan", "---", "----"],
            ["\xa0F-PLN WPTS"],
            [waypointsCell[0], "DIRECT TO[color]cyan"],
            ["", "WITH\xa0"],
            [waypointsCell[1], "ABEAM PTS[color]cyan"],
            ["", "RADIAL IN\xa0"],
            [waypointsCell[2], "[ ]°[color]cyan"],
            ["", "RADIAL OUT\xa0"],
            [waypointsCell[3], "[ ]°[color]cyan"],
            [eraseLabel, insertLabel],
            [waypointsCell[4], insertLine]
        ]);
        let up = false;
        let down = false;
        if (wptsListIndex < totalWaypointsCount - 5) {
            mcdu.onUp = () => {
                wptsListIndex++;
                CDUDirectToPage.ShowPage(fmc, mcdu, directWaypoint, wptsListIndex);
            };
            up = true;
        }
        if (wptsListIndex > 0) {
            mcdu.onDown = () => {
                wptsListIndex--;
                CDUDirectToPage.ShowPage(fmc, mcdu, directWaypoint, wptsListIndex);
            };
            down = true;
        }
        mcdu.setArrows(up, down, false ,false);
    }
}
