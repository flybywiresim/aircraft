class CDU_CFDS_Test_Inst_EIS_Tests_Display {
    static ShowPage(mcdu, eisIndex) {
        mcdu.clearDisplay();
        const title = "EIS ( DMC " + eisIndex + " )";
        mcdu.setTemplate([
            [title],
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

        mcdu.onLeftInput[5] = () => {
            CDU_CFDS_Test_Inst_EIS_Tests.ShowPage(mcdu, eisIndex);
        }
    }
}