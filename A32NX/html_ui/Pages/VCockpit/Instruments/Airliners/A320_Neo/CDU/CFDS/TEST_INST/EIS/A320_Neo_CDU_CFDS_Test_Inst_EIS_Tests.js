class CDU_CFDS_Test_Inst_EIS_Tests {
    static ShowPage(mcdu, eisIndex) {
        mcdu.clearDisplay();
        const title = "EIS ( DMC " + eisIndex + " )";
        mcdu.setTemplate([
            [title],
            ["", "", "TEST"],
            [""],
            [""],
            ["<SYSTEM TEST"],
            [""],
            ["<DISPLAY TEST"],
            [""],
            ["<I/P TEST"],
            [""],
            ["<SYSTEM TEST RESULT"],
            [""],
            ["<RETURN[color]blue"]
        ]);

        // INOP BUTTONS
        mcdu.onLeftInput[1] = () => {
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
        mcdu.onLeftInput[2] = () => {
            CDU_CFDS_Test_Inst_EIS_Tests_Display.ShowPage(mcdu, eisIndex);
        }
        mcdu.onLeftInput[5] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, eisIndex);
        }
    }
}