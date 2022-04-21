const TurnDirection = Object.freeze({
    Unknown: 0,
    Left: 1,
    Right: 2,
    Either: 3,
});

const HoldType = Object.freeze({
    Computed: 0,
    Database: 1,
    Modified: 2,
});

class CDUHoldAtPage {
    static ShowPage(mcdu, waypointIndexFP) {
        const waypoint = mcdu.flightPlanManager.getWaypoint(waypointIndexFP);
        if (!waypoint) {
            return CDUFlightPlanPage.ShowPage(mcdu);
        }
        const editingHm = waypoint.additionalData.legType === 14; // HM

        if (editingHm) {
            CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, waypointIndexFP);
        } else {
            const editingHx = waypoint.additionalData.legType >= 12 && waypoint.additionalData.legType <= 14;
            const alt = waypoint.legAltitude1 ? waypoint.legAltitude1 : SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');

            let defaultHold;
            let modifiedHold;
            if (editingHx) {
                defaultHold = waypoint.additionalData.defaultHold;
                modifiedHold = waypoint.additionalData.modifiedHold;
            } else {
                defaultHold = {
                    inboundMagneticCourse: waypoint.bearingInFP,
                    turnDirection: TurnDirection.Right,
                    time: alt <= 14000 ? 1 : 1.5,
                    type: HoldType.Computed,
                };
                modifiedHold = {};
            }

            mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                const holdIndex = mcdu.flightPlanManager.addOrEditManualHold(
                    waypointIndexFP,
                    Object.assign({}, defaultHold),
                    modifiedHold,
                    defaultHold,
                );
                CDUHoldAtPage.DrawPage(mcdu, holdIndex, waypointIndexFP);
            });
        }
    }

    static DrawPage(mcdu, waypointIndexFP, originalFpIndex) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.HoldAtPage;

        const tmpy = mcdu.flightPlanManager.isCurrentFlightPlanTemporary();

        const waypoint = mcdu.flightPlanManager.getWaypoint(waypointIndexFP);

        const speed = waypointIndexFP === mcdu.holdIndex && mcdu.holdSpeedTarget > 0 ? mcdu.holdSpeedTarget : 180;

        const modifiedHold = waypoint.additionalData.modifiedHold;
        const defaultHold = waypoint.additionalData.defaultHold;
        const currentHold = CDUHoldAtPage.computeDesiredHold(waypoint.additionalData);

        // TODO this doesn't account for wind... we really need to access the actual hold leg once the ts/js barrier is broken
        const displayTime = currentHold.time === undefined ? currentHold.distance * 60 / speed : currentHold.time;
        const displayDistance = currentHold.distance === undefined ? speed * currentHold.time / 60 : currentHold.distance;

        const defaultType = defaultHold.type === HoldType.Database ? 'DATABASE' : 'COMPUTED';
        const defaultTitle = defaultType + '\xa0';
        const defaultRevert = defaultType + '}';

        const ident = waypoint.ident.replace('T-P', 'PPOS').padEnd(7, '\xa0');
        const rows = [];
        rows.push([`${currentHold.type !== HoldType.Modified ? defaultTitle : ''}HOLD\xa0{small}AT{end}\xa0{green}${ident}{end}`]);
        rows.push(["INB CRS", "", ""]);
        rows.push([`{${tmpy ? 'yellow' : 'cyan'}}${modifiedHold.inboundMagneticCourse !== undefined ? '{big}' : '{small}'}${currentHold.inboundMagneticCourse.toFixed(0).padStart(3, '0')}°{end}{end}`]);
        rows.push(["TURN", currentHold.type === HoldType.Modified ? "REVERT TO" : ""]);
        rows.push([`{${tmpy ? 'yellow' : 'cyan'}}${modifiedHold.turnDirection !== undefined ? '{big}' : '{small}'}${currentHold.turnDirection === TurnDirection.Left ? 'L' : 'R'}{end}`, `{cyan}${currentHold.type === HoldType.Modified ? defaultRevert : ''}{end}`]);
        rows.push(["TIME/DIST"]);
        rows.push([`{${tmpy ? 'yellow' : 'cyan'}}${modifiedHold.time !== undefined ? '{big}' : '{small}'}${displayTime.toFixed(1).padStart(4, '\xa0')}{end}/${modifiedHold.distance !== undefined ? '{big}' : '{small}'}${displayDistance.toFixed(1)}{end}{end}`]);
        rows.push(["", "", "\xa0LAST EXIT"]);
        rows.push(["", "", "{small}UTC\xa0\xa0\xa0FUEL{end}"]);
        rows.push(["", "", "----\xa0\xa0----"]);
        rows.push([""]);
        rows.push([""]);
        rows.push([tmpy ? "{amber}{ERASE{end}" : "", tmpy ? "{amber}INSERT*{end}" : "", ""]);

        mcdu.setTemplate([
            ...rows
        ]);

        // TODO what happens if CLR attemped?
        // change course
        mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
            if (value.match(/^[0-9]{1,3}$/) === null) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return;
            }
            const magCourse = parseInt(value);
            if (magCourse > 360) {
                mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                scratchpadCallback();
                return;
            }

            CDUHoldAtPage.modifyHold(mcdu, waypointIndexFP, waypoint.additionalData, 'inboundMagneticCourse', magCourse, () => CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex));
        };

        // change turn direction
        mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
            if (value !== "L" && value !== "R") {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return;
            }

            CDUHoldAtPage.modifyHold(mcdu, waypointIndexFP, waypoint.additionalData, 'turnDirection', value === 'L' ? TurnDirection.Left : TurnDirection.Right, () => CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex));
        };

        // change time or distance
        mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
            const m = value.match(/^(([0-9]{0,1}(\.[0-9])?)\/?|\/([0-9]{0,2}(\.[0-9])?))$/);
            if (m === null) {
                mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                scratchpadCallback();
                return;
            }

            const time = m[2];
            const dist = m[4];

            const param = dist ? 'distance' : 'time';
            const newValue = dist ? parseFloat(dist) : parseFloat(time);

            CDUHoldAtPage.modifyHold(mcdu, waypointIndexFP, waypoint.additionalData, param, newValue, () => CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex));
        };

        // revert to computed/database
        if (currentHold.type === HoldType.Modified) {
            mcdu.onRightInput[1] = () => {
                mcdu.ensureCurrentFlightPlanIsTemporary(() => {
                    waypoint.additionalData.modifiedHold = {};

                    mcdu.flightPlanManager.addOrEditManualHold(
                        waypointIndexFP,
                        CDUHoldAtPage.computeDesiredHold(waypoint.additionalData),
                        waypoint.additionalData.modifiedHold,
                        waypoint.additionalData.defaultHold,
                    );

                    CDUHoldAtPage.DrawPage(mcdu, waypointIndexFP, originalFpIndex);
                });
            };
        }

        // erase
        mcdu.onLeftInput[5] = () => {
            if (tmpy) {
                mcdu.eraseTemporaryFlightPlan(() => {
                    CDULateralRevisionPage.ShowPage(mcdu, mcdu.flightPlanManager.getWaypoint(originalFpIndex), originalFpIndex);
                });
            }
        };

        // insert
        mcdu.onRightInput[5] = () => {
            if (tmpy) {
                mcdu.insertTemporaryFlightPlan(() => {
                    CDUFlightPlanPage.ShowPage(mcdu, waypointIndexFP);
                });
            }
        };
    }

    static computeDesiredHold(waypointData) {
        const modifiedHold = waypointData.modifiedHold;
        const defaultHold = waypointData.defaultHold;

        const pilotTimeOrDistance = modifiedHold.time !== undefined || modifiedHold.distance !== undefined;

        return {
            inboundMagneticCourse: modifiedHold.inboundMagneticCourse !== undefined ? modifiedHold.inboundMagneticCourse : defaultHold.inboundMagneticCourse,
            turnDirection: modifiedHold.turnDirection !== undefined ? modifiedHold.turnDirection : defaultHold.turnDirection,
            distance: pilotTimeOrDistance ? modifiedHold.distance : defaultHold.distance,
            time: pilotTimeOrDistance ? modifiedHold.time : defaultHold.time,
            type: modifiedHold !== undefined ? modifiedHold.type : defaultHold.type,
        };
    }

    static modifyHold(mcdu, waypointIndexFP, waypointData, param, value, callback) {
        mcdu.ensureCurrentFlightPlanIsTemporary(() => {
            waypointData.modifiedHold.type = HoldType.Modified;

            if (param === 'time') {
                waypointData.modifiedHold.distance = undefined;
            } else if (param === 'distance') {
                waypointData.modifiedHold.time = undefined;
            }

            waypointData.modifiedHold[param] = value;

            mcdu.flightPlanManager.addOrEditManualHold(
                waypointIndexFP,
                CDUHoldAtPage.computeDesiredHold(waypointData),
                waypointData.modifiedHold,
                waypointData.defaultHold,
            );

            callback();
        });
    }
}
