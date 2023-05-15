const WaypointConstraintType = Object.freeze({
    Unknown: 0,
    CLB: 1,
    DES: 2,
});

class CDUVerticalRevisionPage {
    static ShowPage(mcdu, waypoint, verticalWaypoint, confirmSpeed = undefined, confirmAlt = undefined, confirmCode = undefined) {
        const waypointInfo = waypoint.infos;
        if (waypointInfo instanceof WayPointInfo) {
            mcdu.clearDisplay();
            mcdu.page.Current = mcdu.page.VerticalRevisionPage;

            const wpIndex = mcdu.flightPlanManager.indexOfWaypoint(waypoint);

            const confirmConstraint = confirmSpeed !== undefined || confirmAlt !== undefined;
            const constraintType = CDUVerticalRevisionPage.constraintType(mcdu, waypoint);
            const isOrigin = wpIndex === 0;
            const isDestination = wpIndex === mcdu.flightPlanManager.getDestinationIndex();

            let waypointIdent = "---";
            if (waypoint) {
                waypointIdent = waypoint.ident;
                if (isDestination) {
                    const destinationRunway = mcdu.flightPlanManager.getDestinationRunway();
                    if (destinationRunway) {
                        waypointIdent += Avionics.Utils.formatRunway(destinationRunway.designation);
                    }
                }
            }
            let coordinates = "---";
            if (waypointInfo.coordinates) {
                coordinates = waypointInfo.coordinates.toDegreeString();
            }

            const showSpeedLim = mcdu._fuelPredDone || isOrigin || isDestination || constraintType !== WaypointConstraintType.Unknown;
            // the conditions other than isDestination are a workaround for no ToC
            const showDesSpeedLim = showSpeedLim && (isDestination ||
                constraintType === WaypointConstraintType.DES ||
                (mcdu.flightPhaseManager.phase > FmgcFlightPhases.CRUISE &&
                    mcdu.flightPhaseManager.phase < FmgcFlightPhases.GOAROUND));

            let speedLimitTitle = "";
            let speedLimitCell = "";
            if (showDesSpeedLim) {
                speedLimitTitle = "\xa0DES SPD LIM";
                if (mcdu.descentSpeedLimit !== undefined) {
                    speedLimitCell = `{magenta}{${mcdu.descentSpeedLimitPilot ? 'big' : 'small'}}${mcdu.descentSpeedLimit.toFixed(0).padStart(3, "0")}/${this.formatFl(mcdu.descentSpeedLimitAlt, mcdu.flightPlanManager.destinationTransitionLevel * 100)}{end}{end}`;
                } else {
                    speedLimitCell = "{cyan}*[ ]/[   ]{end}";
                }
            } else if (showSpeedLim) {
                speedLimitTitle = "\xa0CLB SPD LIM";
                if (mcdu.climbSpeedLimit !== undefined) {
                    speedLimitCell = `{magenta}{${mcdu.climbSpeedLimitPilot ? 'big' : 'small'}}${mcdu.climbSpeedLimit.toFixed(0).padStart(3, "0")}/${this.formatFl(mcdu.climbSpeedLimitAlt, mcdu.flightPlanManager.originTransitionAltitude)}{end}{end}`;
                } else {
                    speedLimitCell = "{cyan}*[ ]/[   ]{end}";
                }
            }

            let speedConstraint = 0;
            if (waypoint.speedConstraint > 10) {
                speedConstraint = waypoint.speedConstraint.toFixed(0);
            }

            const transAltLevel = constraintType === WaypointConstraintType.DES ? mcdu.flightPlanManager.destinationTransitionLevel * 100 : mcdu.flightPlanManager.originTransitionAltitude;
            let altitudeConstraint = "";
            switch (waypoint.legAltitudeDescription) {
                case 1: {
                    altitudeConstraint = this.formatFl(Math.round(waypoint.legAltitude1), transAltLevel);
                    break;
                }
                case 2: {
                    altitudeConstraint = "+" + this.formatFl(Math.round(waypoint.legAltitude1), transAltLevel);
                    break;
                }
                case 3: {
                    altitudeConstraint = "-" + this.formatFl(Math.round(waypoint.legAltitude1), transAltLevel);
                    break;
                }
                case 4: {
                    if (waypoint.legAltitude1 < waypoint.legAltitude2) {
                        altitudeConstraint = "+" + this.formatFl(Math.round(waypoint.legAltitude1), transAltLevel)
                            + "/-" + this.formatFl(Math.round(waypoint.legAltitude2), transAltLevel);
                    } else {
                        altitudeConstraint = "+" + this.formatFl(Math.round(waypoint.legAltitude2), transAltLevel)
                            + "/-" + this.formatFl(Math.round(waypoint.legAltitude1), transAltLevel);
                    }
                    break;
                }
            }

            let r3Title = "ALT CSTR\xa0";
            let r3Cell = "{cyan}[\xa0\xa0\xa0\xa0]*{end}";
            let l3Title = "\xa0SPD CSTR";
            let l3Cell = "{cyan}*[\xa0\xa0\xa0]{end}";
            let l4Title = "MACH/START WPT[color]inop";
            let l4Cell = `\xa0{inop}[\xa0]/{small}${waypointIdent}{end}{end}`;
            let r4Title = "";
            let r4Cell = "";
            let r5Cell = "";

            if (isDestination) {
                const hasGsIntercept = mcdu.flightPlanManager.getApproachType() === ApproachType.APPROACH_TYPE_ILS; // also GLS and MLS
                const gsIntercept = hasGsIntercept ? mcdu.flightPlanManager.getGlideslopeIntercept() : 0;
                if (hasGsIntercept && gsIntercept > 0) {
                    r3Title = "G/S INTCP\xa0";
                    r3Cell = `{green}{small}${gsIntercept.toFixed(0)}{end}{end}`;
                } else {
                    r3Title = "";
                    r3Cell = "";
                }

                const closeToDest = mcdu.flightPlanManager.getDestination() && mcdu.flightPlanManager.getDestination().liveDistanceTo <= 180;
                l4Title = "\xa0QNH";
                if (isFinite(mcdu.perfApprQNH)) {
                    if (mcdu.perfApprQNH < 500) {
                        l4Cell = `{cyan}${mcdu.perfApprQNH.toFixed(2)}{end}`;
                    } else {
                        l4Cell = `{cyan}${mcdu.perfApprQNH.toFixed(0)}{end}`;
                    }
                } else if (closeToDest) {
                    l4Cell = "{amber}____{end}";
                } else {
                    l4Cell = "{cyan}[\xa0\xa0]{end}";
                }
                mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
                    if (mcdu.setPerfApprQNH(value)) {
                        CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint, confirmSpeed, confirmAlt, confirmCode);
                    } else {
                        scratchpadCallback();
                    }
                };

                l3Title = "";
                l3Cell = "";
                r5Cell = "";
            } else {
                if (altitudeConstraint) {
                    r3Cell = `{magenta}${altitudeConstraint}{end}`;
                }
                if (speedConstraint) {
                    l3Cell = `{magenta}${speedConstraint}{end}`;
                }

                [r4Title, r4Cell] = this.formatAltErrorTitleAndValue(waypoint, verticalWaypoint);

                if (mcdu._cruiseEntered && mcdu._cruiseFlightLevel && (mcdu.flightPhaseManager.phase < FmgcFlightPhases.DESCENT || mcdu.flightPhaseManager.phase > FmgcFlightPhases.GOAROUND)) {
                    r5Cell = "STEP ALTS>";
                };
            }

            mcdu.setTemplate([
                ["VERT REV {small}AT{end}{green} " + waypointIdent + "{end}"],
                [],
                [""],
                [speedLimitTitle, ""],
                [speedLimitCell, "RTA>[color]inop"],
                [l3Title, r3Title],
                [l3Cell, r3Cell],
                [l4Title, r4Title],
                [l4Cell, r4Cell],
                [""],
                ["<WIND/TEMP", r5Cell],
                [""],
                [confirmConstraint ? "{amber}*CLB{end}" : "<RETURN", confirmConstraint ? "{amber}DES*{end}" : "", confirmConstraint ? "{amber}{small}OR{end}{end}" : ""]
            ]);

            mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
                if (!showSpeedLim) {
                    scratchpadCallback();
                    return;
                }

                if (value === FMCMainDisplay.clrValue) {
                    if (showDesSpeedLim) {
                        if (mcdu.descentSpeedLimitPilot) {
                            mcdu.descentSpeedLimit = 250;
                            mcdu.descentSpeedLimitAlt = 10000;
                        } else {
                            mcdu.descentSpeedLimit = undefined;
                            mcdu.descentSpeedLimitAlt = undefined;
                        }
                        mcdu.descentSpeedLimitPilot = false;
                    } else {
                        if (mcdu.climbSpeedLimitPilot) {
                            mcdu.climbSpeedLimit = 250;
                            mcdu.climbSpeedLimitAlt = 10000;
                        } else {
                            mcdu.climbSpeedLimit = undefined;
                            mcdu.climbSpeedLimitAlt = undefined;
                        }
                        mcdu.climbSpeedLimitPilot = false;
                    }
                    CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint);
                    return;
                }

                const matchResult = value.match(/^([0-9]{1,3})\/(((FL)?([0-9]{1,3}))|([0-9]{4,5}))$/);
                if (matchResult === null) {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }

                const speed = parseInt(matchResult[1]);
                let alt = matchResult[5] !== undefined ? parseInt(matchResult[5]) * 100 : parseInt(matchResult[6]);

                if (speed < 90 || speed > 350 || alt > 45000) {
                    mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                    return;
                }

                alt = Math.round(alt / 10) * 10;

                if (showDesSpeedLim) {
                    mcdu.descentSpeedLimit = speed;
                    mcdu.descentSpeedLimitAlt = alt;
                    mcdu.descentSpeedLimitPilot = true;
                } else {
                    mcdu.climbSpeedLimit = speed;
                    mcdu.climbSpeedLimitAlt = alt;
                    mcdu.climbSpeedLimitPilot = true;
                }
                CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint);
                return;
            }; // SPD LIM
            mcdu.onRightInput[1] = () => {}; // RTA
            mcdu.onLeftInput[2] = async (value, scratchpadCallback) => {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.flightPlanManager.setWaypointSpeed(-1, wpIndex, () => {
                        mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                        this.ShowPage(mcdu, waypoint, verticalWaypoint);
                    }, constraintType === WaypointConstraintType.DES);
                    return;
                }

                if (value.match(/^[0-9]{1,3}$/ === null)) {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }

                const speed = parseInt(value);

                if (speed < 90 || speed > 350) {
                    mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                    return;
                }

                if (constraintType === WaypointConstraintType.Unknown) {
                    CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint, speed);
                    return;
                }

                mcdu.flightPlanManager.setWaypointSpeed(speed, wpIndex, () => {
                    mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                    this.ShowPage(mcdu, waypoint, verticalWaypoint);
                }, constraintType === WaypointConstraintType.DES);
            }; // SPD CSTR
            mcdu.onRightInput[2] = (value, scratchpadCallback) => {
                if (value === FMCMainDisplay.clrValue) {
                    mcdu.flightPlanManager.setLegAltitudeDescription(waypoint, 0);
                    mcdu.flightPlanManager.setWaypointAltitude(0, wpIndex, () => {
                        mcdu.updateConstraints();
                        mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                        this.ShowPage(mcdu, waypoint, verticalWaypoint);
                    });
                    return;
                }

                const matchResult = value.match(/^([+-])?(((FL)?([0-9]{1,3}))|([0-9]{4,5}))$/);
                if (matchResult === null) {
                    mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    scratchpadCallback();
                    return;
                }

                const altitude = matchResult[5] !== undefined ? parseInt(matchResult[5]) * 100 : parseInt(matchResult[6]);
                const code = matchResult[1] === undefined ? 1 : (matchResult[1] === '-' ? 3 : 2);

                if (altitude > 45000) {
                    mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
                    scratchpadCallback();
                    return;
                }

                if (constraintType === WaypointConstraintType.Unknown) {
                    CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint, undefined, altitude, code);
                    return;
                }

                mcdu.flightPlanManager.setLegAltitudeDescription(waypoint, code);
                mcdu.flightPlanManager.setWaypointAltitude(altitude, wpIndex, () => {
                    mcdu.updateConstraints();
                    mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                    this.ShowPage(mcdu, waypoint, verticalWaypoint);
                }, constraintType === WaypointConstraintType.DES);
            }; // ALT CSTR
            mcdu.onLeftInput[4] = () => {
                //TODO: show appropriate wind page based on waypoint
                CDUWindPage.Return = () => {
                    CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint);
                };
                CDUWindPage.ShowPage(mcdu);
            }; // WIND
            mcdu.onRightInput[4] = () => {
                if (!mcdu._cruiseEntered || !mcdu._cruiseFlightLevel) {
                    return;
                }
                CDUStepAltsPage.Return = () => {
                    CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint);
                };
                CDUStepAltsPage.ShowPage(mcdu);
            }; // STEP ALTS
            if (!confirmConstraint) {
                mcdu.onLeftInput[5] = () => {
                    CDUFlightPlanPage.ShowPage(mcdu);
                };
            } else {
                mcdu.onLeftInput[5] = () => {
                    if (confirmSpeed !== undefined) {
                        mcdu.flightPlanManager.setWaypointSpeed(confirmSpeed, wpIndex, () => {
                            mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                            this.ShowPage(mcdu, waypoint, verticalWaypoint);
                        }, false);
                    }
                    if (confirmAlt !== undefined) {
                        mcdu.flightPlanManager.setLegAltitudeDescription(waypoint, confirmCode);
                        mcdu.flightPlanManager.setWaypointAltitude(confirmAlt, wpIndex, () => {
                            mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                            this.ShowPage(mcdu, waypoint, verticalWaypoint);
                        }, false);
                    }
                };
                mcdu.onRightInput[5] = () => {
                    if (confirmSpeed !== undefined) {
                        mcdu.flightPlanManager.setWaypointSpeed(confirmSpeed, wpIndex, () => {
                            mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                            this.ShowPage(mcdu, waypoint, verticalWaypoint);
                        }, true);
                    }
                    if (confirmAlt !== undefined) {
                        mcdu.flightPlanManager.setLegAltitudeDescription(waypoint, confirmCode);
                        mcdu.flightPlanManager.setWaypointAltitude(confirmAlt, wpIndex, () => {
                            mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                            this.ShowPage(mcdu, waypoint, verticalWaypoint);
                        }, true);
                    }
                };
            }

        }
    }

    static formatFl(constraint, transAlt) {
        if (transAlt >= 100 && constraint > transAlt) {
            return "FL" + Math.round(constraint / 100);
        }
        return constraint;
    }

    static constraintType(mcdu, waypoint) {
        if (waypoint.additionalData.constraintType > 0) {
            return waypoint.additionalData.constraintType;
        }

        const segment = mcdu.flightPlanManager.getSegmentFromWaypoint(waypoint);
        if (segment === 3 || segment === 4) {
            return WaypointConstraintType.DES;
        }
        if (segment <= 1 || segment === 5) {
            return WaypointConstraintType.CLB;
        }

        return WaypointConstraintType.Unknown;
    }

    // constraints can be set directly by LSK on f-pln page
    static setConstraints(mcdu, waypoint, verticalWaypoint, value, scratchpadCallback, offset = 0) {
        const matchResult = value.match(/^(([0-9]{1,3})\/?)?(\/([+-])?(((FL)?([0-9]{1,3}))|([0-9]{4,5})))?$/);
        if (matchResult === null) {
            mcdu.setScratchpadMessage(NXSystemMessages.formatError);
            scratchpadCallback();
            return;
        }

        let speed;
        let alt;

        if (matchResult[2] !== undefined) {
            speed = parseInt(matchResult[2]);
        }

        const code = matchResult[4] === undefined ? 1 : (matchResult[4] === '-' ? 3 : 2);

        if (matchResult[8] !== undefined) {
            alt = parseInt(matchResult[8]) * 100;
        }

        if (matchResult[9] !== undefined) {
            alt = parseInt(matchResult[9]);
        }

        if ((speed !== undefined && (speed < 90 || speed > 350)) || (alt !== undefined && alt > 45000)) {
            mcdu.setScratchpadMessage(NXSystemMessages.entryOutOfRange);
            scratchpadCallback();
            return;
        }

        const type = CDUVerticalRevisionPage.constraintType(mcdu, waypoint);
        if (type === WaypointConstraintType.Unknown) {
            CDUVerticalRevisionPage.ShowPage(mcdu, waypoint, verticalWaypoint, speed, alt, code);
            return;
        }

        if (speed !== undefined) {
            mcdu.flightPlanManager.setWaypointSpeed(speed, mcdu.flightPlanManager.indexOfWaypoint(waypoint), () => {
                mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            }, type === WaypointConstraintType.DES);
        }

        if (alt !== undefined) {
            mcdu.flightPlanManager.setLegAltitudeDescription(waypoint, code);
            mcdu.flightPlanManager.setWaypointAltitude(alt, mcdu.flightPlanManager.indexOfWaypoint(waypoint), () => {
                mcdu.guidanceController.vnavDriver.invalidateFlightPlanProfile();
                CDUFlightPlanPage.ShowPage(mcdu, offset);
            }, type === WaypointConstraintType.DES);
        }
    }

    static formatAltErrorTitleAndValue(waypoint, verticalWaypoint) {
        const empty = ["", ""];

        if (!waypoint || !verticalWaypoint) {
            return empty;
        }

        // No constraint
        if (waypoint.legAltitudeDescription === 0 || verticalWaypoint.isAltitudeConstraintMet) {
            return empty;
        }

        // Weird prediction error
        if (!isFinite(verticalWaypoint.altError)) {
            return empty;
        }

        let formattedAltError = (Math.round(verticalWaypoint.altError / 10) * 10).toFixed(0);
        if (verticalWaypoint.altError > 0) {
            formattedAltError = "+" + formattedAltError;
        }

        return ["ALT ERROR\xa0", "{green}{small}" + formattedAltError + "{end}{end}"];
    }
}
