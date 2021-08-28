class CDUVerticalRevisionPage {
    static ShowPage(fmc, mcdu, waypoint) {
        if (fmc.dirTosInProcess > 0) {
            mcdu.addNewMessage(NXSystemMessages.dirToInProcess);
            CDUFlightPlanPage.ShowPage(fmc, mcdu);
            return;
        }

        const waypointInfo = waypoint.infos;
        if (waypointInfo instanceof WayPointInfo) {
            mcdu.setCurrentPage(() => {
                CDUVerticalRevisionPage.ShowPage(fmc, mcdu, waypoint);
            });

            let waypointIdent = "---";
            if (waypoint) {
                waypointIdent = waypoint.ident;
            }
            let coordinates = "---";
            if (waypointInfo.coordinates) {
                coordinates = waypointInfo.coordinates.toDegreeString();
            }
            const efob = "--.-";
            const extra = "--.-";
            const climbSpeedLimit = "250";
            const climbAltLimit = "FL100";
            let speedConstraint = 0;
            if (waypoint.speedConstraint > 10) {
                speedConstraint = waypoint.speedConstraint.toFixed(0);
            }
            let altitudeConstraint = "";
            switch (waypoint.legAltitudeDescription) {
                case 1: {
                    altitudeConstraint = this.formatFl(Math.round(waypoint.legAltitude1), fmc.transitionAltitude);
                    break;
                }
                case 2: {
                    altitudeConstraint = "+" + this.formatFl(Math.round(waypoint.legAltitude1), fmc.transitionAltitude);
                    break;
                }
                case 3: {
                    altitudeConstraint = "-" + this.formatFl(Math.round(waypoint.legAltitude1), fmc.transitionAltitude);
                    break;
                }
                case 4: {
                    if (waypoint.legAltitude1 < waypoint.legAltitude2) {
                        altitudeConstraint = "+" + this.formatFl(Math.round(waypoint.legAltitude1), fmc.transitionAltitude)
                            + "/-" + this.formatFl(Math.round(waypoint.legAltitude2), fmc.transitionAltitude);
                    } else {
                        altitudeConstraint = "+" + this.formatFl(Math.round(waypoint.legAltitude2), fmc.transitionAltitude)
                            + "/-" + this.formatFl(Math.round(waypoint.legAltitude1), fmc.transitionAltitude);
                    }
                    break;
                }
            }
            mcdu.setTemplate([
                ["VERT REV {small}AT{end}{green} " + waypointIdent + "{end}"],
                ["\xa0EFOB={green}" + efob + "{end}", "EXTRA={green}" + (extra.length < 4 ? `${extra}\xa0` : extra) + "\xa0{end}"],
                [""],
                ["\xa0CLB SPD LIM", ""],
                [climbSpeedLimit + "/" + climbAltLimit + "[color]magenta", "RTA>[color]inop"],
                ["\xa0SPD CSTR", "ALT CSTR\xa0"],
                [speedConstraint ? speedConstraint + "[color]magenta" : "*[\xa0\xa0\xa0][color]cyan", altitudeConstraint ? altitudeConstraint + "[color]magenta" : "[\xa0\xa0\xa0\xa0]*[color]cyan"],
                ["MACH/START WPT[color]inop", ""],
                [`\xa0{inop}[\xa0]/{small}${waypointIdent}{end}{end}`, ""],
                [""],
                ["<WIND", "STEP ALTS>[color]inop"],
                [""],
                ["<RETURN"]
            ]);
            mcdu.onLeftInput[0] = () => {}; // EFOB
            mcdu.onRightInput[0] = () => {}; // EXTRA
            mcdu.onLeftInput[1] = () => {}; // CLB SPD LIM
            mcdu.onRightInput[1] = () => {}; // RTA
            mcdu.onLeftInput[2] = async (value) => {
                if (isFinite(value)) {
                    if (value >= 0) {
                        // NYI
                    }
                }
                mcdu.addNewMessage(NXFictionalMessages.notYetImplemented);
            }; // SPD CSTR
            mcdu.onRightInput[2] = (value) => {
                if (value === FMCMainDisplay.clrValue) {
                    fmc.removeWaypoint(fpIndex, () => { // TODO fpIndex comes from???
                        fmc.updateConstraints();
                        CDUFlightPlanPage.ShowPage(fmc, mcdu, offset); // TODO offset comes from???
                    });
                }

                const PLUS_REGEX = /\+\d+/g;
                const MINUS_REGEX = /\-\d+/g;

                let altitude;
                let code;

                if (value.match(MINUS_REGEX)) {
                    code = 3;
                    altitude = value.split('-')[1];
                } else if ((value.match(PLUS_REGEX))) {
                    code = 2;
                    altitude = value.split('+')[1];
                } else {
                    code = 1;
                    altitude = value;
                }
                altitude = parseInt(altitude);
                if (isFinite(altitude)) {
                    if (altitude >= 0) {
                        fmc.flightPlanManager.setLegAltitudeDescription(waypoint, code);
                        fmc.flightPlanManager.setWaypointAltitude((altitude < 1000 ? altitude * 100 : altitude) / 3.28084, fmc.flightPlanManager.indexOfWaypoint(waypoint), () => {
                            fmc.updateConstraints();
                            mcdu.requestUpdate();
                        });
                    }
                } else {
                    mcdu.addNewMessage(NXSystemMessages.notAllowed);
                }
            }; // ALT CSTR
            mcdu.onLeftInput[4] = () => {
                //TODO: show appropriate wind page based on waypoint
                mcdu.returnPageCallback = () => {
                    CDUVerticalRevisionPage.ShowPage(fmc, mcdu, waypoint);
                };
                CDUWindPage.ShowPage(fmc, mcdu);
            }; // WIND
            mcdu.onRightInput[4] = () => {}; // STEP ALTS
            mcdu.onLeftInput[5] = () => {
                CDUFlightPlanPage.ShowPage(fmc, mcdu);
            };
        }
    }

    static formatFl(constraint, transAlt) {
        if (transAlt >= 100 && constraint > transAlt) {
            return "FL" + Math.round(constraint / 100);
        }
        return constraint;
    }
}
