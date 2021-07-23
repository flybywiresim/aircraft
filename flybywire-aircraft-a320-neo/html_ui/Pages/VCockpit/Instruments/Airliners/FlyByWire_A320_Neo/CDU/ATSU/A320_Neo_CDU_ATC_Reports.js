class CDUAtcReports {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUAtcReports.ShowPage(fmc, mcdu);
        });
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
            CDUAtcPositionReport.ShowPage(fmc, mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcMenu.ShowPage1(fmc, mcdu);
        };
    }
}
