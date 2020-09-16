class CDUPositionMonitorPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        let currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toShortDegreeString();
        mcdu.setTemplate([
            ["POSITION MONITOR"],
            [""],
            ["FMGC1", currPos + "[color]green"],
            ["", "", "3IRS/GPS"],
            ["FMGC2", currPos + "[color]green"],
            ["", "", "3IRS/GPS"],
            ["GPIRS", currPos + "[color]green"],
            [""],
            ["MIX IRS", currPos + "[color]green"],
            ["IRS1", "IRS3", "IRS2"],
            ["NAV 0.0", "NAV 0.0", "NAV 0.0"],
            ["", "SEL"],
            ["←FREEZE[color]blue", "NAVAIDS>"]
        ]);

        mcdu.onRightInput[5]= () => {
            CDUSelectedNavaids.ShowPage(mcdu)
        }

        mcdu.onLeftInput[5] = () => {
            CDUPosFrozen.ShowPage(mcdu, currPos)
        }
    }
}
//# sourceMappingURL=A320_Neo_CDU_PositionMonitorPage.js.map