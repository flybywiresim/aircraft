class CDUCfdsTestLG {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestLG.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "L/G"],
            ["<LGCIU 1[color]inop"],
            [""],
            ["<LGCIU 2[color]inop"],
            [""],
            ["<BSCU 1[color]inop"],
            [""],
            ["<BSCU 2[color]inop"],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(fmc, mcdu);
        };
    }
}
