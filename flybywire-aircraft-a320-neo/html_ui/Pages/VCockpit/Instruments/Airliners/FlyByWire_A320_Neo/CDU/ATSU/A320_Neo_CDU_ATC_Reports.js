class CDUAtcReports {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["ATC REPORTS"],
            [""],
            [""],
            ["\xa0POSITION"],
            ["<REPORT"],
            [""],
            [""],
            ["\xa0MESSAGE[color]inop"],
            ["\xa0MODIFY[color]inop"],
            [""],
            [""],
            ["\xa0ATC MENU"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDUAtcPositionReport.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage(mcdu);
        };
    }
}
