class CDU_CFDS_Test_Inst_ECAM_Menu {
    static ShowPage(fmc, mcdu, ecamIndex) {
        mcdu.setCurrentPage(() => {
            CDU_CFDS_Test_Inst_ECAM_Menu.ShowPage(fmc, mcdu, ecamIndex);
        });
        const title = "ECAM-" + ecamIndex;
        mcdu.setTemplate([
            [title],
            ["", "", "FWC1/2-SDAC1/2-ECP"],
            ["<LAST LEG REPORT[color]inop"],
            [""],
            ["<PREVIOUS LEGS REPORT[color]inop"],
            [""],
            ["<LRU IDENTIFICATION[color]inop"],
            [""],
            ["<GROUND SCANNING[color]inop"],
            [""],
            ["<CLASS 3 FAULTS[color]inop"],
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
