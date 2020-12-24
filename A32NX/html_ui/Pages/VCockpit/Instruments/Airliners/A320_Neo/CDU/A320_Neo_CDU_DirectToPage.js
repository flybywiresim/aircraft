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
        const etasCell = ["", "", "", "", ""];
        const spdaltCell = ["", "", "", "", ""];
        const iMax = 5;
        /*let eraseLabel = "";
        if (directWaypoint) {
            mcdu.onLeftInput[5] = () => {
                SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 0);
                CDUDirectToPage.ShowPage(mcdu);
            };
        }*/
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
        let lastAltitudeConstraint = "-----";
        let lastSpeedConstraint = "";
        wptsListIndex = Math.max(wptsListIndex, mcdu.flightPlanManager.getActiveWaypointIndex());
        const totalWaypointsCount = mcdu.flightPlanManager.getWaypointsCount() + mcdu.flightPlanManager.getArrivalWaypointsCount() + mcdu.flightPlanManager.getApproachWaypointsCount();
        while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount && i < iMax) {
            const waypoint = mcdu.flightPlanManager.getWaypoint(i + wptsListIndex, NaN, true);
            if (waypoint) {
                let speedConstraint = "---";
                let timeCell = "----";
                let altitudeConstraint = "-----";
                if (waypoint.speedConstraint > 10) {
                    speedConstraint = "{magenta}*{end}" + waypoint.speedConstraint.toFixed(0);
                    if (speedConstraint === lastSpeedConstraint) {
                        speedConstraint = "\xa0\"\xa0";
                    } else {
                        lastSpeedConstraint = speedConstraint;
                    }
                }
                if (isFinite(waypoint.liveUTCTo) || isFinite(mcdu.flightPlanManager._waypointReachedAt)) {
                    timeCell = FMCMainDisplay.secondsToUTC(waypoint.liveUTCTo) + "[color]green" + "[s-text]";
                }
                let altPrefix = "\xa0";

                if (mcdu.transitionAltitude >= 100 && waypoint.legAltitude1 > mcdu.transitionAltitude) {
                    altitudeConstraint = (waypoint.legAltitude1 / 100).toFixed(0).toString();
                    altitudeConstraint = "FL" + altitudeConstraint.padStart(3,"0");
                } else {
                    altitudeConstraint = waypoint.legAltitude1.toFixed(0).toString().padStart(5,"\xa0");
                }
                if (waypoint.legAltitudeDescription !== 0) {
                    altPrefix = "{magenta}*{end}";
                    if (waypoint.legAltitudeDescription === 4) {
                        altitudeConstraint = ((waypoint.legAltitude1 + waypoint.legAltitude2) * 0.5).toFixed(0).toString();
                        altitudeConstraint = altitudeConstraint.padStart(5,"\xa0");
                    }
                //predict altitude for STAR when constraints are missing
                } else {
                    altitudeConstraint = "FL" + mcdu.cruiseFlightLevel.toString().padStart(3,"0");
                }
                if (altitudeConstraint === lastAltitudeConstraint) {
                    altitudeConstraint = "\xa0\xa0\"\xa0\xa0";
                } else {
                    lastAltitudeConstraint = altitudeConstraint;
                }
                waypointsCell[i] = "\xa0" + waypoint.ident + "[color]green";
                etasCell[i] = timeCell + "[color]green" + "[s-text]";
                spdaltCell[i] = speedConstraint + "/" + altPrefix + altitudeConstraint + "[color]green" + "[s-text]";
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
            mcdu.onLeftInput[0] = () => {
                mcdu.activateDirectToWaypoint(directWaypoint, () => {
                    SimVar.SetSimVarValue("L:A320_NEO_PREVIEW_DIRECT_TO", "number", 0);
                    CDUFlightPlanPage.ShowPage(mcdu);
                });
            };
            mcdu.onLeftInput[1] = () => {};
        }
        if (directWaypoint) {
            mcdu.setTemplate([
                ["DIR TO"],
                ["DIR TO", "RADIAL IN\xa0\xa0"],
                ["*" + directWaypointCell + "[color]cyan", "[\xa0]°[color]cyan", ""],
                ["WITH", "RADIAL OUT\xa0\xa0"],
                ["*ABEAM PTS[color]cyan", "[\xa0]°[color]cyan",""],
                ["", ""],
                [waypointsCell[1], spdaltCell[1] , etasCell[1]],
                ["", ""],
                [waypointsCell[2], spdaltCell[2] , etasCell[2]],
                ["", ""],
                [waypointsCell[3], spdaltCell[3] , etasCell[3]],
                //[eraseLabel, insertLabel],
                [ "" , ""],
                [waypointsCell[4], spdaltCell[3] , etasCell[3]]
            ]);
        } else {
            mcdu.setTemplate([
                ["DIR TO"],
                ["DIR TO", "", ""],
                ["[" + directWaypointCell + "][color]cyan", "", ""],
                ["F-PLN WPTS", "HDG"],
                [waypointsCell[0], spdaltCell[0] , etasCell[0]],
                ["", ""],
                [waypointsCell[1], spdaltCell[1] ,etasCell[1]],
                ["", ""],
                [waypointsCell[2], spdaltCell[2] , etasCell[2]],
                ["", ""],
                [waypointsCell[3], spdaltCell[3] , etasCell[3]],
                //[eraseLabel, insertLabel],
                [ "" , ""],
                [waypointsCell[4], spdaltCell[4] , etasCell[4]]
            ]);
        }
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
