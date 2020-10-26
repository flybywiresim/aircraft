class CDUCfdsTestInst {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "INST"],
            ["<ECAM 1", "CFDIU>"],
            [""],
            ["<ECAM 2", "EIS 1>"],
            [""],
            ["<DFDRS", "EIS 2>"],
            [""],
            ["", "EIS 3>"],
            [""],
            [""],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[0] = () => {
            CDU_CFDS_Test_Inst_ECAM_Menu.ShowPage(mcdu, 1);
        };
        mcdu.onLeftInput[1] = () => {
            CDU_CFDS_Test_Inst_ECAM_Menu.ShowPage(mcdu, 2);
        };
        mcdu.onLeftInput[2] = () => {
            CDU_CFDS_Test_Inst_DFDRS_Menu.ShowPage(mcdu);
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(mcdu);
        };
        mcdu.onRightInput[0] = () => {
            CDU_CFDS_Test_Inst_CFDIU_Menu.ShowPage(mcdu);
        };
        mcdu.onRightInput[1] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, 1);
        };
        mcdu.onRightInput[2] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, 2);
        };
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, 3);
        };

    }
}