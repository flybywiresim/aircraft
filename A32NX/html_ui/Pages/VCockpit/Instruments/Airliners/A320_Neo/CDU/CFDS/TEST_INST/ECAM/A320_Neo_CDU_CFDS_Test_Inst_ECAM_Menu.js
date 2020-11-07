class CDU_CFDS_Test_Inst_ECAM_Menu {
    static ShowPage(mcdu, ecamIndex) {
        mcdu.clearDisplay();
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
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        };
    }
}