class CDU_OPTIONS_MainMenu {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'MAINT';

        mcdu.setTemplate([
            ["A32NX OPTIONS"],
            [""],
            ["<FMGC[color]inop"],
            [""],
            ["<AOC"],
            [""],
            ["<REALISM"],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["<RETURN"]
        ]);

        mcdu.onLeftInput[0] = () => {
            // CDU_OPTIONS_FMGC.ShowPage(mcdu);
        };
        mcdu.onLeftInput[1] = () => {
            CDU_OPTIONS_AOC.ShowPage(mcdu);
        };
        mcdu.onLeftInput[2] = () => {
            CDU_OPTIONS_REALISM.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.leftInputDelay[2] = () => {
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
