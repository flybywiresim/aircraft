class CDUCfdsTestIce {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestIce.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "ICE + RAIN"],
            ["<WHC 1[color]inop"],
            [""],
            ["<WHC 2[color]inop"],
            [""],
            ["<PHC 1[color]inop", "WING ANTI ICE>[color]inop"],
            ["", "(THRU ECS)[color]inop"],
            ["<PHC 2[color]inop"],
            [""],
            ["<PHC 3[color]inop"],
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
