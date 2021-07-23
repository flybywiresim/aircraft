class CDU_CFDS_Test_Inst_DFDRS_Menu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDU_CFDS_Test_Inst_DFDRS_Menu.ShowPage(fmc, mcdu);
        });
        mcdu.setTemplate([
            ["DFDRS"],
            ["LAST LEG[color]inop", "CLASS 3[color]inop"],
            ["<REPORT[color]inop", "FAULTS>[color]inop"],
            ["PREVIOUS LEGS[color]inop"],
            ["<REPORT[color]inop", "TEST>[color]inop"],
            [""],
            ["<LRU IDENT[color]inop"],
            [""],
            ["<GND SCANNING[color]inop", "EIS 3>[color]inop"],
            ["TROUBLE SHOOT[color]inop", "GROUND[color]inop"],
            ["<DATA[color]inop", "REPORT>[color]inop"],
            ["", "SPECIFIC[color]inop"],
            ["<RETURN[color]cyan", "DATA>[color]inop"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(fmc, mcdu);
        };

    }
}
