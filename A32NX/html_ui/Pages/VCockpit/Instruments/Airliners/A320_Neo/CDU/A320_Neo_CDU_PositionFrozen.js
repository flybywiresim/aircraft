class CDUPosFrozen {
    static ShowPage(mcdu, currPos) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            [`POSITION FROZEN`],
            [""],
            ["FMGC1", `${currPos}[color]green`],
            ["", "", "3IRS/GPS"],
            ["FMGC2", `${currPos}[color]green`],
            ["", "", "3IRS/GPS"],
            ["GPIRS", `${currPos}[color]green`],
            [""],
            ["MIXIRS", `${currPos}[color]green`],
            ["IRS1", "IRS3", "IRS2"],
            ["NAV 0.0[color]green", "NAV 0.0[color]green", "NAV 0.0[color]green"],
            ["", "SEL"],
            ["←UNFREEZE[color]blue", "NAVAIDS>"]
        ])

        mcdu.onLeftInput[5] = () => {
            CDUPositionMonitorPage.ShowPage(mcdu)
        }

        mcdu.onRightInput[5] = () => {
            CDUSelectedNavaids.ShowPage(mcdu)
        }
    }
}