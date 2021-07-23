class CDUPositionMonitorPage {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUPositionMonitorPage.ShowPage(fmc, mcdu);
        });

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

        mcdu.setTemplate([
            ["POSITION MONITOR"],
            [""],
            ["{small}FMS1{end}", currPos + "[color]green"],
            ["\xa0\xa0\xa0\xa0\xa0\xa03IRS/GPS"],
            ["{small}FMS2{end}", currPos + "[color]green"],
            ["\xa0\xa0\xa0\xa0\xa0\xa03IRS/GPS"],
            ["{small}GPIRS{end}", currPos + "[color]green"],
            [""],
            ["{small}MIX IRS{end}", currPos + "[color]green"],
            ["\xa0\xa0IRS1", "IRS3\xa0", "\xa0IRS2"],
            ["{small}NAV 0.0{end}[color]green", "{small}NAV 0.0{end}[color]green", "{small}NAV 0.0{end}[color]green"],
            ["", "SEL\xa0"],
            ["{FREEZE[color]cyan", "NAVAIDS>"]
        ]);

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[5] = () => {
            CDUSelectedNavaids.ShowPage(fmc, mcdu);
        };

        mcdu.onLeftInput[5] = () => {
            CDUPosFrozen.ShowPage(fmc, mcdu, currPos);
        };
    }
}
