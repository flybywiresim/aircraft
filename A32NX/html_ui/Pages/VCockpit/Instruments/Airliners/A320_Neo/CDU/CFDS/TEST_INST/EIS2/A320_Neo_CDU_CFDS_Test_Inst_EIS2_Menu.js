class CDU_CFDS_Test_Inst_EIS2_Menu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["EIS ( DMC 2 )"],
            [""],
            ["<LAST LEG REPORT"],
            [""],
            ["<PREVIOUS LEGS REPORT"],
            [""],
            ["<LRU IDENTIFICATION"],
            [""],
            ["<ENGINES", "TEST>"],
            [""],
            ["<DUMP BITE MEMORY"],
            [""],
            ["<RETURN[color]blue"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[0] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        }
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS2_Tests.ShowPage(mcdu);
        }

    }
}