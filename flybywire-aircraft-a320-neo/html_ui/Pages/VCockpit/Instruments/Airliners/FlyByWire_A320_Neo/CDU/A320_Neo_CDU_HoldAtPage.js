class CDUHoldAtPage {
    static ShowPage(mcdu, waypoint, waypointIndexFP) {
        try {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.HoldAtPage;

            // TODO turn HF/HA to HM?

            const alt = waypoint.legAltitude1 ? waypoint.legAltitude1 : SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');
            const speed = mcdu.getHoldingSpeed(waypoint.speedConstraint, alt);
            const magVar = Facilities.getMagVar(waypoint.infos.coordinates.lat, waypoint.infos.coordinates.long);

            let holdTime = 1.5;
            // TODO should be outbound bearing from the predicted leg
            let holdCourse = A32NX_Util.magneticToTrue(waypoint.bearingInFP, magVar);
            let holdTurn = "R";
            let computed = true;

            if (alt <= 14000) {
                holdTime = 1.0;
            }
            let holdDistance;

            let pilotCourse = false;
            let pilotTurn = false;
            let pilotTime = false;
            let pilotDistance = false;

            if (!mcdu.manualHoldData && waypoint.additionalData.legType === 14 /* HM */) {
                const manualHoldData = {};
                if (holdCourse !== waypoint.additionalData.course) {
                    manualHoldData.course = waypoint.additionalData.course;
                }
                const turnDirection = waypoint.turnDirection === 1 ? 'L' : 'R';
                if (holdTurn !== turnDirection) {
                    manualHoldData.turn = turnDirection;
                }
                if (holdTime !== waypoint.additionalData.distanceInMinutes) {
                    manualHoldData.time = waypoint.additionalData.distanceInMinutes;
                }
                if (holdDistance !== waypoint.additionalData.distance) {
                    manualHoldData.distance = waypoint.additionalData.distance;
                }
                if (Object.keys(manualHoldData).length > 0) {
                    computed = false;
                    mcdu.manualHoldData = manualHoldData;
                }
            }

            // we use this (temporal) object to store in-process hold edits
            // it should not survive after leaving this page any possible way
            // TODO make ^^ true
            if (mcdu.manualHoldData) {
                if (mcdu.manualHoldData.course) {
                    holdCourse = mcdu.manualHoldData.course;
                    pilotCourse = true;
                }
                if (mcdu.manualHoldData.turn) {
                    holdTurn = mcdu.manualHoldData.turn;
                    pilotTurn = true;
                }
                if (mcdu.manualHoldData.time) {
                    holdTime = mcdu.manualHoldData.time;
                    pilotTime = true;
                } else if (mcdu.manualHoldData.distance) {
                    holdDistance = mcdu.manualHoldData.distance;
                    holdTime = undefined;
                    pilotDistance = true;
                }
                computed = false;
            }

            if (holdTime === undefined) {
                holdTime = holdDistance * 60 / speed;
            }
            if (holdDistance === undefined) {
                holdDistance = speed * holdTime / 60;
            }

            const magCourse = A32NX_Util.trueToMagnetic(holdCourse, magVar);

            const rows = [];
            rows.push([(computed ? "COMPUTED HOLD {small}AT{end} " : "HOLD {small}AT{end} ") + "{green}" + waypoint.ident + "{end}"]);
            rows.push(["INB CRS", "", ""]);
            rows.push([`{yellow}${pilotCourse ? '{big}' : '{small}'}${magCourse.toFixed(0).padStart(3, '0')}°{end}{end}`]);
            rows.push(["TURN", computed ? "" : "REVERT TO", ""]);
            rows.push([`{yellow}${pilotTurn ? '{big}' : '{small}'}${holdTurn}{end}`, computed ? "" : "COMPUTED}[color]cyan", ""]);
            rows.push(["TIME/DIST"]);
            rows.push([`{yellow}${pilotTime ? '{big}' : '{small}'}${holdTime.toFixed(1).padStart(4, '\xa0')}{end}/${pilotDistance ? '{big}' : '{small}'}${holdDistance.toFixed(1)}{end}{end}`]);
            rows.push(["", "", "\xa0LAST EXIT"]);
            rows.push(["", "", "{small}UTC\xa0\xa0\xa0FUEL{end}"]);
            rows.push(["", "", "----\xa0\xa0----"]);
            rows.push([""]);
            rows.push([""]);
            rows.push(["{ERASE[color]amber", "INSERT}[color]amber", ""]);

            mcdu.setTemplate([
                ...rows
            ]);

            // TODO what happens if CLR attemped?
            // change course
            mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
                if (value.match(/^[0-9]{1,3}$/) === null) {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }
                const magCourse = parseInt(value);
                if (magCourse > 360) {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                    return;
                }

                const trueCourse = A32NX_Util.magneticToTrue(magCourse % 360, magVar);
                if (!mcdu.manualHoldData) {
                    mcdu.manualHoldData = {};
                }
                mcdu.manualHoldData.course = trueCourse;
                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            // change turn direction
            mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
                if (value !== "L" && value !== "R") {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }
                if (!mcdu.manualHoldData) {
                    mcdu.manualHoldData = {};
                }
                mcdu.manualHoldData.turn = value;
                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            // change time or distance
            mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
                const m = value.match(/^(([0-9]{0,1}(\.[0-9])?)\/?|\/([0-9]{0,2}(\.[0-9])?))$/);
                if (m === null) {
                    mcdu.addNewMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }

                if (!mcdu.manualHoldData) {
                    mcdu.manualHoldData = {};
                }

                const time = m[2];
                const dist = m[4];

                if (!mcdu.manualHoldData) {
                    mcdu.manualHoldData = {};
                }

                if (time) {
                    mcdu.manualHoldData.time = parseFloat(time);
                    mcdu.manualHoldData.distance = undefined;
                } else if (dist) {
                    mcdu.manualHoldData.distance = parseFloat(dist);
                    mcdu.manualHoldData.time = undefined;
                }

                CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };

            if (!computed) {
                // TODO ignore leg hold properties when editing
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
                mcdu.manualHoldData = null;

                mcdu.flightPlanManager.addOrEditManualHold(
                    waypointIndexFP,
                    holdTurn === "L" ? 1 : 2,
                    holdCourse,
                    pilotDistance ? holdDistance : undefined,
                    (pilotTime || !pilotDistance) ? holdTime : undefined,
                );
                CDUFlightPlanPage.ShowPage(mcdu);
            };
        } catch (err) {
            console.log(err);
        }
    }
}
