class CDU_CFDS_Test_Inst_EIS_Tests {
    static ShowPage(mcdu, eisIndex) {
        mcdu.clearDisplay();
        const title = "EIS ( DMC " + eisIndex + " )";
        mcdu.setTemplate([
            [title],
            ["", "", "TEST"],
            [""],
            [""],
            ["<SYSTEM TEST[color]inop"],
            [""],
            ["<DISPLAY TEST"],
            [""],
            ["<I/P TEST[color]inop"],
            [""],
            ["<SYSTEM TEST RESULT[color]inop"],
            [""],
            ["<RETURN[color]blue"]
        ]);

        mcdu.onLeftInput[2] = () => {
            CDU_CFDS_Test_Inst_EIS_Tests_Display.ShowPage(mcdu, eisIndex);
        };
        mcdu.onLeftInput[5] = () => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(mcdu, eisIndex);
        };
    }
}