class CDU_CFDS_Test_Inst_EIS_Menu {
    static ShowPage(fmc, mcdu, eisIndex) {
        mcdu.setCurrentPage(() => {
            CDU_CFDS_Test_Inst_EIS_Menu.ShowPage(fmc, mcdu, eisIndex);
        });
        SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 1);
        const title = "EIS ( DMC " + eisIndex + " )";
        mcdu.setTemplate([
            [title],
            [""],
            ["<LAST LEG REPORT[color]inop"],
            [""],
            ["<PREVIOUS LEGS REPORT[color]inop"],
            [""],
            ["<LRU IDENTIFICATION[color]inop"],
            [""],
            ["<ENGINES[color]inop", "TEST>"],
            [""],
            ["<DUMP BITE MEMORY[color]inop"],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUCfdsTestInst.ShowPage(fmc, mcdu);
        };
        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS_Tests.ShowPage(fmc, mcdu, eisIndex);
        };

        // FIXME pages should not override these
        // Button key overrides
        mcdu.onDir = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUDirectToPage.ShowPage(fmc, mcdu);
        };
        mcdu.onProg = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUProgressPage.ShowPage(fmc, mcdu);
        };
        mcdu.onPerf = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUPerformancePage.ShowPage(fmc, mcdu);
        };
        mcdu.onInit = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUInitPage.ShowPage1(fmc, mcdu);
        };
        mcdu.onData = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUDataIndexPage.ShowPage1(fmc, mcdu);
        };
        mcdu.onFpln = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUFlightPlanPage.ShowPage(fmc, mcdu);
        };
        mcdu.onRad = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUNavRadioPage.ShowPage(fmc, mcdu);
        };
        mcdu.onFuel = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUFuelPredPage.ShowPage(fmc, mcdu);
        };
        mcdu.onMenu = () => {
            SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);
            CDUMenuPage.ShowPage(fmc, mcdu);
        };

    }
}
