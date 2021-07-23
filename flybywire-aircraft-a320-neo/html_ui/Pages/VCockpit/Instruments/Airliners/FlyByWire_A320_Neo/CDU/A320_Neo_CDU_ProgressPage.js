class CDUProgressPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUProgressPage.ShowPage(fmc, mcdu);
        }), 'FMGC';
        mcdu.returnPageCallback = () => {
            CDUProgressPage.ShowPage(fmc, mcdu);
        };
        const flightNo = fmc.flightNumber || "";
        const flMax = fmc.getMaxFlCorrected();
        const flOpt = (fmc._zeroFuelWeightZFWCGEntered && fmc._blockFuelEntered && (fmc.isAllEngineOn() || Simplane.getIsGrounded())) ? "{green}FL" + (Math.floor(flMax / 5) * 5).toString() + "{end}" : "-----";
        const gpsPrimaryStatus = SimVar.GetSimVarValue("L:A32NX_ADIRS_USES_GPS_AS_PRIMARY", "Bool") ? "{green}GPS PRIMARY{end}" : "";
        let flCrz = "-----";
        switch (fmc.currentFlightPhase) {
            case FmgcFlightPhases.PREFLIGHT:
            case FmgcFlightPhases.TAKEOFF: {
                if (fmc._cruiseEntered) {
                    flCrz = "FL" + fmc.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                }
                break;
            }
            case FmgcFlightPhases.CLIMB: {
                const alt = Math.round(Simplane.getAutoPilotSelectedAltitudeLockValue("feet") / 100);
                const altCtn = Math.round(fmc.constraintAlt / 100);
                if (!fmc._cruiseEntered && !fmc._activeCruiseFlightLevelDefaulToFcu) {
                    flCrz = "FL" + (altCtn && alt > altCtn ? altCtn.toFixed(0).padStart(3, "0") : alt.toFixed(0).padStart(3, "0")) + "[color]cyan";
                } else {
                    flCrz = "FL" + fmc.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                }
                break;
            }
            case FmgcFlightPhases.CRUISE: {
                flCrz = "FL" + fmc.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                break;
            }
        }
        let flightPhase;
        switch (fmc.currentFlightPhase) {
            case FmgcFlightPhases.PREFLIGHT:
            case FmgcFlightPhases.TAKEOFF:
                flightPhase = "TO";
                break;
            case FmgcFlightPhases.CLIMB:
                flightPhase = "CLB";
                break;
            case FmgcFlightPhases.CRUISE:
                flightPhase = "CRZ";
                break;
            case FmgcFlightPhases.DESCENT:
                flightPhase = "DES";
                break;
            case FmgcFlightPhases.APPROACH:
                flightPhase = "APPR";
                break;
            case FmgcFlightPhases.GOAROUND:
                flightPhase = "GA";
                break;
            default:
                flightPhase = "";
                break;
        }

        mcdu.onLeftInput[0] = (value) => {
            if (fmc.trySetCruiseFlCheckInput(value)) {
                mcdu.requestUpdate();
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUProgressPage.ShowReportPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUProgressPage.ShowPredictiveGPSPage(fmc, mcdu);
        };

        let progBearingDist = "{small}\xa0---°\xa0/----.-{end}";
        let progWaypoint = "[\xa0\xa0\xa0\xa0\xa0]";
        if (fmc.progWaypointIdent !== undefined) {
            progWaypoint = fmc.progWaypointIdent.padEnd("7", "\xa0");
            if (fmc.progBearing > 0 && fmc.progDistance > 0) {
                const distDigits = fmc.progDistance > 9999 ? 0 : 1;
                progBearingDist = `{small}{green}\xa0${fmc.progBearing.toFixed(0).padStart(3, "0")}°\xa0/${fmc.progDistance.toFixed(distDigits).padStart(3)}{end}{end}`;
            }
        }
        mcdu.onRightInput[3] = (input) => {
            fmc.trySetProgWaypoint(mcdu, input, () => {
                mcdu.requestUpdate();
            });
        };
        mcdu.setTemplate([
            ["{green}" + flightPhase.padStart(15, "\xa0") + "{end}\xa0" + flightNo.padEnd(11, "\xa0")],
            ["\xa0" + "CRZ\xa0", "OPT\xa0\xa0\xa0\xa0REC MAX"],
            [flCrz, flOpt + "\xa0\xa0\xa0\xa0" + "{magenta}FL" + flMax.toString() + "\xa0{end}"],
            [""],
            ["<REPORT", ""],
            ["\xa0POSITION UPDATE AT"],
            ["{small}*{end}[\xa0\xa0\xa0\xa0][color]cyan"],
            ["\xa0\xa0BRG / DIST"],
            [progBearingDist, `{small}{white}TO{end}{end}\xa0{cyan}${progWaypoint}{end}`],
            ["\xa0PREDICTIVE"],
            ["<GPS", gpsPrimaryStatus],
            ["REQUIRED", "ESTIMATED", "ACCUR{sp}"],
            ["{small}3.4NM{end}[color]cyan", "{small}0.07NM{end}[color]green", "HIGH[color]green"]
        ]);
    }
    static ShowReportPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUProgressPage.ShowReportPage(fmc, mcdu);
        });

        let altCell = "---";
        if (isFinite(fmc.cruiseFlightLevel)) {
            altCell = fmc.cruiseFlightLevel.toFixed(0);
        }
        mcdu.onRightInput[0] = (value) => {
            if (fmc.setCruiseFlightLevelAndTemperature(value)) {
                mcdu.requestUpdate();
            }
        };
        let toWaypoint;
        if (fmc.routeIndex === fmc.flightPlanManager.getWaypointsCount() - 1) {
            toWaypoint = fmc.flightPlanManager.getDestination();
        } else {
            toWaypoint = fmc.flightPlanManager.getWaypoint(fmc.routeIndex);
        }
        let toWaypointCell = "";
        let toWaypointUTCCell = "---";
        const toWaypointAltCell = "----";
        let nextWaypointCell = "";
        let nextWaypointUTCCell = "----";
        const nextWaypointAltCell = "---";
        if (toWaypoint) {
            toWaypointCell = toWaypoint.ident;
            toWaypointUTCCell = FMCMainDisplay.secondsTohhmm(toWaypoint.infos.etaInFP);
            let nextWaypoint;
            if (fmc.routeIndex + 1 === fmc.flightPlanManager.getWaypointsCount()) {
                nextWaypoint = fmc.flightPlanManager.getDestination();
            } else {
                nextWaypoint = fmc.flightPlanManager.getWaypoint(fmc.routeIndex + 1);
            }
            if (nextWaypoint) {
                nextWaypointCell = nextWaypoint.ident;
                nextWaypointUTCCell = FMCMainDisplay.secondsTohhmm(nextWaypoint.infos.etaInFP);
            }
        }
        let destCell = "";
        let destUTCCell = "---";
        let destDistCell = "----";
        if (fmc.flightPlanManager.getDestination()) {
            console.log(fmc.flightPlanManager.getDestination());
            destCell = fmc.flightPlanManager.getDestination().ident;
            const destInfos = fmc.flightPlanManager.getDestination().infos;
            if (destInfos instanceof AirportInfo) {
                const destApproach = destInfos.approaches[fmc.flightPlanManager.getApproachIndex()];
                if (destApproach) {
                    destCell += destApproach.runway;
                }
            }
            destUTCCell = FMCMainDisplay.secondsTohhmm(fmc.flightPlanManager.getDestination().infos.etaInFP);
            destDistCell = fmc.flightPlanManager.getDestination().infos.totalDistInFP.toFixed(0);
        }
        mcdu.setTemplate([
            ["REPORT"],
            ["\xa0OVHD", "ALT\xa0", "UTC"],
            ["", altCell + "[color]cyan"],
            ["\xa0TO"],
            [toWaypointCell + "[color]green", toWaypointAltCell + "[color]green", toWaypointUTCCell + "[color]green"],
            ["\xa0NEXT"],
            [nextWaypointCell + "[color]green", nextWaypointAltCell + "[color]green", nextWaypointUTCCell + "[color]green"],
            ["\xa0SAT", "FOB\xa0", "T. WIND"],
            ["[][color]cyan"],
            ["\xa0S/C", "", "UTC DIST"],
            [""],
            ["\xa0DEST", "EFOB", "UTC DIST"],
            [destCell, "", destUTCCell + " " + destDistCell]
        ]);
    }
    static ShowPredictiveGPSPage(fmc, mcdu, overrideDestETA = "") {
        mcdu.setCurrentPage(() => {
            CDUProgressPage.ShowPredictiveGPSPage(fmc, mcdu, overrideDestETA);
        });

        let destIdentCell = "";
        let destETACell = "";
        if (fmc.flightPlanManager.getDestination()) {
            destIdentCell = fmc.flightPlanManager.getDestination().ident + "[color]green";
            if (overrideDestETA) {
                destETACell = overrideDestETA;
            } else {
                destETACell = FMCMainDisplay.secondsTohhmm(fmc.flightPlanManager.getDestination().infos.etaInFP);
            }
            mcdu.onRightInput[0] = (value) => {
                CDUProgressPage.ShowPredictiveGPSPage(fmc, mcdu, value);
            };
        }
        mcdu.setTemplate([
            ["PREDICTIVE GPS"],
            ["DEST", "ETA"],
            [destIdentCell, destETACell + "[color]cyan", "{small}PRIMARY{end}"],
            ["\xa0\xa0-15 -10 -5 ETA+5 +10 +15"],
            ["{small}\xa0\xa0\xa0\xa0Y\xa0\xa0Y\xa0\xa0\xa0Y\xa0\xa0Y\xa0\xa0Y\xa0\xa0\xa0Y\xa0\xa0Y{end}[color]green"],
            ["WPT", "ETA"],
            ["[ ][color]cyan", "", "{small}PRIMARY{end}"],
            ["\xa0\xa0-15 -10 -5 ETA+5 +10 +15"],
            [""],
            ["", "", "DESELECTED SATELLITES"],
            ["[ ][color]cyan"],
            [""],
            [""]
        ]);
    }
}
