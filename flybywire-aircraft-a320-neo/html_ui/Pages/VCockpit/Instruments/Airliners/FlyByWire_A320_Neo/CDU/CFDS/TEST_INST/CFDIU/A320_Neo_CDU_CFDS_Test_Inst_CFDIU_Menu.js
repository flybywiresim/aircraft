class CDU_CFDS_Test_Inst_CFDIU_Menu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDU_CFDS_Test_Inst_CFDIU_Menu.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["CFDIU"],
            [""],
            ["<LAST LEG REPORT[color]inop"],
            [""],
            ["<LRU IDENTIFICATION[color]inop"],
            [""],
            ["<GROUND SCANNING[color]inop"],
            [""],
            ["<POWER UP TEST RESULT[color]inop"],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(fmc, mcdu);
        };

    }
}
