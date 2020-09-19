class CDUProgressPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        let flightPhase = "CRZ";
        let flightNo = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string");
        mcdu.onLeftInput[1] = () => {
            CDUProgressPage.ShowReportPage(mcdu);
        };
        mcdu.onLeftInput[4] = () => {
            CDUProgressPage.ShowPredictiveGPSPage(mcdu);
        };
        mcdu.setTemplate([
            ["ECON " + flightPhase + " " + flightNo],
            [flightPhase, "REC MAX", "OPT"],
            [""],
            [""],
            ["<REPORT", ""],
            ["UPDATE AT"],
            ["*[][color]blue"],
            ["BRG / DIST"],
            ["---°.----.-", "[ ][color]blue", "TO"],
            ["PREDICTIVE"],
            ["<GPS", "GPS PRIMARY[color]green"],
            ["REQUIRED", "ESTIMATED", "ACCUR"],
            ["3.4NM[color]blue", "0.07NM[color]green", "HIGH[color]green"]
        ]);
    }
    static ShowReportPage(mcdu) {
        mcdu.clearDisplay();
        let altCell = "---";
        if (isFinite(mcdu.cruiseFlightLevel)) {
            altCell = mcdu.cruiseFlightLevel.toFixed(0);
        }
        mcdu.onRightInput[0] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (mcdu.setCruiseFlightLevelAndTemperature(value)) {
                CDUProgressPage.ShowReportPage(mcdu);
            }
        };
        let toWaypoint;
        if (mcdu.routeIndex === mcdu.flightPlanManager.getWaypointsCount() - 1) {
            toWaypoint = mcdu.flightPlanManager.getDestination();
        }
        else {
            toWaypoint = mcdu.flightPlanManager.getWaypoint(mcdu.routeIndex);
        }
        let toWaypointCell = "";
        let toWaypointUTCCell = "---";
        let toWaypointAltCell = "----";
        let nextWaypointCell = "";
        let nextWaypointUTCCell = "----";
        let nextWaypointAltCell = "---";
        if (toWaypoint) {
            toWaypointCell = toWaypoint.ident;
            toWaypointUTCCell = FMCMainDisplay.secondsTohhmm(toWaypoint.infos.etaInFP);
            let nextWaypoint;
            if (mcdu.routeIndex + 1 === mcdu.flightPlanManager.getWaypointsCount()) {
                nextWaypoint = mcdu.flightPlanManager.getDestination();
            }
            else {
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
            let destInfos = mcdu.flightPlanManager.getDestination().infos;
            if (destInfos instanceof AirportInfo) {
                let destApproach = destInfos.approaches[mcdu.flightPlanManager.getApproachIndex()];
                if (destApproach) {
                    destCell += destApproach.runway;
                }
            }
            destUTCCell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            destDistCell = mcdu.flightPlanManager.getDestination().infos.totalDistInFP.toFixed(0);
        }
        mcdu.setTemplate([
            ["REPORT"],
            ["OVHD", "ALT", "UTC"],
            ["", altCell + "[color]blue"],
            ["TO"],
            [toWaypointCell + "[color]green", toWaypointAltCell + "[color]green", toWaypointUTCCell + "[color]green"],
            ["NEXT"],
            [nextWaypointCell + "[color]green", nextWaypointAltCell + "[color]green", nextWaypointUTCCell + "[color]green"],
            ["SAT", "FOB", "T. WIND"],
            ["[][color]blue"],
            ["S/C", "", "UTC DIST"],
            [""],
            ["DEST", "EFOB", "UTC DIST"],
            [destCell, "", destUTCCell + " " + destDistCell]
        ]);
    }
    static ShowPredictiveGPSPage(mcdu, overrideDestETA = "") {
        mcdu.clearDisplay();
        let destIdentCell = "";
        let destETACell = "";
        if (mcdu.flightPlanManager.getDestination()) {
            destIdentCell = mcdu.flightPlanManager.getDestination().ident + "[color]green";
            if (overrideDestETA) {
                destETACell = overrideDestETA;
            }
            else {
                destETACell = FMCMainDisplay.secondsTohhmm(mcdu.flightPlanManager.getDestination().infos.etaInFP);
            }
            mcdu.onRightInput[0] = () => {
                let value = mcdu.inOut;
                mcdu.clearUserInput();
                CDUProgressPage.ShowPredictiveGPSPage(mcdu, value);
            };
        }
        mcdu.setTemplate([
            ["PREDICTIVE GPS"],
            ["DEST", "ETA"],
            [destIdentCell, destETACell + "[color]blue", "PRIMARY"],
            ["-15 -10", "+10 +15", "-5 ETA +5"],
            ["N Y", "Y Y", "N Y Y"],
            ["WPT", "ETA"],
            ["[ ][color]blue", "", "PRIMARY"],
            ["-15 -10", "+10 +15", "-5 ETA +5"],
            [""],
            ["", "", "DESELECTED SATELLITES"],
            ["[ ][color]blue"],
            [""],
            [""]
        ]);
    }
}
//# sourceMappingURL=A320_Neo_CDU_ProgressPage.js.map