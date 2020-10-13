class CDU_CFDS_Test_Inst_EIS3_Menu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["EIS ( DMC 3 )"],
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
        mcdu.onRightInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        }

    }
}