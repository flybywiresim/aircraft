class CDUAtcPositionReport {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.refreshPageCallback = () => {
            CDUAtcPositionReport.ShowPage(mcdu);
        };

        let UTCTIme = "______[color]red";
        let altDisplay = "\xa0\xa0";
        const currentALt = parseInt(SimVar.GetSimVarValue("GPS POSITION ALT", "feet"));
        const transAlt = parseInt(SimVar.GetSimVarValue("L:AIRLINER_TRANS_ALT", "Number"));
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

        if (currentALt > transAlt) {
            altDisplay = "FL" + Math.floor(currentALt / 100);
        } else {
            altDisplay = Math.floor(currentALt);
        }
        if (SimVar.GetGlobalVarValue("ZULU TIME", "seconds")) {
            const seconds = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
            UTCTIme = FMCMainDisplay.secondsToUTC(seconds) + "Z";
        }

        mcdu.setTemplate([
            ["POSITION REPORT"],
            ["OVHD", "UTC/ALT"],
            ["[\xa0\xa0][color]blue", "[\xa0\xa0/\xa0\xa0][color]blue"],
            ["PPOS", "UTC/ALT"],
            [currPos + "[color]green", UTCTIme + "/" + altDisplay + "[color]green"],
            ["TO", "UTC"],
            ["[\xa0\xa0][color]blue", "[\xa0\xa0][color]blue"],
            ["NEXT"],
            ["[\xa0\xa0][color]blue"],
            ["ALL FIELDS"],
            ["ERASE"],
            ["ATC MENU", "XFR TO[color]blue"],
            ["<RETURN", "DCDU[color]blue"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };
    }
}
