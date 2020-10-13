class CDU_CFDS_Test_Inst_EIS2_Tests {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["EIS ( DMC 2 )"],
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
        }
        mcdu.onLeftInput[3] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }
        mcdu.onLeftInput[4] = () => {
            mcdu.showErrorMessage("NOT YET IMPLEMENTED");
        }

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[2] = () => {
            CDU_CFDS_Test_Inst_EIS2_Tests_Display.ShowPage(mcdu);
        }
        mcdu.onLeftInput[5] = () => {
            CDU_CFDS_Test_Inst_EIS2_Menu.ShowPage(mcdu);
        }

    }
}