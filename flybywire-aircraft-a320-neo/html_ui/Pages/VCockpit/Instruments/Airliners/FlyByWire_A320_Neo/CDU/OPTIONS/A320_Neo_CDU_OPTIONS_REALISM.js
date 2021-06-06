class CDU_OPTIONS_REALISM {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        const storedDMCTestTime = parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15"));
        let storedMcduTimeout = parseInt(NXDataStore.get("CONFIG_MCDU_KB_TIMEOUT", "60"));
        if (storedMcduTimeout === 0)
            storedMcduTimeout = "NONE";

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["\xa0ADIRS", "DMC SELF-TEST\xa0"],
            ["<ALIGN TIME", `{small}[S]{end}{cyan}${storedDMCTestTime}*{end}`],
            ["\xa0MCDU", "INPUT TIMEOUT\xa0"],
            ["<ALLOW INPUT", `{small}[S]{end}{cyan}${storedMcduTimeout}*{end}`],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = () => {
            CDU_OPTIONS_ADIRS.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_MCDU_KB.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", "15");
            } else if (isNaN(value) || parseInt(value) < 5 || parseInt(value) > 40) {
                mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
            } else {
                NXDataStore.set("CONFIG_SELF_TEST_TIME", value);
            }
            mcdu.clearFocus();
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[1] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_MCDU_KB_TIMEOUT", "60");
            } else if (isNaN(value) || parseInt(value) > 120) {
                mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
            } else {
                NXDataStore.set("CONFIG_MCDU_KB_TIMEOUT", value);
            }
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
