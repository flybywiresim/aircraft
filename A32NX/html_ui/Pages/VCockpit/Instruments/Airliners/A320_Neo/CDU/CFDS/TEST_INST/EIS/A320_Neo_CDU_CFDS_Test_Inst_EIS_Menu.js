class CDU_CFDS_Test_Inst_EIS_Menu {
    static ShowPage(mcdu, eisIndex) {
        mcdu.clearDisplay();
        const title = "EIS ( DMC " + eisIndex + " )";
        mcdu.setTemplate([
            [title],
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
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[1] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[2] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
            setTimeout(() => {
                mcdu.showErrorMessage("");
            }, 1000);
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        }
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS_Tests.ShowPage(mcdu, eisIndex);
        }

    }
}