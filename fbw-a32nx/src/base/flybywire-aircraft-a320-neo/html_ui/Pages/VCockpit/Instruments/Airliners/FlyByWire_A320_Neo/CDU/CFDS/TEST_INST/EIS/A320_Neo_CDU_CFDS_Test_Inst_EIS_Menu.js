class CDU_CFDS_Test_Inst_EIS_Menu {
    static ShowPage(mcdu, eisIndex) {
        mcdu.clearDisplay();
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

        mcdu.onUnload = () => SimVar.SetSimVarValue(`L:A32NX_DMC_DISPLAYTEST:${eisIndex}`, "Enum", 0);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUCfdsTestInst.ShowPage(mcdu);
        };
        mcdu.rightInputDelay[3] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[3] = () => {
            CDU_CFDS_Test_Inst_EIS_Tests.ShowPage(mcdu, eisIndex);
        };
    }
}
