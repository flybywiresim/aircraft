class CDU_CFDS_Test_Inst_EIS_Tests {
    static ShowPage(mcdu, eisIndex) {
        mcdu.clearDisplay();
        SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 1);
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

        // Button key overrides
        mcdu.onDir = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUDirectToPage.ShowPage(mcdu);
        };
        mcdu.onProg = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUProgressPage.ShowPage(mcdu);
        };
        mcdu.onPerf = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUPerformancePage.ShowPage(mcdu);
        };
        mcdu.onInit = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUInitPage.ShowPage1(mcdu);
        };
        mcdu.onData = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUDataIndexPage.ShowPage1(mcdu);
        };
        mcdu.onFpln = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUFlightPlanPage.ShowPage(mcdu);
        };
        mcdu.onRad = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUNavRadioPage.ShowPage(mcdu);
        };
        mcdu.onFuel = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUFuelPredPage.ShowPage(mcdu);
        };
        mcdu.onMenu = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUMenuPage.ShowPage(mcdu);
        };
    }
}