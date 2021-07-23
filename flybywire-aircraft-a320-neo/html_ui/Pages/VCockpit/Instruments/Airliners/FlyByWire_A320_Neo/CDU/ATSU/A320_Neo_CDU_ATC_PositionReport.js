class CDUAtcPositionReport {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAtcPositionReport.ShowPage(fmc, mcdu);
        });

        const currUTCCell = FMCMainDisplay.secondsTohhmm(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"),
            SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toShortDegreeString();

        if (currPos.includes("N")) {
            var currPosSplit = currPos.split("N");
            var sep = "N/";
        } else {
            var currPosSplit = currPos.split("S");
            var sep = "S/";
        }
        const latStr = currPosSplit[0];
        const lonStr = currPosSplit[1];
        currPos = latStr + sep + lonStr;
        let ovhdWaypoint;
        if (fmc.routeIndex === fmc.flightPlanManager.getWaypointsCount() - 1) {
            ovhdWaypoint = fmc.flightPlanManager.getOrigin();
        } else {
            ovhdWaypoint = fmc.flightPlanManager.getWaypoint(fmc.routeIndex - 1);
        }
        let toWaypoint;
        if (fmc.routeIndex === fmc.flightPlanManager.getWaypointsCount() - 1) {
            toWaypoint = fmc.flightPlanManager.getDestination();
        } else {
            toWaypoint = fmc.flightPlanManager.getWaypoint(fmc.routeIndex);
        }
        let ovhdWaypointCell = "\xa0\xa0\xa0";
        let ovhdWaypointUTCCell = "\xa0\xa0";
        let toWaypointCell = "\xa0\xa0\xa0";
        let toWaypointUTCCell = "\xa0\xa0";
        let nextWaypointCell = "\xa0\xa0\xa0";
        let nextWaypointUTCCell = "\xa0\xa0";
        let altCell = "\xa0\xa0";
        const currentALt = parseInt(SimVar.GetSimVarValue("GPS POSITION ALT", "feet"));
        const transAlt = parseInt(SimVar.GetSimVarValue("L:AIRLINER_TRANS_ALT", "Number"));

        if (ovhdWaypoint) {
            ovhdWaypointCell = ovhdWaypoint.ident;
            ovhdWaypointUTCCell = FMCMainDisplay.secondsTohhmm(ovhdWaypoint.infos.etaInFP);
        }
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
        if (currentALt > transAlt) {
            altCell = "FL" + Math.floor(currentALt / 100);
        } else {
            altCell = Math.floor(currentALt);
        }

        mcdu.setTemplate([
            ["POSITION REPORT"],
            ["\xa0OVHD", "UTC/ALT\xa0"],
            ["[" + ovhdWaypointCell + "][color]cyan", "[" + ovhdWaypointUTCCell + "/" + altCell + "][color]cyan"],
            ["\xa0PPOS", "UTC/ALT\xa0"],
            ["{small}" + currPos + "{end}[color]green", "{small}" + currUTCCell + "Z" + "/" + altCell + "{end}[color]green"],
            ["\xa0TO", "UTC/ALT\xa0"],
            ["[" + toWaypointCell + "][color]cyan", "[" + nextWaypointUTCCell + "/" + altCell + "][color]cyan"],
            ["\xa0NEXT"],
            ["[" + nextWaypointCell + "][color]cyan"],
            [""],
            [""],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]inop"],
            ["<RETURN", "DCDU\xa0[color]inop"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(fmc, mcdu);
        };
    }
}
