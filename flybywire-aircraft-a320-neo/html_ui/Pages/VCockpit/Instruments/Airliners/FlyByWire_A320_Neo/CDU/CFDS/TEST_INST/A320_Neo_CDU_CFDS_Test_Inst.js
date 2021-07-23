class CDUCfdsTestInst {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDUCfdsTestInst.ShowPage(fmc, mcdu);
        });
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
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            CDU_CFDS_Test_Inst_ECAM_Menu.ShowPage(fmc, mcdu, 1);
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDU_CFDS_Test_Inst_ECAM_Menu.ShowPage(fmc, mcdu, 2);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            CDU_CFDS_Test_Inst_DFDRS_Menu.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestMenu.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            CDU_CFDS_Test_Inst_CFDIU_Menu.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(fmc, mcdu, 1);
        };
        mcdu.rightInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[2] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(fmc, mcdu, 2);
        };
        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(fmc, mcdu, 3);
        };

    }
}
