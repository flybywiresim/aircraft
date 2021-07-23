class CDUCfdsTestEng {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestEng.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "ENG"],
            ["<EIU 1[color]inop", "EIU 2>[color]inop"],
            [""],
            ["<FADEC 1A[color]inop", "FADEC 1B>[color]inop"],
            [""],
            ["<FADEC 2A[color]inop", "FADEC 2B>[color]inop"],
            [""],
            ["<EVMU[color]inop"],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage2(fmc, mcdu);
        };
    }
}
