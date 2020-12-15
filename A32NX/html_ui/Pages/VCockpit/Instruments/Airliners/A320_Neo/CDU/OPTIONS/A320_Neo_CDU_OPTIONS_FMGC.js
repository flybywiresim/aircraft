class CDU_OPTIONS_FMGC {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        mcdu.setTemplate([
            ["A32NX OPTIONS FMGC"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN[color]cyan"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDU_OPTIONS_MainMenu.ShowPage(mcdu);
        };
    }
}
