class CDUHoldAtPage {
    static ShowPage(mcdu, waypoint, waypointIndexFP) {
        try {
            const SpeedConstraints = {
                14000: 230,
                20000: 240,
                34000: 265,
                34001: 0.83,
            };

            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.HoldAtPage;

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

            const rteRsvWeight = mcdu.getRouteReservedWeight();
            let resFuel = "0.0";
            if (!isNaN(rteRsvWeight)) {
                resFuel = rteRsvWeight;
            }

            const exitTime = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().estimatedTimeOfArrivalFP);

            if (mcdu.manualHoldData) {
                holdTime = parseFloat(mcdu.manualHoldData.time);
                holdCourse = parseFloat(mcdu.manualHoldData.course);
                holdDistance = parseFloat(mcdu.manualHoldData.distance);
                holdTurn = mcdu.manualHoldData.turn;
                computed = false;
            }

            const rows = [];
            rows.push([(computed ? "COMPUTED HOLD at " : "HOLD at ") + waypoint.ident ]);
            rows.push(["INB CRS", "", ""]);
            rows.push([holdCourse.toFixed(0) + "°[color]blue", "", ""]);
            rows.push(["TURN", computed ? "" : "REVERT TO", ""]);
            rows.push([holdTurn + "[color]blue", computed ? "" : "COMPUTED}[color]blue", ""]);
            rows.push(["TIME/DIST"]);
            rows.push([holdTime.toFixed(1) + "/" + holdDistance.toFixed(1) + "[color]blue"]);
            rows.push(["", "", " LAST EXIT"]);
            rows.push(["", "", "UTC   FUEL"]);
            rows.push(["", "", exitTime + " " + resFuel.toFixed(1)]);
            rows.push([""]);
            rows.push([""]);
            rows.push(["{ERASE[color]red", "INSERT}[color]red", ""]);

            mcdu.setTemplate([
                ...rows
            ]);

            mcdu.onLeftInput[0] = () => {
                const value = mcdu.inOut;
                if (isNaN(value) || 0 < value > 360) {
                    mcdu.inOut = "NaN";
                    return;
                }
                mcdu.clearUserInput();
                mcdu.manualHoldData = {
                    time: holdTime,
                    course: parseFloat(value),
                    distance: holdDistance,
                    turn: holdTurn
                };
                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            mcdu.onLeftInput[1] = () => {
                const value = mcdu.inOut;
                if (value != "L" && value != "R") {
                    mcdu.inOut = "ERR FMT";
                    return;
                }
                mcdu.clearUserInput();
                mcdu.manualHoldData = {
                    time: holdTime,
                    course: holdCourse,
                    distance: holdDistance,
                    turn: value
                };
                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            mcdu.onLeftInput[2] = () => {
                const value = mcdu.inOut;

                if (value.startsWith("/")) {
                    const distComp = value.replace("/", "");
                    if (isNaN(distComp)) {
                        mcdu.inOut = "ERR FMT";
                        return;
                    }
                    mcdu.clearUserInput();
                    mcdu.manualHoldData = {
                        time: parseFloat(distComp) / estimatedTAS,
                        course: holdCourse,
                        distance: distComp,
                        turn: holdTurn
                    };
                    CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);

                    return;
                }

                if (isNaN(value)) {
                    mcdu.inOut = "ERR FMT";
                    return;
                }

                holdDistance = estimatedTAS * parseFloat(value);

                mcdu.clearUserInput();
                mcdu.manualHoldData = {
                    time: value,
                    course: holdCourse,
                    distance: holdDistance,
                    turn: holdTurn
                };
                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            if (!computed) {
                mcdu.onRightInput[1] = () => {
                    mcdu.manualHoldData = null;
                    CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
                };
            }

            mcdu.onLeftInput[5] = () => {
                mcdu.manualHoldData = null;
                CDULateralRevisionPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            mcdu.onRightInput[5] = () => {
                mcdu.activeHold = new Map();
                mcdu.activeHold.set(
                    waypoint.ident, {
                        fpIndex: waypointIndexFP,
                        course: parseFloat(holdCourse),
                        turn: holdTurn,
                        dist: parseFloat(holdDistance),
                        time: parseFloat(holdTime),
                        speed: parseFloat(speedConstraint)
                    }
                );
                mcdu.manualHoldData = null;
                CDUFlightPlanPage.ShowPage(mcdu);
            };
        } catch (err) {
            console.log(err);
        }
    }
}