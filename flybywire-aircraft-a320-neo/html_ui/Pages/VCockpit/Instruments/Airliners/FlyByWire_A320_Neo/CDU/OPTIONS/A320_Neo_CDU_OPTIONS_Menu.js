class CDU_OPTIONS_MainMenu {
    static ShowPage(fmc, mcdu) {
        mcdu.setCurrentPage(() => {
            CDU_OPTIONS_MainMenu.ShowPage(fmc, mcdu);
        }, 'MAINT');

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
            CDU_OPTIONS_AOC.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUMenuPage.ShowPage(fmc, mcdu);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
    }
}
