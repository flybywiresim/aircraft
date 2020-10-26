class CDU_CFDS_Test_Inst_DFDRS_Menu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
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
            ["<RETURN[color]blue", "DATA>[color]inop"]
        ]);

        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        };

    }
}