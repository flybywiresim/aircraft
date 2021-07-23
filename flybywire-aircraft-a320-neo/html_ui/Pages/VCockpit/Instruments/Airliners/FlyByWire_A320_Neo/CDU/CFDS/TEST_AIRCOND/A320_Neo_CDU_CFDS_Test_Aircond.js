class CDUCfdsTestAircond {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestAircond.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "AIR COND"],
            ["<CPC 1[color]inop"],
            [""],
            ["<CPC 2[color]inop"],
            [""],
            ["<TEMP CTL[color]inop"],
            [""],
            ["<AEVC[color]inop"],
            [""],
            ["<AFT CHC[color]inop"],
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
