class CDUAtcPositionReport {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        let UTCTIme = "______[color]red";

        if (SimVar.GetGlobalVarValue("ZULU TIME", "seconds")) {
            const seconds = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
            UTCTIme = Utils.SecondsToDisplayTime(seconds, true, true, false);
            UTCTIme = UTCTIme.toString();
        }

        mcdu.setTemplate([
            ["POSITION REPORT"],
            ["OVHD", "UTC/ALT"],
            ["[]", "[]"],
            ["PPOS", "UTC/ALT"],
            ["_______[color]red", "____/" + UTCTIme],
            ["TO", "UTC"],
            ["[]", "[]"],
            ["NEXT"],
            ["[]"],
            ["ALL FIELDS"],
            ["ERASE"],
            ["ATC MENU", "XFR TO[color]blue"],
            ["<RETURN", "DCDU*[color]blue"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };
    }
}
