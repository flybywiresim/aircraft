class CDU_OPTIONS_MCDU_RESET {
    static ShowPage(mcdu, input) {
        mcdu.clearDisplay();
        mcdu.addNewMessage(NXFictionalMessages.resetMcdu);

        // RESET MCDU
        mcdu.setTemplate([
            ["RESET MCDU"],
            ["\xa0{red}WARNING: DATA LOSS{end}"],
            ["YES"],
            [""],
            ["NO"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);
        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = () => {
            if (input) {
                Coherent.trigger('UNFOCUS_INPUT_FIELD');
                NXDataStore.set("MCDU_KB_INPUT", input);
            }
            window.document.location.reload(true);
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_MCDU_KB.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MCDU_KB.ShowPage(mcdu);
        };
    }
}
