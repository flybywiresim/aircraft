class CDUPositionMonitorPage {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        const currPos = new LatLong(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude")).toShortDegreeString();
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
    }
}
//# sourceMappingURL=A320_Neo_CDU_PositionMonitorPage.js.map