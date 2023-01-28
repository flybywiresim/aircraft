class CDULateralRevisionPage {
    /**
     *
     * @param mcdu
     * @param waypoint {FlightPlanLeg}
     * @param waypointIndexFP
     * @constructor
     */
    static ShowPage(mcdu, waypoint, waypointIndexFP, forPlan = Fmgc.FlightPlanIndex.Active, inAlternate = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.LateralRevisionPage;

        const coordinates = "";
        // TODO port over
        // if (waypoint && waypoint.infos && waypoint.infos.coordinates) {
        //     const lat = CDUInitPage.ConvertDDToDMS(waypoint.infos.coordinates['lat'], false);
        //     const long = CDUInitPage.ConvertDDToDMS(waypoint.infos.coordinates['long'], true);
        //     coordinates = `${lat.deg}°${lat.min}.${Math.ceil(Number(lat.sec / 100))}${lat.dir}/${long.deg}°${long.min}.${Math.ceil(Number(long.sec / 100))}${long.dir}[color]green`;
        // }
        let targetPlan;
        if (forPlan === Fmgc.FlightPlanIndex.Active) {
            if (inAlternate) {
                targetPlan = mcdu.flightPlanService.activeOrTemporary.alternateFlightPlan;
            } else {
                targetPlan = mcdu.flightPlanService.activeOrTemporary;
            }
        } else {
            targetPlan = mcdu.flightPlanService.get(forPlan);
        }

        const isPpos = waypoint === undefined || waypointIndexFP === 0 && waypoint !== targetPlan.originLeg;
        const isFrom = waypointIndexFP === targetPlan.activeLegIndex - 1;
        const isDeparture = waypointIndexFP === targetPlan.originLegIndex && !isPpos; // TODO this is bogus... compare icaos
        const isDestination = waypointIndexFP === targetPlan.destinationLegIndex && !isPpos; // TODO this is bogus... compare icaos
        const isWaypoint = !isDeparture && !isDestination && !isPpos;

        let waypointIdent = isPpos ? "PPOS" : '---';

        if (waypoint) {
            waypointIdent = waypoint.ident;
        }

        let departureCell = "";
        if (isDeparture) {
            departureCell = "<DEPARTURE";
            mcdu.leftInputDelay[0] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[0] = () => {
                CDUAvailableDeparturesPage.ShowPage(mcdu, targetPlan.originAirport, -1, false, forPlan, inAlternate);
            };
        }

        let arrivalFixInfoCell = "";
        if (isDestination) {
            arrivalFixInfoCell = "ARRIVAL>";
            mcdu.rightInputDelay[0] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onRightInput[0] = () => {
                CDUAvailableArrivalsPage.ShowPage(mcdu, waypoint, 0, false, forPlan, inAlternate);
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
        const isPreflight = mcdu.flightPhaseManager.phase === FmgcFlightPhases.PREFLIGHT;
        if ((isDeparture && isPreflight) || isWaypoint || isDestination) {
            if (isDestination) {
                // TODO remove this once we support waypoints after the destination (otherwise sim crash)
                nextWptLabel = "NEXT WPT{sp}[color]inop";
                nextWpt = "[{sp}{sp}{sp}{sp}][color]inop";
            } else {
                nextWptLabel = "NEXT WPT{sp}";
                nextWpt = "[{sp}{sp}{sp}{sp}][color]cyan";
                mcdu.onRightInput[2] = async (value, scratchpadCallback) => {
                    mcdu.insertWaypoint(value, forPlan, inAlternate, waypointIndexFP, false, (success) => {
                        if (!success) {
                            scratchpadCallback();
                        }
                        CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
                    });
                };
            }
        }

        let holdCell = "";
        if (isWaypoint) {
            holdCell = "<HOLD";
            mcdu.leftInputDelay[2] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[2] = () => {
                const nextLeg = mcdu.flightPlanManager.getWaypoint(waypointIndexFP + 1);
                if (nextLeg && nextLeg.additionalData.legType >= 12 && nextLeg.additionalData.legType <= 14 /* HA, HF, HM */) {
                    CDUHoldAtPage.ShowPage(mcdu, waypointIndexFP + 1);
                } else {
                    CDUHoldAtPage.ShowPage(mcdu, waypointIndexFP);
                }
            };
        }

        let enableAltnLabel = "";
        let enableAltnCell = "";
        if (!isDeparture && inAlternate) {
            enableAltnLabel = "{sp}ENABLE[color]cyan";
            enableAltnCell = "{ALTN[color]cyan";

            mcdu.leftInputDelay[3] = () => {
                return mcdu.getDelaySwitchPage();
            };
            mcdu.onLeftInput[3] = () => {
                mcdu.flightPlanService.enableAltn(waypointIndexFP);

                CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
            };
        }

        let newDestLabel = "";
        let newDestCell = "";
        if (!isDestination && !isPpos) {
            newDestLabel = "NEW DEST{sp}";
            newDestCell = "[{sp}{sp}][color]cyan";

            mcdu.onRightInput[3] = (value) => {
                mcdu.setDestinationAfterWaypoint(value, waypointIndexFP + 1, (result) => {
                    if (result) {
                        CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
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
                A320_Neo_CDU_AirwaysFromWaypointPage.ShowPage(mcdu, waypointIndexFP);
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
            CDUFlightPlanPage.ShowPage(mcdu, 0, forPlan);
        };
    }
}
