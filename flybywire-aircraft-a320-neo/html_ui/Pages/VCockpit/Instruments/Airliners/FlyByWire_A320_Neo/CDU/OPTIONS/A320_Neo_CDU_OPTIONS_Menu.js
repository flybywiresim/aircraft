class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            [""],
            ["<AOC"],
            [""],
            [""],
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
            CDU_OPTIONS_AOC.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUMenuPage.ShowPage(mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
    }
}
