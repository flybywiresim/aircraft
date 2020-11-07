class CDUCfdsTestFuel {
    // NOT USED ATM
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["SYSTEM REPORT / TEST"],
            ["", "", "FUEL"],
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
            CDU_CFDS_Test_Inst_ECAM1_Menu.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = () => {
            CDU_CFDS_Test_Inst_ECAM2_Menu.ShowPage(mcdu);
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
            CDU_CFDS_Test_Inst_EIS1_Menu.ShowPage(mcdu);
        };
        mcdu.onRightInput[2] = () => {
            CDU_CFDS_Test_Inst_EIS2_Menu.ShowPage(mcdu);
        };
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS3_Menu.ShowPage(mcdu);
        };

    }
}