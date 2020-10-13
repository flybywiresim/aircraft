class CDU_CFDS_Test_Inst_EIS1_Tests_Display {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.setTemplate([
            ["EIS ( DMC 1 )"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["","","DISPLAY TEST"],
            [""],
            ["","","IN"],
            [""],
            ["","","PROGRESS "],
            [""],
            ["<RETURN[color]blue"]
        ]);

        // IMPLEMENTED BUTTONS
        mcdu.onLeftInput[5] = () => {
            CDU_CFDS_Test_Inst_EIS1_Tests.ShowPage(mcdu);
        }

    }
}