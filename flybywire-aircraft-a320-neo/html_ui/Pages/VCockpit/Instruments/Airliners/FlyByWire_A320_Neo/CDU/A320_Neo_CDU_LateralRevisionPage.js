class CDULateralRevisionPage {
    static ShowPage(mcdu, waypoint, waypointIndexFP) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.LateralRevisionPage;

        let coordinates = "";
        if (waypoint && waypoint.infos && waypoint.infos.coordinates) {
            const lat = CDUInitPage.ConvertDDToDMS(waypoint.infos.coordinates['lat'], false);
            const long = CDUInitPage.ConvertDDToDMS(waypoint.infos.coordinates['long'], true);
            coordinates = `${lat.deg}°${lat.min}.${Math.ceil(Number(lat.sec / 100))}${lat.dir}/${long.deg}°${long.min}.${Math.ceil(Number(long.sec / 100))}${long.dir}[color]green`;
        }
        const isPpos = waypoint === undefined || waypointIndexFP === 0 && waypoint !== mcdu.flightPlanManager.getOrigin();
        const isFrom = waypointIndexFP === mcdu.flightPlanManager.getActiveWaypointIndex() - 1;
        const isDeparture = waypoint === mcdu.flightPlanManager.getOrigin() && !isPpos; // TODO this is bogus... compare icaos
        const isDestination = waypoint === mcdu.flightPlanManager.getDestination() && !isPpos; // TODO this is bogus... compare icaos
        const isWaypoint = !isDeparture && !isDestination && !isPpos;

        let waypointIdent = isPpos ? "PPOS" : '---';
        if (waypoint) {
            waypointIdent = waypoint.ident;
            if (isDeparture) {
                const originRunway = mcdu.flightPlanManager.getOriginRunway();
                if (originRunway) {
                    waypointIdent += Avionics.Utils.formatRunway(originRunway.designation);
                }
            } else if (isDestination) {
                const destinationRunway = mcdu.flightPlanManager.getDestinationRunway();
                if (destinationRunway) {
                    waypointIdent += Avionics.Utils.formatRunway(destinationRunway.designation);
                }
            }
        }

        let departureCell = "";
        if (isDeparture) {
            departureCell = "<DEPARTURE";
            mcdu.leftInputDelay[0] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[0] = () => {
                CDUAvailableDeparturesPage.ShowPage(mcdu, waypoint);
            };
        }

        let arrivalFixInfoCell = "";
        if (isDestination) {
            arrivalFixInfoCell = "ARRIVAL>";
            mcdu.rightInputDelay[0] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[0] = () => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, waypoint);
            };
        } else if (isDeparture || isPpos || isFrom) {
            arrivalFixInfoCell = "FIX INFO>";
            mcdu.onRightInput[0] = () => {
                CDUFixInfoPage.ShowPage(mcdu);
            };
        }

        let crossingLabel = "";
        let crossingCell = "";
        if (!isDestination) {
            crossingLabel = "LL XING/INCR/NO[color]inop";
            crossingCell = "[{sp}{sp}]°/[{sp}]°/[][color]inop";
        }

        let offsetCell = "";
        if (isDeparture || isWaypoint) {
            offsetCell = "<OFFSET[color]inop";
        }

        let nextWptLabel = "";
        let nextWpt = "";
        const isPreflight = mcdu.currentFlightPhase === FmgcFlightPhases.PREFLIGHT;
        if ((isDeparture && isPreflight) || isWaypoint || isDestination) {
            if (isDestination) {
                // TODO remove this once we support waypoints after the destination (otherwise sim crash)
                nextWptLabel = "NEXT WPT{sp}[color]inop";
                nextWpt = "[{sp}{sp}{sp}{sp}][color]inop";
            } else {
                nextWptLabel = "NEXT WPT{sp}";
                nextWpt = "[{sp}{sp}{sp}{sp}][color]cyan";
                mcdu.onRightInput[2] = async (value, scratchpadCallback) => {
                    mcdu.insertWaypoint(value, waypointIndexFP + 1, (success) => {
                        if (!success) {
                            scratchpadCallback();
                        }
                        CDUFlightPlanPage.ShowPage(mcdu);
                    });
                };
            }
        }

        let holdCell = "";
        if (isWaypoint) {
            holdCell = "{inop}<HOLD{end}";
            mcdu.leftInputDelay[2] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[2] = () => {
                mcdu.addNewMessage(NXFictionalMessages.notYetImplemented);
                //CDUHoldAtPage.ShowPage(mcdu, waypoint, waypointIndexFP);
            };
        }

        let enableAltnLabel = "";
        let enableAltnCell = "";
        if (!isDeparture && mcdu.altDestination) {
            // TODO this should be hidden if we're already enroute to our alternate (see "Alternate Diversion" 11-5)
            enableAltnLabel = "{sp}ENABLE[color]inop";
            enableAltnCell = "{ALTN[color]inop";
        }

        let newDestLabel = "";
        let newDestCell = "";
        if (!isDestination && !isPpos) {
            newDestLabel = "NEW DEST{sp}";
            newDestCell = "[{sp}{sp}][color]cyan";

            mcdu.onRightInput[3] = (value) => {
                mcdu.setDestinationAfterWaypoint(value, waypointIndexFP + 1, (result) => {
                    if (result) {
                        CDUFlightPlanPage.ShowPage(mcdu);
                    }
                });
            };
        }

        let airwaysCell = "";
        if (isWaypoint) {
            airwaysCell = "AIRWAYS>";
            mcdu.rightInputDelay[4] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[4] = () => {
                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypoint);
            };
        }

        let altnCell = "";
        if (isDestination) {
            altnCell = "<ALTN[color]inop";
        }

        mcdu.setTemplate([
            [`LAT REV{small} FROM {end}{green}${waypointIdent}{end}`],
            ["", "", coordinates + "[color]green"],
            [departureCell, arrivalFixInfoCell],
            ["", crossingLabel],
            [offsetCell, crossingCell],
            ["", nextWptLabel],
            [holdCell, nextWpt],
            [enableAltnLabel, newDestLabel],
            [enableAltnCell, newDestCell],
            [""],
            [altnCell, airwaysCell],
            [""],
            ["<RETURN"]
        ]);
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUFlightPlanPage.ShowPage(mcdu);
        };
    }
}
