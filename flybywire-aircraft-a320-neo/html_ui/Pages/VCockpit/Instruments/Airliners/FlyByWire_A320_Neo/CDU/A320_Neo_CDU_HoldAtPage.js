class CDUHoldAtPage {
    static ShowPage(fmc, mcdu, waypoint, waypointIndexFP) {
        mcdu.setCurrentPage(() => {
            CDUHoldAtPage.ShowPage(fmc, mcdu, waypoint, waypointIndexFP);
        });
        try {
            const SpeedConstraints = {
                14000: 230,
                20000: 240,
                34000: 265,
                34001: 0.83,
            };

            let speedConstraint = waypoint.speedConstraint;
            let holdTime = 1.5;
            let holdCourse = waypoint.bearingInFP;
            let holdTurn = "R";
            let computed = true;
            if (waypoint.legAltitude1 <= 14000) {
                speedConstraint = SpeedConstraints[14000];
                holdTime = 1.0;
            } else if (waypoint.legAltitude1 <= 20000) {
                speedConstraint = SpeedConstraints[20000];
            } else if (waypoint.legAltitude1 <= 34000) {
                speedConstraint = SpeedConstraints[34000];
            } else {
                speedConstraint = SpeedConstraints[34001];
            }

            // https://www.aopa.org/training-and-safety/active-pilots/safety-and-technique/weather/density-altitude
            const denseAlt = ((15 - (2 * waypoint.legAltitude1 / 1000)) * 120) + waypoint.legAltitude1;
            // http://www.edwilliams.org/avform.htm#Mach
            const estimatedTAS = speedConstraint / (1 - 6.8755856 * 10 ^ -6 * denseAlt) ^ 2.127940;

            // need to adjust for wind component?
            let holdDistance = estimatedTAS * holdTime;

            const rteRsvWeight = fmc.getRouteReservedWeight();
            let resFuel = "0.0";
            if (!isNaN(rteRsvWeight)) {
                resFuel = rteRsvWeight;
            }

            const exitTime = FMCMainDisplay.secondsTohhmm(fmc.flightPlanManager.getDestination().estimatedTimeOfArrivalFP);

            if (fmc.manualHoldData) {
                holdTime = parseFloat(fmc.manualHoldData.time);
                holdCourse = parseFloat(fmc.manualHoldData.course);
                holdDistance = parseFloat(fmc.manualHoldData.distance);
                holdTurn = fmc.manualHoldData.turn;
                computed = false;
            }

            const rows = [];
            rows.push([(computed ? "COMPUTED HOLD {small}at{end} " : "HOLD {small}at{end} ") + "{green}" + waypoint.ident + "{end}"]);
            rows.push(["INB CRS", "", ""]);
            rows.push([holdCourse.toFixed(0) + "°[color]yellow", "", ""]);
            rows.push(["TURN", computed ? "" : "REVERT TO", ""]);
            rows.push([holdTurn + "[color]yellow", computed ? "" : "COMPUTED}[color]cyan", ""]);
            rows.push(["TIME/DIST"]);
            rows.push([holdTime.toFixed(1) + "/" + holdDistance.toFixed(1) + "[color]yellow"]);
            rows.push(["", "", "\xa0LAST EXIT"]);
            rows.push(["", "", "{small}UTC\xa0\xa0\xa0FUEL{end}"]);
            rows.push(["", "", exitTime + "\xa0\xa0" + (resFuel < 10 ? "\xa0" : "") + resFuel.toFixed(1) + "\xa0"]);
            rows.push([""]);
            rows.push([""]);
            rows.push(["{ERASE[color]amber", "INSERT}[color]amber", ""]);

            mcdu.setTemplate([
                ...rows
            ]);

            mcdu.onLeftInput[0] = (value) => {
                if (isNaN(value) || 0 < value > 360) {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return;
                }
                fmc.manualHoldData = { // TODO this seems bogus
                    time: holdTime,
                    course: parseFloat(value),
                    distance: holdDistance,
                    turn: holdTurn
                };
                mcdu.requestRefresh();
            };

            mcdu.onLeftInput[1] = (value) => {
                if (value != "L" && value != "R") {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                    return;
                }
                fmc.manualHoldData = {
                    time: holdTime,
                    course: holdCourse,
                    distance: holdDistance,
                    turn: value
                };
                mcdu.requestRefresh();
            };

            mcdu.onLeftInput[2] = (value) => {
                if (value.startsWith("/")) {
                    const distComp = value.replace("/", "");
                    if (isNaN(distComp)) {
                        mcdu.addNewMessage(NXSystemMessages.formatError);
                        return;
                    }
                    fmc.manualHoldData = {
                        time: parseFloat(distComp) / estimatedTAS,
                        course: holdCourse,
                        distance: distComp,
                        turn: holdTurn
                    };
                    mcdu.requestRefresh();

                    return;
                }

                if (isNaN(value)) {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                    return;
                }

                holdDistance = estimatedTAS * parseFloat(value);

                fmc.manualHoldData = {
                    time: value,
                    course: holdCourse,
                    distance: holdDistance,
                    turn: holdTurn
                };
                mcdu.requestRefresh();
            };

            if (!computed) {
                mcdu.onRightInput[1] = () => {
                    fmc.manualHoldData = null;
                    mcdu.requestRefresh();
                };
            }

            mcdu.onLeftInput[5] = () => {
                fmc.manualHoldData = null;
                CDULateralRevisionPage.ShowPage(fmc, mcdu, waypoint, waypointIndexFP);
            };

            mcdu.onRightInput[5] = () => {
                fmc.activeHold = new Map();
                fmc.activeHold.set(
                    waypoint.ident, {
                        fpIndex: waypointIndexFP,
                        course: parseFloat(holdCourse),
                        turn: holdTurn,
                        dist: parseFloat(holdDistance),
                        time: parseFloat(holdTime),
                        speed: parseFloat(speedConstraint)
                    }
                );
                fmc.manualHoldData = null;
                CDUFlightPlanPage.ShowPage(fmc, mcdu);
            };
        } catch (err) {
            console.log(err);
        }
    }
}
