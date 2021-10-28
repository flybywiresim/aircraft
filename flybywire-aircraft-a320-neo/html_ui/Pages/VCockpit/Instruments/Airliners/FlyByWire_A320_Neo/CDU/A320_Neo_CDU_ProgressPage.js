class CDUProgressPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ProgressPage;
        mcdu.returnPageCallback = () => {
            CDUProgressPage.ShowPage(mcdu);
        };
        mcdu.activeSystem = 'FMGC';
        const flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
        const flMax = mcdu.getMaxFlCorrected();
        const flOpt = (mcdu._zeroFuelWeightZFWCGEntered && mcdu._blockFuelEntered && (mcdu.isAllEngineOn() || Simplane.getIsGrounded())) ? "{green}FL" + (Math.floor(flMax / 5) * 5).toString() + "{end}" : "-----";
        const adirsUsesGpsAsPrimary = SimVar.GetSimVarValue("L:A32NX_ADIRS_USES_GPS_AS_PRIMARY", "Bool");
        const gpsPrimaryStatus = adirsUsesGpsAsPrimary ? "{green}GPS PRIMARY{end}" : "";
        let flCrz = "-----";
        switch (mcdu.currentFlightPhase) {
            case FmgcFlightPhases.PREFLIGHT:
            case FmgcFlightPhases.TAKEOFF: {
                if (mcdu._cruiseEntered) {
                    flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                }
                break;
            }
            case FmgcFlightPhases.CLIMB: {
                const alt = Math.round(Simplane.getAutoPilotSelectedAltitudeLockValue("feet") / 100);
                const altCtn = Math.round(mcdu.constraintAlt / 100);
                if (!mcdu._cruiseEntered && !mcdu._activeCruiseFlightLevelDefaulToFcu) {
                    flCrz = "FL" + (altCtn && alt > altCtn ? altCtn.toFixed(0).padStart(3, "0") : alt.toFixed(0).padStart(3, "0")) + "[color]cyan";
                } else {
                    flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                }
                break;
            }
            case FmgcFlightPhases.CRUISE: {
                flCrz = "FL" + mcdu.cruiseFlightLevel.toFixed(0).padStart(3, "0") + "[color]cyan";
                break;
            }
        }
        let flightPhase;
        switch (mcdu.currentFlightPhase) {
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
            if (mcdu.trySetCruiseFlCheckInput(value)) {
                CDUProgressPage.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUProgressPage.ShowReportPage(mcdu);
        };
        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUProgressPage.ShowPredictiveGPSPage(mcdu);
        };

        let progBearingDist = "{small}\xa0---°\xa0/----.-{end}";
        let progWaypoint = "[\xa0\xa0\xa0\xa0\xa0]";
        if (mcdu.progWaypointIdent !== undefined) {
            progWaypoint = mcdu.progWaypointIdent.padEnd("7", "\xa0");
            if (mcdu.progBearing > 0 && mcdu.progDistance > 0) {
                const distDigits = mcdu.progDistance > 9999 ? 0 : 1;
                progBearingDist = `{small}{green}\xa0${mcdu.progBearing.toFixed(0).padStart(3, "0")}°\xa0/${mcdu.progDistance.toFixed(distDigits).padStart(3)}{end}{end}`;
            }
        }
        mcdu.onRightInput[3] = (input) => {
            mcdu.trySetProgWaypoint(input, () => {
                CDUProgressPage.ShowPage(mcdu);
            });
        };
        mcdu.setTemplate([
            ["{green}" + flightPhase.padStart(15, "\xa0") + "{end}\xa0" + flightNo.padEnd(11, "\xa0")],
            ["\xa0" + "CRZ\xa0", "OPT\xa0\xa0\xa0\xa0REC MAX"],
            [flCrz, flOpt + "\xa0\xa0\xa0\xa0" + "{magenta}FL" + flMax.toString() + "\xa0{end}"],
            [""],
            ["<REPORT", ""],
            [adirsUsesGpsAsPrimary ? "" : "\xa0POSITION UPDATE AT"],
            [adirsUsesGpsAsPrimary ? "" : "{small}*{end}[\xa0\xa0\xa0\xa0][color]cyan"],
            ["\xa0\xa0BRG / DIST"],
            [progBearingDist, `{small}{white}TO{end}{end}\xa0{cyan}${progWaypoint}{end}`],
            ["\xa0PREDICTIVE"],
            ["<GPS", gpsPrimaryStatus],
            ["REQUIRED", "ESTIMATED", "ACCUR{sp}"],
            ["{small}3.4NM{end}[color]cyan", "{small}0.07NM{end}[color]green", "HIGH[color]green"]
        ]);
        mcdu.page.SelfPtr = setTimeout(() => {
            if (mcdu.page.Current === mcdu.page.ProgressPage) {
                CDUProgressPage.ShowPage(mcdu);
            }
        }, mcdu.PageTimeout.Prog);
    }
    static ShowReportPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ProgressPageReport;
        let altCell = "---";
        if (isFinite(mcdu.cruiseFlightLevel)) {
            altCell = mcdu.cruiseFlightLevel.toFixed(0);
        }
        mcdu.onRightInput[0] = (value) => {
            if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                CDUProgressPage.ShowReportPage(mcdu);
            }
        };
        let toWaypoint;
        if (mcdu.routeIndex === mcdu.flightPlanManager.getWaypointsCount() - 1) {
            toWaypoint = mcdu.flightPlanManager.getDestination();
        } else {
            toWaypoint = mcdu.flightPlanManager.getWaypoint(mcdu.routeIndex);
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
            if (mcdu.routeIndex + 1 === mcdu.flightPlanManager.getWaypointsCount()) {
                nextWaypoint = mcdu.flightPlanManager.getDestination();
            } else {
                nextWaypoint = mcdu.flightPlanManager.getWaypoint(mcdu.routeIndex + 1);
            }
            if (nextWaypoint) {
                nextWaypointCell = nextWaypoint.ident;
                nextWaypointUTCCell = FMCMainDisplay.secondsTohhmm(nextWaypoint.infos.etaInFP);
            }
        }
        let destCell = "";
        let destUTCCell = "---";
        let destDistCell = "----";
        if (mcdu.flightPlanManager.getDestination()) {
            console.log(mcdu.flightPlanManager.getDestination());
            destCell = mcdu.flightPlanManager.getDestination().ident;
            const destInfos = mcdu.flightPlanManager.getDestination().infos;
            if (destInfos instanceof AirportInfo) {
                const destApproach = destInfos.approaches[mcdu.flightPlanManager.getApproachIndex()];
                if (destApproach) {
                    destCell += destApproach.runway;
                }
            }
            destUTCCell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            destDistCell = mcdu.flightPlanManager.getDestination().infos.totalDistInFP.toFixed(0);
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
    static ShowPredictiveGPSPage(mcdu, overrideDestETA = "") {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ProgressPagePredictiveGPS;
        let destIdentCell = "";
        let destETACell = "";
        if (mcdu.flightPlanManager.getDestination()) {
            destIdentCell = mcdu.flightPlanManager.getDestination().ident + "[color]green";
            if (overrideDestETA) {
                destETACell = overrideDestETA;
            } else {
                destETACell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            }
            mcdu.onRightInput[0] = (value) => {
                CDUProgressPage.ShowPredictiveGPSPage(mcdu, value);
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
