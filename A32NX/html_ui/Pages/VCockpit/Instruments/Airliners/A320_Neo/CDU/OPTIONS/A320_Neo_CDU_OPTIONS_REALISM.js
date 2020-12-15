class CDU_OPTIONS_REALISM {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();

        mcdu.setTemplate([
            ["A32NX OPTIONS REALISM"],
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
