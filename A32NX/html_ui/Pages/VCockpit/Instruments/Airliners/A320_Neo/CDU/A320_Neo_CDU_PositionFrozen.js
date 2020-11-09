class CDUPosFrozen {
    static ShowPage(mcdu, currPos) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PosFrozen;
        const UTC_SECONDS = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"));
        const hours = Math.floor(UTC_SECONDS / 3600) || 0;
        const minutes = Math.floor(UTC_SECONDS % 3600 / 60) || 0;
        const hhmm = `${hours.toString().padStart(2, "0") || "00"}${minutes.toString().padStart(2, "0") || "00"}`;
        mcdu.setTemplate([
            [`POSITION FROZEN AT ${hhmm}`],
            [""],
            ["FMS1", `${currPos}[color]green`],
            ["", "", "3IRS/GPS"],
            ["FMS2", `${currPos}[color]green`],
            ["", "", "3IRS/GPS"],
            ["GPIRS", `${currPos}[color]green`],
            [""],
            ["MIX IRS", `${currPos}[color]green`],
            ["IRS1", "IRS3", "IRS2"],
            ["NAV 0.0[color]green", "NAV 0.0[color]green", "NAV 0.0[color]green"],
            ["", "SEL"],
            ["{UNFREEZE[color]blue", "NAVAIDS>"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUPositionMonitorPage.ShowPage(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            CDUSelectedNavaids.ShowPage(mcdu);
        };
    }
}