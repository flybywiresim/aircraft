class CDU_OPTIONS_MCDU_KB {
    static ShowPage(mcdu) {

        mcdu.clearDisplay();

        const mcduInput = NXDataStore.get("MCDU_KB_INPUT", "DISABLED");
        let storedMcduTimeout = parseInt(NXDataStore.get("CONFIG_MCDU_KB_TIMEOUT", "60"));
        if (storedMcduTimeout === 0) {
            storedMcduTimeout = "NONE";
        }

        const [enable, disable] = mcduInput === "ENABLED" ? ["{green}ALLOW INPUT{end}", "{cyan}*NO INPUT{end}"] : ["{cyan}*ALLOW INPUT{end}", "{green}NO INPUT{end}"];

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
            ["", "", "MCDU KEYBOARD"],
            [enable],
            [""],
            [disable],
            [""],
            [""],
            [""],
            [""],
            ["\xa0INPUT TIMEOUT"],
            [`{small}[S]{end}{cyan}${storedMcduTimeout}*{end}`],
            [""],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (mcduInput !== "ENABLED") {
                mcdu.clearFocus();
                NXDataStore.set("MCDU_KB_INPUT", "ENABLED");
                mcdu.addNewMessage(NXFictionalMessages.reloadPlaneApply);
                CDU_OPTIONS_MCDU_KB.ShowPage(mcdu);
            }
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (mcduInput !== "DISABLED") {
                mcdu.clearFocus();
                NXDataStore.set("MCDU_KB_INPUT", "DISABLED");
                mcdu.addNewMessage(NXFictionalMessages.reloadPlaneApply);
                CDU_OPTIONS_MCDU_KB.ShowPage(mcdu);
            }
        };

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[4] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                NXDataStore.set("CONFIG_MCDU_KB_TIMEOUT", "60");
            } else if (isNaN(value) || parseInt(value) > 120) {
                mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
            } else {
                NXDataStore.set("CONFIG_MCDU_KB_TIMEOUT", value);
            }
            CDU_OPTIONS_MCDU_KB.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };
    }
}
